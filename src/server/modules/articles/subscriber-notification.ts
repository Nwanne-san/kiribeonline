import { APP_URL, sendTransactionalEmail } from "@/lib/email/resend";
import { renderNewArticlePublishedEmail } from "@/lib/email/templates/new-article-published";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { PublicRoutes } from "@/routes/public.routes";

export type NotifySubscribersInput = {
  /**
   * Article ID. When provided, the notifier atomically claims the row (sets
   * `publishNotifiedAt`) before sending — concurrent callers (cron +
   * on-demand promotion) see the second attempt as a no-op instead of a
   * double-send. Omit only when the caller has already claimed the row.
   */
  articleId?: string | number;
  articleTitle: string;
  articleSlug: string;
  articleExcerpt?: string | null;
  categoryName?: string | null;
};

const BATCH_SIZE = 10;

/**
 * Dispatch an email notification to all confirmed subscribers when an article
 * transitions to `published`.
 *
 * Runs fire-and-forget: failure to send to one or all subscribers is logged and
 * will never block the publishing mutation or cron handler.
 *
 * Dedupe: when `articleId` is provided the notifier issues a conditional
 * UPDATE that only succeeds while `publishNotifiedAt IS NULL`. If the row was
 * already claimed by another path (cron vs. on-demand vs. admin update racing
 * on the same publish), the send is skipped.
 */
export async function notifySubscribersOnArticlePublished({
  articleId,
  articleTitle,
  articleSlug,
  articleExcerpt,
  categoryName,
}: NotifySubscribersInput): Promise<{ total: number; sent: number; skipped?: boolean }> {
  try {
    const payload = await getPayloadClient();

    if (articleId !== undefined) {
      // Atomic claim: Postgres serializes concurrent UPDATEs on the same row,
      // so only one caller sees a non-empty `docs` result. The other becomes
      // a no-op — no duplicate emails.
      const claim = await payload.update({
        collection: "articles",
        where: {
          and: [
            { id: { equals: articleId } },
            { publishNotifiedAt: { exists: false } },
          ],
        },
        data: { publishNotifiedAt: new Date().toISOString() },
        overrideAccess: true,
      });
      if (!claim.docs || claim.docs.length === 0) {
        console.info(
          `[subscribers] skip notify — "${articleTitle}" already claimed`
        );
        return { total: 0, sent: 0, skipped: true };
      }
    }

    // Query all confirmed subscribers
    const subscribersResult = await payload.find({
      collection: "subscribers",
      where: { confirmed: { equals: true } },
      pagination: false,
      depth: 0,
      overrideAccess: true,
    });

    const emails = subscribersResult.docs
      .map((doc) => (doc as { email?: string }).email?.trim())
      .filter((email): email is string => Boolean(email && email.includes("@")));

    if (emails.length === 0) {
      return { total: 0, sent: 0 };
    }

    const articleUrl = `${APP_URL}${PublicRoutes.articleDetail.replace(":slug", encodeURIComponent(articleSlug))}`;

    const { subject, html, text } = renderNewArticlePublishedEmail({
      articleTitle,
      articleSlug,
      articleExcerpt,
      articleUrl,
      categoryName,
    });

    let sent = 0;

    // Send in batches to respect rate limits and connection pooling
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const chunk = emails.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        chunk.map((to) =>
          sendTransactionalEmail({
            to,
            subject,
            html,
            text,
            context: "[subscribers] new article",
          })
        )
      );

      for (const res of results) {
        if (res.status === "fulfilled" && res.value === true) {
          sent += 1;
        }
      }
    }

    console.info(
      `[subscribers] notified ${sent}/${emails.length} subscribers for "${articleTitle}"`
    );

    return { total: emails.length, sent };
  } catch (err) {
    console.error(
      `[subscribers] failed to notify subscribers for "${articleTitle}"`,
      err
    );
    return { total: 0, sent: 0 };
  }
}

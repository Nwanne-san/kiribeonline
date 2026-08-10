# Resend production checklist — admin invite emails

Use this when an admin invite lands in the "Invite created — email did not go
out" state on the production site (`kiribeonline.com`). The system never
throws on delivery failure; it always writes an audit row and returns the raw
invite link so the inviter has a fallback. But if you see this repeatedly, one
of the checks below is failing.

The order matters — earlier items are the ones we most often trip over.

## 1. Environment variables on Vercel prod

Go to **Vercel → Project → Settings → Environment Variables** and confirm the
following exist for the **Production** environment:

| Variable | Expected value |
| --- | --- |
| `RESEND_API_KEY` | Live key (`re_live_...`), NOT a test key (`re_test_...`) |
| `RESEND_FROM_EMAIL` | `Kiribé <noreply@send.kiribeonline.com>` (or your verified from) |
| `NEXT_PUBLIC_APP_URL` | `https://www.kiribeonline.com` (or the canonical prod URL, no trailing slash) |

Common misses:
- Key set on Preview only, not Production.
- `NEXT_PUBLIC_APP_URL` left as `http://localhost:3000` → the invite link points at localhost.
- A test key was rotated in but never promoted from Preview → Production.

If you edit any of these, redeploy — env changes don't apply to the running
deployment.

## 2. Sending domain is verified in Resend

Go to <https://resend.com/domains> and confirm `kiribeonline.com` shows
**Verified** (green). If it's yellow / Pending:

- Make sure the SPF, DKIM, and DMARC records were added at the DNS host that
  actually serves `kiribeonline.com`. Cloudflare and Vercel DNS are both fine
  — but the records have to live where the nameserver points.
- Wait 5–10 minutes after adding, then click **Retry verification** in Resend.
- If it still fails, `dig TXT resend._domainkey.kiribeonline.com +short` from
  a terminal — you should see the record Resend gave you.

Until the domain is verified, Resend will only deliver mail to addresses on
the **test allowlist** (usually the account owner). Every other recipient
comes back as `validation_error` and the code returns `false`.

## 3. From address matches the verified domain

`RESEND_FROM_EMAIL` must send from a domain you've verified.

- `Kiribé <noreply@send.kiribeonline.com>` → OK if send.kiribeonline.com is verified.
- `Kiribé <hello@resend.dev>` → OK (Resend's shared testing domain, bounces after 30d).
- `Kiribé <hello@gmail.com>` → REJECTED. Consumer inboxes block relayed mail.

The display name (`Kiribé`) can be anything; the address in the angle
brackets is what Resend validates.

## 4. Check the Resend dashboard logs

Every send attempt (successful or not) shows up at
<https://resend.com/emails>. Filter by "Failed" for the last hour.

The failure reason you'll see is one of:

- **`validation_error`** → the from address, the recipient, or the API key
  isn't allowed (see steps 1–3).
- **`invalid_from_address`** → domain not verified, or the from string is
  malformed. Kick back to step 3.
- **`rate_limit_exceeded`** → free tier is 100 mail/day. Upgrade if you're
  seeing it in production.
- **`api_key_invalid`** → rotated key wasn't promoted to Vercel prod.

## 5. Server logs

The API never surfaces the Resend error to the client (PII risk). All the
detail goes to `console.error`, so pull it from Vercel:

```bash
vercel logs kiribeonline --prod --since 1h | grep -E "email rejected|email failed"
```

Look for lines like:

```
[users] invite email rejected by Resend: validation_error — The from address you provided is not a verified domain.
```

That line tells you exactly which check above is failing.

## 6. Recipient in the sandbox allowlist (test mode only)

If Resend was set up with a **test API key**, mail only reaches addresses
you've explicitly added to the "Test Emails" allowlist in the dashboard.
Anything else comes back as `validation_error`.

Fix: swap in a live key from a paid Resend account, or add the invitee's
address to the allowlist for testing.

## 7. Fallback flow (works today, no config needed)

If everything above is broken, the admin flow *still* completes:

- The user row is created with `status: pending`.
- The API response includes `inviteToken` (raw, one-time).
- The Users page shows a copy-link modal so the inviter can DM/Slack the
  invite link.
- The audit log records `users.invited` with `emailSent: false`.

Nothing is lost — but no one gets an inbox notification. Fix the config first
chance you get.

## 8. After you fix it — verify

1. Invite yourself at a personal address you own.
2. Watch the Resend log at <https://resend.com/emails> for the send.
3. Click the "Accept invite" link in the inbox — it should route to
   `${NEXT_PUBLIC_APP_URL}/admin/accept-invite?token=…` and land on the
   password-setup page.

If any of those three fail, work back through steps 1–6.

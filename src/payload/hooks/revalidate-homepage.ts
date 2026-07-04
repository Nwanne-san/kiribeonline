import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from "payload";
import { revalidateTag } from "next/cache";

const HOMEPAGE_TAG = "homepage";

function safeRevalidate() {
  try {
    revalidateTag(HOMEPAGE_TAG);
  } catch (err) {
    console.warn("[revalidate-homepage] revalidateTag failed", err);
  }
}

export const revalidateHomepageAfterChange: CollectionAfterChangeHook = async ({ context }) => {
  if (context?.skipHooks) return;
  safeRevalidate();
};

export const revalidateHomepageAfterDelete: CollectionAfterDeleteHook = async ({ context }) => {
  if (context?.skipHooks) return;
  safeRevalidate();
};

export const revalidateHomepageGlobalAfterChange: GlobalAfterChangeHook = async ({ context }) => {
  if (context?.skipHooks) return;
  safeRevalidate();
};

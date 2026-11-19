"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateNodesFromDOM } from "@lexical/html";
import {
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
} from "lexical";
import {
  pastedHtmlContainsImages,
  sanitizePastedHtml,
} from "./sanitizePastedHtml";

/**
 * Intercept paste events carrying rich HTML (Google Docs, Word, Notion, etc.)
 * and import them into Lexical preserving bold/italic/underline/lists/
 * headings — instead of the default behavior of flattening to plain text.
 *
 * In-editor copy/paste is left alone: Lexical's own payload
 * (`application/x-lexical-editor`) rides on the same clipboard event, and we
 * return `false` for those so the default handler preserves exact node
 * identity (upload nodes, galleries, embeds all survive).
 */
export function PastePlugin({
  onImagesStripped,
}: {
  /** Called once per paste when we dropped <img> tags, so the UI can toast. */
  onImagesStripped?: () => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const clipboardData =
          event instanceof ClipboardEvent ? event.clipboardData : null;
        if (!clipboardData) return false;

        // In-editor copy carries this MIME type alongside text/html. Defer
        // so the default handler can restore exact node structure (upload
        // nodes, embeds, etc.) — otherwise we'd re-import them as raw HTML.
        if (clipboardData.getData("application/x-lexical-editor")) {
          return false;
        }

        const html = clipboardData.getData("text/html");
        if (!html || !html.trim()) {
          // Plain-text-only paste — let the default handler deal with it.
          return false;
        }

        event.preventDefault();

        const hadImages = pastedHtmlContainsImages(html);
        const sanitized = sanitizePastedHtml(html);

        const parser = new DOMParser();
        const dom = parser.parseFromString(sanitized, "text/html");

        editor.update(() => {
          const nodes = $generateNodesFromDOM(editor, dom);
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            // Use the selection API so block nodes are inserted at a block
            // boundary (splitting the current paragraph if needed) rather
            // than nested inside an inline position.
            selection.insertNodes(nodes);
          } else {
            $insertNodes(nodes);
          }
        });

        if (hadImages && onImagesStripped) onImagesStripped();
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, onImagesStripped]);

  return null;
}

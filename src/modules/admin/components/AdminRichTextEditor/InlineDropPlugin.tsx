"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_LOW, DRAGOVER_COMMAND, DROP_COMMAND } from "lexical";

/**
 * Lets the operator drag image files from their OS / photo app straight
 * onto the editor body — no media-library modal round trip. Files are
 * handed back to the parent, which uploads them (hidden from the library)
 * and queues an UploadNode insert at the caret.
 *
 * We only claim the event when the drag payload is files (otherwise Lexical's
 * own drag-reorder for upload/gallery nodes keeps working), and only when at
 * least one file has an image/* MIME — a stray PDF drop falls through to the
 * browser's default handling rather than silently failing an upload.
 */
export function InlineDropPlugin({
  onFiles,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  /** Set while an upload batch is in flight so a second drop doesn't race. */
  disabled: boolean;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const hasImageFiles = (event: DragEvent): boolean => {
      const items = event.dataTransfer?.items;
      if (!items) return false;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file" && item.type.startsWith("image/")) return true;
      }
      return false;
    };

    const unregisterOver = editor.registerCommand(
      DRAGOVER_COMMAND,
      (event) => {
        if (!(event instanceof DragEvent) || !hasImageFiles(event)) return false;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    const unregisterDrop = editor.registerCommand(
      DROP_COMMAND,
      (event) => {
        if (!(event instanceof DragEvent) || !hasImageFiles(event)) return false;
        if (disabled) {
          // Still consume the event so the browser doesn't navigate to the
          // dropped file — a plain <img src="file://…"> opener surfaces the
          // image outside the app and wipes the operator's draft.
          event.preventDefault();
          return true;
        }
        event.preventDefault();
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
          f.type.startsWith("image/"),
        );
        if (files.length === 0) return true;
        onFiles(files);
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      unregisterOver();
      unregisterDrop();
    };
  }, [editor, onFiles, disabled]);

  return null;
}

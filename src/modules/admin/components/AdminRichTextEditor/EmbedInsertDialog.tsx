"use client";

import { AdminButton } from "@/modules/admin/components/ui/AdminPrimitives";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { useState } from "react";
import { parseEmbed, type ArticleEmbedKind } from "@/lib/embeds/parse-embed";
import { KiribeTextField } from "@/modules/shared/components/ui";

export type EmbedInsertPayload = {
  url: string;
  platform: ArticleEmbedKind;
  embedUrl: string | null;
};

export type EmbedInsertDialogProps = {
  open: boolean;
  onClose: () => void;
  onInsert: (payload: EmbedInsertPayload) => void;
};

/**
 * Paste-a-URL dialog for the EmbedNode. Runs `parseEmbed` and only accepts
 * allow-listed platforms; a valid-but-unsupported host (parsed as `link-card`)
 * is rejected with an inline error rather than inserted.
 */
export function EmbedInsertDialog({ open, onClose, onInsert }: EmbedInsertDialogProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setUrl("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const apply = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a URL to embed.");
      return;
    }
    const parsed = parseEmbed(trimmed);
    if (!parsed) {
      setError("That doesn't look like a valid web address.");
      return;
    }
    if (parsed.platform === "link-card" || !parsed.embedUrl) {
      setError(
        "This host isn't supported. Paste a YouTube, Vimeo, Instagram, TikTok, or Spotify link."
      );
      return;
    }
    onInsert({ url: trimmed, platform: parsed.platform, embedUrl: parsed.embedUrl });
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Insert embed</DialogTitle>
      <DialogContent>
        <DialogContentText className="mb-4 text-[0.8125rem]">
          Paste a link from YouTube, Vimeo, Instagram, TikTok, or Spotify. The
          embed loads only when a reader clicks it.
        </DialogContentText>
        <KiribeTextField
          autoFocus
          fullWidth
          label="URL"
          placeholder="https://youtube.com/watch?v=…"
          value={url}
          error={Boolean(error)}
          errorText={error ?? undefined}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && url.trim()) {
              e.preventDefault();
              apply();
            }
          }}
        />
      </DialogContent>
      <DialogActions className="gap-2 px-6 pb-4">
        <AdminButton variant="secondary" onClick={handleClose}>
          Cancel
        </AdminButton>
        <AdminButton disabled={!url.trim()} onClick={apply}>
          Insert
        </AdminButton>
      </DialogActions>
    </Dialog>
  );
}

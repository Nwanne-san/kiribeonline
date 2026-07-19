"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import { useState } from "react";
import { KiribeTextField } from "@/modules/shared/components/ui";

export type PullQuoteInsertPayload = {
  quote: string;
  attribution: string;
};

export type PullQuoteInsertDialogProps = {
  open: boolean;
  onClose: () => void;
  onInsert: (payload: PullQuoteInsertPayload) => void;
};

/** Small dialog for inserting a branded pull quote (distinct from a blockquote). */
export function PullQuoteInsertDialog({
  open,
  onClose,
  onInsert,
}: PullQuoteInsertDialogProps) {
  const [quote, setQuote] = useState("");
  const [attribution, setAttribution] = useState("");

  const reset = () => {
    setQuote("");
    setAttribution("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const apply = () => {
    const trimmed = quote.trim();
    if (!trimmed) return;
    onInsert({ quote: trimmed, attribution: attribution.trim() });
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Insert pull quote</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <KiribeTextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label="Quote"
            placeholder="A short, punchy line worth pulling out…"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            required
          />
          <KiribeTextField
            fullWidth
            label="Attribution"
            placeholder="Who said it (optional)"
            value={attribution}
            onChange={(e) => setAttribution(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" disabled={!quote.trim()} onClick={apply}>
          Insert
        </Button>
      </DialogActions>
    </Dialog>
  );
}

"use client";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { MediaLibraryGrid } from "@/modules/admin/components/MediaPicker";
import type { AdminMediaRef } from "@/server/modules";
import type { GalleryItem } from "./GalleryNode";

export type GalleryInsertDialogProps = {
  open: boolean;
  onClose: () => void;
  onInsert: (items: GalleryItem[]) => void;
};

/**
 * Multi-select gallery builder. Pick images from the library (toggle), then
 * order them (up/down) and remove before inserting. Images without a resolved
 * URL are ignored so the gallery is always renderable on the public side.
 */
export function GalleryInsertDialog({ open, onClose, onInsert }: GalleryInsertDialogProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);

  const selectedIds = useMemo(() => new Set(items.map((it) => it.id)), [items]);

  const reset = () => setItems([]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggle = (media: AdminMediaRef) => {
    if (!media.url) return; // can't render an image without a URL
    setItems((current) => {
      if (current.some((it) => it.id === media.id)) {
        return current.filter((it) => it.id !== media.id);
      }
      return [...current, { id: media.id, url: media.url as string, alt: media.alt ?? "" }];
    });
  };

  const move = (index: number, delta: number) => {
    setItems((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (id: string) => {
    setItems((current) => current.filter((it) => it.id !== id));
  };

  const apply = () => {
    if (items.length === 0) return;
    onInsert(items);
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Insert gallery</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
          Choose images
        </Typography>
        <MediaLibraryGrid onSelect={toggle} selectedIds={selectedIds} />

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
          Selected ({items.length}) — order top to bottom
        </Typography>
        {items.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            No images selected yet. Tap images above to add them.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {items.map((item, index) => (
              <Stack
                key={item.id}
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1,
                }}
              >
                <Box
                  component="img"
                  src={item.url}
                  alt={item.alt}
                  sx={{
                    width: 48,
                    height: 48,
                    objectFit: "cover",
                    borderRadius: 1,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="caption" sx={{ flex: 1, minWidth: 0 }} noWrap>
                  {item.alt || item.url}
                </Typography>
                <IconButton
                  size="small"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Move down"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Remove from gallery"
                  color="error"
                  onClick={() => remove(item.id)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" disabled={items.length === 0} onClick={apply}>
          Insert gallery
        </Button>
      </DialogActions>
    </Dialog>
  );
}

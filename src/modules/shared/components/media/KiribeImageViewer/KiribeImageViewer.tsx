"use client";

import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import { useCallback, useEffect, useState } from "react";
import { KiribeImage } from "../KiribeImage";

export type KiribeImageViewerProps = {
  src?: string | { url?: string | null; filename?: string | null } | null;
  alt: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
};

/** Click-to-expand lightbox for article hero and gallery images. */
export function KiribeImageViewer({
  src,
  alt,
  trigger,
  open: controlledOpen,
  onClose,
}: KiribeImageViewerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  return (
    <>
      {trigger ? (
        <Box
          onClick={() => {
            if (!controlledOpen) setInternalOpen(true);
          }}
          sx={{ cursor: "pointer" }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              if (!controlledOpen) setInternalOpen(true);
            }
          }}
        >
          {trigger}
        </Box>
      ) : null}

      <Dialog
        open={isOpen}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: "rgba(0,0,0,0.92)",
              boxShadow: "none",
              // Opt out of the themed light dialog border — this is a dark
              // media lightbox, not a content dialog.
              border: "none",
            },
          },
        }}
      >
        <IconButton
          onClick={handleClose}
          aria-label="Close image viewer"
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "common.white",
            zIndex: 1,
          }}
        >
          <CloseIcon />
        </IconButton>
        <Box sx={{ position: "relative", width: "100%", pt: "56.25%" }}>
          <KiribeImage src={src} alt={alt} fill style={{ objectFit: "contain" }} sizes="100vw" />
        </Box>
      </Dialog>
    </>
  );
}

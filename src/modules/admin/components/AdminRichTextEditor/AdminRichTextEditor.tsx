"use client";

import CodeIcon from "@mui/icons-material/Code";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import ImageIcon from "@mui/icons-material/Image";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import RedoIcon from "@mui/icons-material/Redo";
import UndoIcon from "@mui/icons-material/Undo";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingNode,
  QuoteNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import {
  ListItemNode,
  ListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import {
  $createCodeNode,
  $isCodeNode,
  CodeHighlightNode,
  CodeNode,
} from "@lexical/code";
import {
  $createLinkNode,
  $isLinkNode,
  AutoLinkNode,
  LinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import {
  HorizontalRuleNode,
  INSERT_HORIZONTAL_RULE_COMMAND,
} from "@lexical/react/LexicalHorizontalRuleNode";
import { $setBlocksType } from "@lexical/selection";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminCard, AdminFieldLabel } from "@/modules/admin/components/AdminUi";
import { KiribeTextField } from "@/modules/shared/components/ui";
import { MediaPicker } from "@/modules/admin/components/MediaPicker";
import type { AdminMediaRef } from "@/lib/admin/types";
import { normalizeLexicalBody } from "@/lib/admin/text-to-lexical";

const theme = {
  paragraph: "kiribe-lexical-p",
  heading: {
    h1: "kiribe-lexical-h1",
    h2: "kiribe-lexical-h2",
    h3: "kiribe-lexical-h3",
    h4: "kiribe-lexical-h4",
    h5: "kiribe-lexical-h5",
    h6: "kiribe-lexical-h6",
  },
  list: {
    ul: "kiribe-lexical-ul",
    ol: "kiribe-lexical-ol",
    listitem: "kiribe-lexical-li",
  },
  quote: "kiribe-lexical-quote",
  code: "kiribe-lexical-code",
  link: "kiribe-lexical-link",
  text: {
    bold: "kiribe-lexical-bold",
    italic: "kiribe-lexical-italic",
    underline: "kiribe-lexical-underline",
    strikethrough: "kiribe-lexical-strike",
    code: "kiribe-lexical-inline-code",
  },
};

const BLOCK_OPTIONS: { value: string; label: string }[] = [
  { value: "paragraph", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "h4", label: "Heading 4" },
  { value: "h5", label: "Heading 5" },
  { value: "h6", label: "Heading 6" },
  { value: "quote", label: "Quote" },
  { value: "code", label: "Code block" },
];

function Toolbar({
  onOpenImage,
  onOpenLink,
}: {
  onOpenImage: () => void;
  onOpenLink: (currentUrl: string | null) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState("paragraph");
  const [activeMarks, setActiveMarks] = useState<Set<string>>(new Set());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [linkActive, setLinkActive] = useState(false);
  const [currentLinkUrl, setCurrentLinkUrl] = useState<string | null>(null);

  const updateToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const marks = new Set<string>();
      if (selection.hasFormat("bold")) marks.add("bold");
      if (selection.hasFormat("italic")) marks.add("italic");
      if (selection.hasFormat("underline")) marks.add("underline");
      if (selection.hasFormat("strikethrough")) marks.add("strike");
      if (selection.hasFormat("code")) marks.add("code");
      setActiveMarks(marks);

      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : $findMatchingParent(
              anchorNode,
              (e) => !e.isInline() && e.getParent() !== null
            ) ?? anchorNode.getTopLevelElement() ?? anchorNode;

      if ($isHeadingNode(element)) {
        setBlockType(element.getTag());
      } else if ($isQuoteNode(element)) {
        setBlockType("quote");
      } else if ($isCodeNode(element)) {
        setBlockType("code");
      } else {
        setBlockType("paragraph");
      }

      const linkParent = $findMatchingParent(anchorNode, $isLinkNode);
      if (linkParent && $isLinkNode(linkParent)) {
        setLinkActive(true);
        setCurrentLinkUrl(linkParent.getURL());
      } else {
        setLinkActive(false);
        setCurrentLinkUrl(null);
      }
    });
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(updateToolbar);
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (v) => {
          setCanUndo(v);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (v) => {
          setCanRedo(v);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [editor, updateToolbar]);

  const setBlock = (value: string) => {
    setBlockType(value);
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      if (value === "paragraph") {
        $setBlocksType(selection, () => $createParagraphNode());
      } else if (value === "quote") {
        $setBlocksType(selection, () => $createQuoteNode());
      } else if (value === "code") {
        $setBlocksType(selection, () => $createCodeNode());
      } else {
        $setBlocksType(selection, () => $createHeadingNode(value as HeadingTagType));
      }
    });
  };

  const toggleMark = (mark: "bold" | "italic" | "underline" | "strikethrough" | "code") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, mark);
  };

  const align = (direction: "left" | "center" | "right" | "justify") => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, direction);
  };

  const onClickLink = () => {
    onOpenLink(currentLinkUrl);
  };

  const removeLink = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  };

  return (
    <Stack
      direction="row"
      spacing={0.25}
      flexWrap="wrap"
      sx={{
        rowGap: 0.5,
        p: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        position: "sticky",
        top: 0,
        zIndex: 1,
      }}
    >
      <IconButton
        size="small"
        aria-label="Undo"
        disabled={!canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        <UndoIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        aria-label="Redo"
        disabled={!canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        <RedoIcon fontSize="small" />
      </IconButton>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Box sx={{ minWidth: 140 }}>
        <KiribeTextField
          select
          size="small"
          fullWidth
          value={blockType}
          onChange={(e) => setBlock(e.target.value)}
          sx={{ "& .MuiInputBase-root": { fontSize: "0.75rem", height: 32 } }}
        >
          {BLOCK_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </KiribeTextField>
      </Box>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <IconButton
        size="small"
        aria-label="Bold"
        color={activeMarks.has("bold") ? "primary" : "default"}
        onClick={() => toggleMark("bold")}
      >
        <FormatBoldIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        aria-label="Italic"
        color={activeMarks.has("italic") ? "primary" : "default"}
        onClick={() => toggleMark("italic")}
      >
        <FormatItalicIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        aria-label="Underline"
        color={activeMarks.has("underline") ? "primary" : "default"}
        onClick={() => toggleMark("underline")}
      >
        <FormatUnderlinedIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        aria-label="Strikethrough"
        color={activeMarks.has("strike") ? "primary" : "default"}
        onClick={() => toggleMark("strikethrough")}
      >
        <FormatStrikethroughIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        aria-label="Inline code"
        color={activeMarks.has("code") ? "primary" : "default"}
        onClick={() => toggleMark("code")}
      >
        <CodeIcon fontSize="small" />
      </IconButton>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <IconButton
        size="small"
        aria-label="Bullet list"
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
      >
        <FormatListBulletedIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        aria-label="Numbered list"
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
      >
        <FormatListNumberedIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        aria-label="Blockquote"
        color={blockType === "quote" ? "primary" : "default"}
        onClick={() => setBlock(blockType === "quote" ? "paragraph" : "quote")}
      >
        <FormatQuoteIcon fontSize="small" />
      </IconButton>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <IconButton
        size="small"
        aria-label="Align left"
        onClick={() => align("left")}
      >
        <FormatAlignLeftIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        aria-label="Align center"
        onClick={() => align("center")}
      >
        <FormatAlignCenterIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        aria-label="Align right"
        onClick={() => align("right")}
      >
        <FormatAlignRightIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        aria-label="Justify"
        onClick={() => align("justify")}
      >
        <FormatAlignJustifyIcon fontSize="small" />
      </IconButton>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <IconButton
        size="small"
        aria-label={linkActive ? "Edit link" : "Insert link"}
        color={linkActive ? "primary" : "default"}
        onClick={onClickLink}
      >
        <LinkIcon fontSize="small" />
      </IconButton>
      {linkActive && (
        <IconButton size="small" aria-label="Remove link" onClick={removeLink}>
          <LinkOffIcon fontSize="small" />
        </IconButton>
      )}
      <IconButton
        size="small"
        aria-label="Horizontal rule"
        onClick={() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)}
      >
        <HorizontalRuleIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="Insert image" onClick={onOpenImage}>
        <ImageIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}

function OnChangePlugin({
  onChange,
}: {
  onChange: (json: Record<string, unknown>) => void;
}) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      onChange(editorState.toJSON() as unknown as Record<string, unknown>);
    });
  }, [editor, onChange]);
  return null;
}

function InsertUploadPlugin({ media }: { media: AdminMediaRef | null }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!media) return;
    editor.update(() => {
      const selection = $getSelection();
      const uploadNode = {
        type: "upload",
        version: 2,
        relationTo: "media",
        value: media.id,
        fields: null,
        format: "",
        indent: 0,
      };
      if ($isRangeSelection(selection)) {
        selection.insertNodes([uploadNode as never]);
      }
    });
  }, [editor, media]);
  return null;
}

function InsertLinkPlugin({
  pending,
  onApplied,
}: {
  pending: { url: string } | null;
  onApplied: () => void;
}) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!pending) return;
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        onApplied();
        return;
      }
      if (selection.isCollapsed()) {
        // Insert the URL as the link text when nothing is selected.
        const linkNode = $createLinkNode(pending.url);
        linkNode.append(...selection.getNodes());
        selection.insertNodes([linkNode]);
      } else {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, pending.url);
      }
      onApplied();
    });
  }, [editor, pending, onApplied]);
  return null;
}

export type AdminRichTextEditorProps = {
  label?: string;
  value?: Record<string, unknown> | null;
  onChange: (value: Record<string, unknown>) => void;
  error?: string;
  required?: boolean;
};

export function AdminRichTextEditor({
  label = "Body",
  value,
  onChange,
  error,
  required,
}: AdminRichTextEditorProps) {
  const [imageDialog, setImageDialog] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<AdminMediaRef | null>(null);
  const [linkDialog, setLinkDialog] = useState<{ url: string } | null>(null);
  const [pendingLink, setPendingLink] = useState<{ url: string } | null>(null);

  const initialConfig = useMemo(
    () => ({
      namespace: "KiribeArticleBody",
      theme,
      onError: (e: Error) => console.error(e),
      editorState: JSON.stringify(normalizeLexicalBody(value)),
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        LinkNode,
        AutoLinkNode,
        CodeNode,
        CodeHighlightNode,
        HorizontalRuleNode,
      ],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
    []
  );

  return (
    <AdminCard sx={{ p: 0, overflow: "hidden" }}>
      <Box sx={{ p: 2, pb: 0 }}>
        <AdminFieldLabel label={label} required={required} />
      </Box>
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar
          onOpenImage={() => setImageDialog(true)}
          onOpenLink={(currentUrl) => setLinkDialog({ url: currentUrl ?? "" })}
        />
        <Box
          sx={{
            minHeight: 360,
            px: 2,
            py: 1.5,
            bgcolor: "background.default",
            position: "relative",
            "& .kiribe-lexical-p": { mb: 1.5, lineHeight: 1.7 },
            "& .kiribe-lexical-h1": { fontSize: "2rem", fontWeight: 700, mt: 2, mb: 1 },
            "& .kiribe-lexical-h2": { fontSize: "1.5rem", fontWeight: 700, mt: 2, mb: 1 },
            "& .kiribe-lexical-h3": { fontSize: "1.25rem", fontWeight: 600, mt: 1.5, mb: 1 },
            "& .kiribe-lexical-h4": { fontSize: "1.125rem", fontWeight: 600, mt: 1.5, mb: 0.75 },
            "& .kiribe-lexical-h5": { fontSize: "1rem", fontWeight: 600, mt: 1.25, mb: 0.5 },
            "& .kiribe-lexical-h6": { fontSize: "0.875rem", fontWeight: 600, mt: 1.25, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.05em" },
            "& .kiribe-lexical-ul, & .kiribe-lexical-ol": { pl: 3, mb: 1.5 },
            "& .kiribe-lexical-li": { mb: 0.5 },
            "& .kiribe-lexical-quote": {
              borderLeft: "3px solid",
              borderColor: "secondary.main",
              pl: 2,
              ml: 0,
              my: 2,
              fontStyle: "italic",
              color: "text.secondary",
            },
            "& .kiribe-lexical-code": {
              display: "block",
              bgcolor: "#0F172A",
              color: "#E2E8F0",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "0.875rem",
              p: 2,
              borderRadius: 1,
              my: 2,
              overflowX: "auto",
            },
            "& .kiribe-lexical-inline-code": {
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              bgcolor: "rgba(0,0,0,0.06)",
              px: 0.5,
              py: 0.125,
              borderRadius: 0.5,
              fontSize: "0.9em",
            },
            "& .kiribe-lexical-link": {
              color: "primary.main",
              textDecoration: "underline",
            },
            "& .kiribe-lexical-bold": { fontWeight: 700 },
            "& .kiribe-lexical-italic": { fontStyle: "italic" },
            "& .kiribe-lexical-underline": { textDecoration: "underline" },
            "& .kiribe-lexical-strike": { textDecoration: "line-through" },
            "& hr": { my: 3, border: 0, borderTop: "1px solid", borderColor: "divider" },
          }}
        >
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                style={{ outline: "none", minHeight: 320 }}
                aria-label={label}
              />
            }
            placeholder={
              <Box
                component="span"
                sx={{
                  color: "text.secondary",
                  position: "absolute",
                  top: 12,
                  left: 16,
                  opacity: 0.5,
                }}
              >
                Write article content…
              </Box>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <HorizontalRulePlugin />
          <OnChangePlugin onChange={onChange} />
          <InsertUploadPlugin media={pendingUpload} />
          <InsertLinkPlugin
            pending={pendingLink}
            onApplied={() => setPendingLink(null)}
          />
        </Box>
      </LexicalComposer>
      {error && (
        <Box sx={{ px: 2, pb: 2, color: "error.main", fontSize: "0.75rem" }}>
          {error}
        </Box>
      )}

      {/* Image insertion */}
      <Dialog
        open={imageDialog}
        onClose={() => setImageDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Insert image</DialogTitle>
        <DialogContent>
          <MediaPicker
            label="Body image"
            value={null}
            onChange={(media) => {
              if (media) {
                setPendingUpload(media);
                setTimeout(() => setPendingUpload(null), 0);
              }
              setImageDialog(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Link insertion */}
      <Dialog
        open={linkDialog !== null}
        onClose={() => setLinkDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{linkDialog?.url ? "Edit link" : "Insert link"}</DialogTitle>
        <DialogContent>
          <KiribeTextField
            autoFocus
            fullWidth
            label="URL"
            placeholder="https://example.com"
            value={linkDialog?.url ?? ""}
            onChange={(e) =>
              setLinkDialog({ url: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && linkDialog?.url) {
                e.preventDefault();
                setPendingLink({ url: linkDialog.url });
                setLinkDialog(null);
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!linkDialog?.url}
            onClick={() => {
              if (linkDialog?.url) {
                setPendingLink({ url: linkDialog.url });
                setLinkDialog(null);
              }
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </AdminCard>
  );
}

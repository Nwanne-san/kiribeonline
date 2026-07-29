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
import CollectionsIcon from "@mui/icons-material/Collections";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import ImageIcon from "@mui/icons-material/Image";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import RedoIcon from "@mui/icons-material/Redo";
import UndoIcon from "@mui/icons-material/Undo";
import Box from "@mui/material/Box";
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
  $insertNodes,
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
import { AdminButton } from "@/modules/admin/components/ui/AdminPrimitives";
import { KiribeTextField } from "@/modules/shared/components/ui";
import { MediaPicker } from "@/modules/admin/components/MediaPicker";
import type { AdminMediaRef } from "@/server/modules";
import { normalizeLexicalBody } from "@/server/shared/text-to-lexical";
import { $createUploadNode, UploadNode } from "./UploadNode";
import { $createEmbedNode, EmbedNode } from "./EmbedNode";
import { $createPullQuoteNode, PullQuoteNode } from "./PullQuoteNode";
import { $createGalleryNode, GalleryNode, type GalleryItem } from "./GalleryNode";
import {
  EmbedInsertDialog,
  type EmbedInsertPayload,
} from "./EmbedInsertDialog";
import {
  PullQuoteInsertDialog,
  type PullQuoteInsertPayload,
} from "./PullQuoteInsertDialog";
import { GalleryInsertDialog } from "./GalleryInsertDialog";

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

/** Schemes we allow in article links. Everything else (javascript:, data:,
 * vbscript: …) is rejected so a link can't run script when clicked. */
const ALLOWED_LINK_SCHEMES = new Set(["http", "https", "mailto"]);

type LinkSanitizeResult = { url: string } | { error: string };

/**
 * Validate/normalise a URL typed into the link dialog.
 *
 * - Control chars and whitespace are stripped first, so obfuscations like
 *   `java\tscript:` collapse to `javascript:` and get caught.
 * - Explicit schemes must be http/https/mailto; anything else is rejected.
 * - Relative/anchor targets (`/path`, `#id`, `?q`) pass through untouched.
 * - Scheme-relative (`//host`) and bare (`example.com`) URLs default to https.
 *
 * A "scheme" containing a dot (e.g. `example.com:8080`) is treated as a
 * host:port, not a scheme, so bare domains with ports still work.
 */
function sanitizeLinkUrl(raw: string): LinkSanitizeResult {
  const cleaned = raw.replace(/[\u0000-\u0020\u007f-\u009f]/g, "");
  if (!cleaned) return { error: "Enter a URL." };

  // Scheme-relative (`//host`) → default to https. Checked before the relative
  // branch below so it isn't swallowed by the leading-slash test.
  if (cleaned.startsWith("//")) return { url: `https:${cleaned}` };

  // Relative paths / anchors / queries stay as-is (internal links).
  if (/^[/#?]/.test(cleaned)) return { url: cleaned };

  const schemeMatch = cleaned.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (schemeMatch && !schemeMatch[1].includes(".")) {
    const scheme = schemeMatch[1].toLowerCase();
    if (ALLOWED_LINK_SCHEMES.has(scheme)) return { url: cleaned };
    return { error: "Only http, https and mailto links are allowed." };
  }

  // No scheme — a bare domain like `example.com`; default to https.
  return { url: `https://${cleaned}` };
}

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
  onOpenEmbed,
  onOpenPullQuote,
  onOpenGallery,
}: {
  onOpenImage: () => void;
  onOpenLink: (currentUrl: string | null) => void;
  onOpenEmbed: () => void;
  onOpenPullQuote: () => void;
  onOpenGallery: () => void;
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
      className="gap-y-1 p-2 border-b border-border bg-surface sticky top-0 z-[1]"
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

      <Divider orientation="vertical" flexItem className="mx-1" />

      <Box className="min-w-[140px]">
        <KiribeTextField
          select
          size="small"
          fullWidth
          value={blockType}
          onChange={(e) => setBlock(e.target.value)}
          className="[&_.MuiInputBase-root]:text-xs [&_.MuiInputBase-root]:h-8"
        >
          {BLOCK_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </KiribeTextField>
      </Box>

      <Divider orientation="vertical" flexItem className="mx-1" />

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

      <Divider orientation="vertical" flexItem className="mx-1" />

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

      <Divider orientation="vertical" flexItem className="mx-1" />

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

      <Divider orientation="vertical" flexItem className="mx-1" />

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
      <IconButton size="small" aria-label="Insert gallery" onClick={onOpenGallery}>
        <CollectionsIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="Insert embed" onClick={onOpenEmbed}>
        <OndemandVideoIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="Insert pull quote" onClick={onOpenPullQuote}>
        <FormatQuoteRoundedIcon fontSize="small" />
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
      const uploadNode = $createUploadNode({
        relationTo: "media",
        // Coerce numeric-string ids to numbers for the Postgres relationship
        // (matches the article relationship handling on the server).
        value: /^\d+$/.test(media.id) ? Number(media.id) : media.id,
        src: media.url,
        altText: media.alt,
      });
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertNodes([uploadNode]);
      } else {
        // No caret (e.g. inserted from a toolbar button) — append to the root.
        $insertNodes([uploadNode]);
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

function InsertEmbedPlugin({
  pending,
  onApplied,
}: {
  pending: EmbedInsertPayload | null;
  onApplied: () => void;
}) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!pending) return;
    editor.update(() => {
      const node = $createEmbedNode({
        url: pending.url,
        platform: pending.platform,
        embedUrl: pending.embedUrl,
      });
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertNodes([node]);
      } else {
        $insertNodes([node]);
      }
    });
    onApplied();
  }, [editor, pending, onApplied]);
  return null;
}

function InsertPullQuotePlugin({
  pending,
  onApplied,
}: {
  pending: PullQuoteInsertPayload | null;
  onApplied: () => void;
}) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!pending) return;
    editor.update(() => {
      const node = $createPullQuoteNode({
        quote: pending.quote,
        attribution: pending.attribution,
      });
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertNodes([node]);
      } else {
        $insertNodes([node]);
      }
    });
    onApplied();
  }, [editor, pending, onApplied]);
  return null;
}

function InsertGalleryPlugin({
  pending,
  onApplied,
}: {
  pending: GalleryItem[] | null;
  onApplied: () => void;
}) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!pending) return;
    editor.update(() => {
      const node = $createGalleryNode({ items: pending });
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertNodes([node]);
      } else {
        $insertNodes([node]);
      }
    });
    onApplied();
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
  const [linkError, setLinkError] = useState<string | null>(null);
  const [pendingLink, setPendingLink] = useState<{ url: string } | null>(null);
  const [embedDialog, setEmbedDialog] = useState(false);
  const [pendingEmbed, setPendingEmbed] = useState<EmbedInsertPayload | null>(null);
  const [pullQuoteDialog, setPullQuoteDialog] = useState(false);
  const [pendingPullQuote, setPendingPullQuote] = useState<PullQuoteInsertPayload | null>(null);
  const [galleryDialog, setGalleryDialog] = useState(false);
  const [pendingGallery, setPendingGallery] = useState<GalleryItem[] | null>(null);

  const applyLink = () => {
    const raw = linkDialog?.url ?? "";
    const result = sanitizeLinkUrl(raw);
    if ("error" in result) {
      setLinkError(result.error);
      return;
    }
    setPendingLink({ url: result.url });
    setLinkDialog(null);
    setLinkError(null);
  };

  const closeLinkDialog = () => {
    setLinkDialog(null);
    setLinkError(null);
  };

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
        UploadNode,
        EmbedNode,
        PullQuoteNode,
        GalleryNode,
      ],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
    []
  );

  return (
    <AdminCard className="p-0 overflow-hidden">
      <Box className="p-4 pb-0">
        <AdminFieldLabel label={label} required={required} />
      </Box>
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar
          onOpenImage={() => setImageDialog(true)}
          onOpenLink={(currentUrl) => {
            setLinkError(null);
            setLinkDialog({ url: currentUrl ?? "" });
          }}
          onOpenEmbed={() => setEmbedDialog(true)}
          onOpenPullQuote={() => setPullQuoteDialog(true)}
          onOpenGallery={() => setGalleryDialog(true)}
        />
        <Box className="kiribe-lexical-editor min-h-[360px] px-4 py-3 bg-surface relative">
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
                className="text-ink-secondary absolute top-3 left-4 opacity-50"
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
          <InsertEmbedPlugin
            pending={pendingEmbed}
            onApplied={() => setPendingEmbed(null)}
          />
          <InsertPullQuotePlugin
            pending={pendingPullQuote}
            onApplied={() => setPendingPullQuote(null)}
          />
          <InsertGalleryPlugin
            pending={pendingGallery}
            onApplied={() => setPendingGallery(null)}
          />
        </Box>
      </LexicalComposer>
      {error && (
        <Box className="px-4 pb-4 text-danger text-[0.75rem]">
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
        onClose={closeLinkDialog}
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
            error={Boolean(linkError)}
            errorText={linkError ?? undefined}
            onChange={(e) => {
              setLinkDialog({ url: e.target.value });
              if (linkError) setLinkError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && linkDialog?.url) {
                e.preventDefault();
                applyLink();
              }
            }}
          />
        </DialogContent>
        <DialogActions className="gap-2 px-6 pb-4">
          <AdminButton variant="secondary" onClick={closeLinkDialog}>
            Cancel
          </AdminButton>
          <AdminButton disabled={!linkDialog?.url} onClick={applyLink}>
            Apply
          </AdminButton>
        </DialogActions>
      </Dialog>

      {/* Embed insertion */}
      <EmbedInsertDialog
        open={embedDialog}
        onClose={() => setEmbedDialog(false)}
        onInsert={(payload) => {
          setPendingEmbed(payload);
          setEmbedDialog(false);
        }}
      />

      {/* Pull quote insertion */}
      <PullQuoteInsertDialog
        open={pullQuoteDialog}
        onClose={() => setPullQuoteDialog(false)}
        onInsert={(payload) => {
          setPendingPullQuote(payload);
          setPullQuoteDialog(false);
        }}
      />

      {/* Gallery insertion */}
      <GalleryInsertDialog
        open={galleryDialog}
        onClose={() => setGalleryDialog(false)}
        onInsert={(items) => {
          setPendingGallery(items);
          setGalleryDialog(false);
        }}
      />
    </AdminCard>
  );
}

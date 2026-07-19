"use client";

import { DecoratorNode } from "lexical";
import type {
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import type { JSX } from "react";
import type { ArticleEmbedKind } from "@/lib/embeds/parse-embed";

/**
 * Custom Lexical node for a media/social embed (PLAN-EMBEDS Step 2).
 *
 * Serialized shape is a plain custom node (`type: "embed"`), so the article
 * `body` field needs no schema change and the public `RichText` renderer picks
 * it up via a matching converter keyed on `type`.
 *
 * Editor preview is a STATIC card only — never a live iframe. The stored
 * `embedUrl` is a convenience mirror; the public renderer re-derives it from
 * `url` and never trusts the stored value (see ArticleEmbed).
 */
export type SerializedEmbedNode = Spread<
  {
    type: "embed";
    url: string;
    platform: ArticleEmbedKind;
    embedUrl: string | null;
  },
  SerializedLexicalNode
>;

const PLATFORM_LABEL: Record<ArticleEmbedKind, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  instagram: "Instagram",
  tiktok: "TikTok",
  spotify: "Spotify",
  "link-card": "Link",
};

export class EmbedNode extends DecoratorNode<JSX.Element> {
  __url: string;
  __platform: ArticleEmbedKind;
  __embedUrl: string | null;

  static getType(): string {
    return "embed";
  }

  static clone(node: EmbedNode): EmbedNode {
    return new EmbedNode(
      { url: node.__url, platform: node.__platform, embedUrl: node.__embedUrl },
      node.__key
    );
  }

  constructor(
    data: { url: string; platform: ArticleEmbedKind; embedUrl: string | null },
    key?: NodeKey
  ) {
    super(key);
    this.__url = data.url;
    this.__platform = data.platform;
    this.__embedUrl = data.embedUrl;
  }

  static importJSON(serialized: SerializedEmbedNode): EmbedNode {
    return new EmbedNode({
      url: serialized.url,
      platform: serialized.platform,
      embedUrl: serialized.embedUrl,
    });
  }

  exportJSON(): SerializedEmbedNode {
    return {
      type: "embed",
      version: 1,
      url: this.__url,
      platform: this.__platform,
      embedUrl: this.__embedUrl,
    };
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.style.margin = "16px 0";
    return div;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    // Degrade to a plain link when serialized to HTML (e.g. RSS/plain export).
    // Re-check the scheme here: a node created via raw API JSON never went
    // through the insert dialog's parseEmbed validation.
    const a = document.createElement("a");
    a.setAttribute("href", /^https?:\/\//i.test(this.__url) ? this.__url : "#");
    a.setAttribute("rel", "noopener noreferrer");
    a.textContent = this.__url;
    return { element: a };
  }

  decorate(): JSX.Element {
    const label = PLATFORM_LABEL[this.__platform] ?? "Embed";
    return (
      <div
        contentEditable={false}
        style={{
          border: "1px solid #E5E1D8",
          borderRadius: 8,
          padding: "14px 16px",
          background: "#FBF9F4",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#7F0400",
            background: "#F3E9C6",
            padding: "3px 8px",
            borderRadius: 4,
            flexShrink: 0,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 13,
            color: "#4A5565",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {this.__url}
        </span>
      </div>
    );
  }
}

export function $createEmbedNode(data: {
  url: string;
  platform: ArticleEmbedKind;
  embedUrl: string | null;
}): EmbedNode {
  return new EmbedNode(data);
}

export function $isEmbedNode(
  node: LexicalNode | null | undefined
): node is EmbedNode {
  return node instanceof EmbedNode;
}

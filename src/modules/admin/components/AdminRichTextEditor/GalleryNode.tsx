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

/**
 * A single gallery entry. We denormalize `url`/`alt` alongside the media `id`
 * (mirroring how UploadNode carries `src`/`altText`) so the public renderer is
 * self-contained: our custom node isn't a Payload upload node, so Payload's
 * depth population never resolves it for us. `id` remains the source of truth
 * for the referenced media doc.
 */
export type GalleryItem = {
  id: string;
  url: string;
  alt: string;
};

/**
 * Custom Lexical node for an ordered image gallery (PLAN-EMBEDS Step 2).
 */
export type SerializedGalleryNode = Spread<
  {
    type: "gallery";
    items: GalleryItem[];
  },
  SerializedLexicalNode
>;

function normalizeItems(items: GalleryItem[] | undefined): GalleryItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((it) => it && typeof it.id === "string" && typeof it.url === "string")
    .map((it) => ({ id: it.id, url: it.url, alt: it.alt ?? "" }));
}

export class GalleryNode extends DecoratorNode<JSX.Element> {
  __items: GalleryItem[];

  static getType(): string {
    return "gallery";
  }

  static clone(node: GalleryNode): GalleryNode {
    return new GalleryNode({ items: node.__items }, node.__key);
  }

  constructor(data: { items: GalleryItem[] }, key?: NodeKey) {
    super(key);
    this.__items = normalizeItems(data.items);
  }

  static importJSON(serialized: SerializedGalleryNode): GalleryNode {
    return new GalleryNode({ items: serialized.items });
  }

  exportJSON(): SerializedGalleryNode {
    return {
      type: "gallery",
      version: 1,
      items: this.__items,
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
    const wrapper = document.createElement("div");
    for (const item of this.__items) {
      const img = document.createElement("img");
      img.setAttribute("src", item.url);
      img.setAttribute("alt", item.alt);
      wrapper.appendChild(img);
    }
    return { element: wrapper };
  }

  decorate(): JSX.Element {
    const count = this.__items.length;
    return (
      <div
        contentEditable={false}
        style={{
          border: "1px solid #E5E1D8",
          borderRadius: 8,
          padding: 12,
          background: "#FBF9F4",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#6b1d2a",
            marginBottom: 8,
          }}
        >
          Gallery · {count} {count === 1 ? "image" : "images"}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
            gap: 6,
          }}
        >
          {this.__items.map((item, index) => (
            // eslint-disable-next-line @next/next/no-img-element -- editor preview, arbitrary R2/local src
            <img
              key={`${item.id}-${index}`}
              src={item.url}
              alt={item.alt}
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                objectFit: "cover",
                borderRadius: 4,
                display: "block",
              }}
            />
          ))}
        </div>
      </div>
    );
  }
}

export function $createGalleryNode(data: { items: GalleryItem[] }): GalleryNode {
  return new GalleryNode(data);
}

export function $isGalleryNode(
  node: LexicalNode | null | undefined
): node is GalleryNode {
  return node instanceof GalleryNode;
}

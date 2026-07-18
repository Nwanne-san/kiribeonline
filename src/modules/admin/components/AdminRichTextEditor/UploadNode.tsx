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
 * Payload-compatible upload node for the bespoke article editor.
 *
 * On save, the serialized shape matches `@payloadcms/richtext-lexical`'s
 * UploadFeature (`type: "upload"`, `relationTo`, `value`), so the public
 * `RichText` renderer resolves and displays it. We additionally carry `src` +
 * `altText` so the image shows inside the editor without a media round-trip.
 */
export type SerializedUploadNode = Spread<
  {
    type: "upload";
    relationTo: string;
    value: string | number;
    fields: Record<string, unknown> | null;
    src?: string;
    altText?: string;
  },
  SerializedLexicalNode
>;

export class UploadNode extends DecoratorNode<JSX.Element> {
  __relationTo: string;
  __value: string | number;
  __src: string;
  __altText: string;

  static getType(): string {
    return "upload";
  }

  static clone(node: UploadNode): UploadNode {
    return new UploadNode(
      { relationTo: node.__relationTo, value: node.__value, src: node.__src, altText: node.__altText },
      node.__key
    );
  }

  constructor(
    data: { relationTo?: string; value: string | number; src?: string; altText?: string },
    key?: NodeKey
  ) {
    super(key);
    this.__relationTo = data.relationTo ?? "media";
    this.__value = data.value;
    this.__src = data.src ?? "";
    this.__altText = data.altText ?? "";
  }

  static importJSON(serialized: SerializedUploadNode): UploadNode {
    return new UploadNode({
      relationTo: serialized.relationTo,
      value: serialized.value,
      src: serialized.src,
      altText: serialized.altText,
    });
  }

  exportJSON(): SerializedUploadNode {
    return {
      type: "upload",
      version: 3,
      relationTo: this.__relationTo,
      value: this.__value,
      fields: null,
      src: this.__src || undefined,
      altText: this.__altText || undefined,
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
    const img = document.createElement("img");
    if (this.__src) img.setAttribute("src", this.__src);
    img.setAttribute("alt", this.__altText);
    return { element: img };
  }

  decorate(): JSX.Element {
    if (!this.__src) {
      return (
        <span
          style={{
            display: "inline-block",
            padding: "12px 16px",
            border: "1px dashed #D1D5DC",
            color: "#6A7282",
            fontSize: 13,
          }}
        >
          Image #{String(this.__value)} — preview available after save
        </span>
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element -- editor preview, arbitrary R2/local src
      <img
        src={this.__src}
        alt={this.__altText}
        style={{ maxWidth: "100%", height: "auto", display: "block" }}
      />
    );
  }
}

export function $createUploadNode(data: {
  relationTo?: string;
  value: string | number;
  src?: string;
  altText?: string;
}): UploadNode {
  return new UploadNode(data);
}

export function $isUploadNode(node: LexicalNode | null | undefined): node is UploadNode {
  return node instanceof UploadNode;
}

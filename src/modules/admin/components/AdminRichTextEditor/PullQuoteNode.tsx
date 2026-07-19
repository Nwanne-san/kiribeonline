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
 * Custom Lexical node for a branded pull quote (PLAN-EMBEDS Step 2).
 *
 * Distinct from a `blockquote`: this is a display-styled editorial callout with
 * an optional attribution, rendered on the public side by the `PullQuote`
 * component (burgundy rule, Outfit display, mustard attribution).
 */
export type SerializedPullQuoteNode = Spread<
  {
    type: "pullquote";
    quote: string;
    attribution: string;
  },
  SerializedLexicalNode
>;

export class PullQuoteNode extends DecoratorNode<JSX.Element> {
  __quote: string;
  __attribution: string;

  static getType(): string {
    return "pullquote";
  }

  static clone(node: PullQuoteNode): PullQuoteNode {
    return new PullQuoteNode(
      { quote: node.__quote, attribution: node.__attribution },
      node.__key
    );
  }

  constructor(data: { quote: string; attribution?: string }, key?: NodeKey) {
    super(key);
    this.__quote = data.quote;
    this.__attribution = data.attribution ?? "";
  }

  static importJSON(serialized: SerializedPullQuoteNode): PullQuoteNode {
    return new PullQuoteNode({
      quote: serialized.quote,
      attribution: serialized.attribution,
    });
  }

  exportJSON(): SerializedPullQuoteNode {
    return {
      type: "pullquote",
      version: 1,
      quote: this.__quote,
      attribution: this.__attribution,
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
    const figure = document.createElement("figure");
    const blockquote = document.createElement("blockquote");
    blockquote.textContent = this.__quote;
    figure.appendChild(blockquote);
    if (this.__attribution) {
      const caption = document.createElement("figcaption");
      caption.textContent = this.__attribution;
      figure.appendChild(caption);
    }
    return { element: figure };
  }

  decorate(): JSX.Element {
    return (
      <figure
        contentEditable={false}
        style={{
          borderLeft: "4px solid #7F0400",
          paddingLeft: 20,
          margin: "8px 0",
        }}
      >
        <blockquote
          style={{
            fontFamily: "var(--font-headline), 'Outfit', sans-serif",
            fontSize: 22,
            lineHeight: 1.35,
            fontWeight: 600,
            color: "#1F2937",
            margin: 0,
          }}
        >
          {this.__quote}
        </blockquote>
        {this.__attribution ? (
          <figcaption
            style={{
              marginTop: 8,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#B8860B",
            }}
          >
            {this.__attribution}
          </figcaption>
        ) : null}
      </figure>
    );
  }
}

export function $createPullQuoteNode(data: {
  quote: string;
  attribution?: string;
}): PullQuoteNode {
  return new PullQuoteNode(data);
}

export function $isPullQuoteNode(
  node: LexicalNode | null | undefined
): node is PullQuoteNode {
  return node instanceof PullQuoteNode;
}

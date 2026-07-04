/** Minimal Lexical document from plain text (paragraphs separated by blank lines). */
export function textToLexical(text: string): Record<string, unknown> {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    paragraphs.push("");
  }

  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      children: paragraphs.map((paragraph) => ({
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr",
        children: [
          {
            type: "text",
            text: paragraph,
            format: 0,
            mode: "normal",
            style: "",
            detail: 0,
            version: 1,
          },
        ],
      })),
    },
  };
}

type LexicalBody = {
  root?: {
    children?: Array<{
      children?: Array<{ text?: string }>;
    }>;
  };
};

/** Ensure Lexical always receives a root with at least one block node. */
export function normalizeLexicalBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") return textToLexical("");

  const root = (body as LexicalBody).root;
  if (!root || typeof root !== "object") return textToLexical("");

  const children = root.children;
  if (!Array.isArray(children) || children.length === 0) return textToLexical("");

  return body as Record<string, unknown>;
}

export function lexicalToPlainText(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const root = (body as LexicalBody).root;
  if (!root?.children) return "";
  return root.children
    .map((node) => node.children?.map((c) => c.text ?? "").join("") ?? "")
    .filter(Boolean)
    .join("\n\n");
}

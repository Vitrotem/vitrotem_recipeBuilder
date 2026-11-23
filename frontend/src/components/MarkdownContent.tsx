"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { MARKDOWN_COLOR_CLASS_RE } from "@/lib/markdownColors";

type Props = {
  children: string;
  className?: string;
};

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "span"],
  attributes: {
    ...defaultSchema.attributes,
    span: ["className", "class"],
  },
};

const components: Components = {
  span({ className, children }) {
    const safe = (className || "")
      .split(/\s+/)
      .filter((c) => MARKDOWN_COLOR_CLASS_RE.test(c))
      .join(" ");
    if (!safe) return <>{children}</>;
    return <span className={safe}>{children}</span>;
  },
};

/** Safely render markdown notes (bold, headings, lists, links, colored spans). */
export default function MarkdownContent({ children, className }: Props) {
  if (!children.trim()) return null;

  return (
    <div className={className ? `markdown-body ${className}` : "markdown-body"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

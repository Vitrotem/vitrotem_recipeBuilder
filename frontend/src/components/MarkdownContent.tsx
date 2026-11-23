"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  children: string;
  className?: string;
};

/** Safely render markdown notes (bold, lists, links, etc.). */
export default function MarkdownContent({ children, className }: Props) {
  if (!children.trim()) return null;

  return (
    <div className={className ? `markdown-body ${className}` : "markdown-body"}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

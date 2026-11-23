"use client";

import { Color } from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useId, type ReactNode } from "react";
import { MARKDOWN_COLORS } from "@/lib/markdownColors";
import { normalizeEditorHtml, toEditorHtml } from "@/lib/richText";

type Props = {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
};

export default function MarkupField({
  label,
  value,
  onChange,
  rows = 5,
  placeholder = "Write notes…",
}: Props) {
  const fieldId = useId();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: false,
      }),
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: toEditorHtml(value),
    editorProps: {
      attributes: {
        id: fieldId,
        class: "markup-editor-content markdown-body",
        style: `min-height: ${Math.max(rows, 3) * 1.55}rem`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(normalizeEditorHtml(ed.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = toEditorHtml(value);
    const current = normalizeEditorHtml(editor.getHTML());
    if (normalizeEditorHtml(incoming) === current) return;
    editor.commands.setContent(incoming || "", { emitUpdate: false });
  }, [editor, value]);

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev || "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  }

  if (!editor) {
    return (
      <div className="markup-field">
        <label htmlFor={fieldId}>{label}</label>
        <div className="markup-editor-shell markup-editor-shell-loading" />
      </div>
    );
  }

  return (
    <div className="markup-field">
      <label htmlFor={fieldId}>{label}</label>
      <div className="markup-toolbar" role="toolbar" aria-label="Text formatting">
        <button
          type="button"
          className={`markup-btn${editor.isActive("bold") ? " active" : ""}`}
          title="Bold"
          aria-label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={`markup-btn${editor.isActive("italic") ? " active" : ""}`}
          title="Italic"
          aria-label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </button>
        <span className="markup-toolbar-sep" aria-hidden />
        {([1, 2, 3, 4] as const).map((level) => (
          <button
            key={level}
            type="button"
            className={`markup-btn${editor.isActive("heading", { level }) ? " active" : ""}`}
            title={`Heading ${level}`}
            aria-label={`Heading ${level}`}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          >
            H{level}
          </button>
        ))}
        <span className="markup-toolbar-sep" aria-hidden />
        <button
          type="button"
          className={`markup-btn${editor.isActive("bulletList") ? " active" : ""}`}
          title="Bullet list"
          aria-label="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          List
        </button>
        <button
          type="button"
          className={`markup-btn${editor.isActive("orderedList") ? " active" : ""}`}
          title="Numbered list"
          aria-label="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </button>
        <button
          type="button"
          className={`markup-btn${editor.isActive("link") ? " active" : ""}`}
          title="Link"
          aria-label="Insert link"
          onClick={setLink}
        >
          Link
        </button>
        <span className="markup-toolbar-sep" aria-hidden />
        <span className="markup-color-group" role="group" aria-label="Text color">
          {MARKDOWN_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`markup-color-btn${editor.isActive("textStyle", { color: c.swatch }) ? " active" : ""}`}
              title={c.label}
              aria-label={`${c.label} text`}
              style={{ background: c.swatch }}
              onClick={() => editor.chain().focus().setColor(c.swatch).run()}
            />
          ))}
          <button
            type="button"
            className="markup-btn markup-btn-clear-color"
            title="Clear color"
            aria-label="Clear text color"
            onClick={() => editor.chain().focus().unsetColor().run()}
          >
            A
          </button>
        </span>
      </div>

      <div className="markup-editor-shell">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

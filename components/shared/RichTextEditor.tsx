"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import ListItem from "@tiptap/extension-list-item";
import ImageExtension from "@tiptap/extension-image";
import { useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Link as LinkIcon,
  Code as CodeIcon,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  Image as ImageIcon,
} from "lucide-react";
import MediaLibraryModal from "./MediaLibrary/MediaLibraryModal";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export const RichTextEditor = ({ value, onChange }: Props) => {
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Code,
      CodeBlock,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Blockquote,
      HorizontalRule,
      ListItem,
      ImageExtension.configure({ inline: false }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "tiptap-editor min-h-[300px] max-h-[600px] overflow-y-auto border border-gray-200 p-4 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white prose max-w-none",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) return null;

  const handleSelectImage = (url: string) => {
    editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border p-1.5 rounded-md bg-gray-50">
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive("bold") ? "bg-primary text-white hover:bg-primary" : ""
          }`}
          title="Bold"
        >
          <Bold size={16} />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive("italic") ? "bg-primary text-white hover:bg-primary" : ""
          }`}
          title="Italic"
        >
          <Italic size={16} />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive("underline") ? "bg-primary text-white hover:bg-primary" : ""
          }`}
          title="Underline"
        >
          <span className="font-bold underline text-sm">U</span>
        </button>

        {/* Strike */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive("strike") ? "bg-primary text-white hover:bg-primary" : ""
          }`}
          title="Strike"
        >
          <Strikethrough size={16} />
        </button>

        {/* Code Inline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive("code") ? "bg-primary text-white hover:bg-primary" : ""
          }`}
          title="Inline Code"
        >
          <CodeIcon size={16} />
        </button>

        {/* Highlight */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive("highlight") ? "bg-primary text-white hover:bg-primary" : ""
          }`}
          title="Highlight text"
        >
          <span className="font-bold bg-amber-200 text-black px-1 text-xs">H</span>
        </button>

        <span className="w-px h-6 bg-gray-200 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive("bulletList") ? "bg-primary text-white hover:bg-primary" : ""
          }`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive("orderedList") ? "bg-primary text-white hover:bg-primary" : ""
          }`}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>

        <span className="w-px h-6 bg-gray-200 mx-1" />

        {/* Text Align */}
        {["left", "center", "right", "justify"].map((align) => {
          const Icon =
            align === "left"
              ? AlignLeft
              : align === "center"
                ? AlignCenter
                : align === "right"
                  ? AlignRight
                  : AlignJustify;
          return (
            <button
              key={align}
              type="button"
              onClick={() => editor.chain().focus().setTextAlign(align).run()}
              className={`p-1.5 rounded hover:bg-gray-200 transition ${
                editor.isActive({ textAlign: align })
                  ? "bg-primary text-white hover:bg-primary"
                  : ""
              }`}
              title={`Align ${align}`}
            >
              <Icon size={16} />
            </button>
          );
        })}

        <span className="w-px h-6 bg-gray-200 mx-1" />

        {/* Link */}
        <button
          type="button"
          onClick={() => {
            const url = prompt("Enter URL link:");
            if (url === null) return;
            if (url === "") {
              editor.chain().focus().unsetLink().run();
            } else {
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: url })
                .run();
            }
          }}
          className={`p-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive("link") ? "bg-primary text-white hover:bg-primary" : ""
          }`}
          title="Add Link"
        >
          <LinkIcon size={16} />
        </button>

        {/* Image */}
        <button
          type="button"
          onClick={() => setIsMediaOpen(true)}
          className="p-1.5 rounded hover:bg-gray-200 transition text-gray-700"
          title="Insert Image from Library"
        >
          <ImageIcon size={16} />
        </button>

        {/* Blockquote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive("blockquote") ? "bg-primary text-white hover:bg-primary" : ""
          }`}
          title="Blockquote"
        >
          <Quote size={16} />
        </button>

        {/* Horizontal Rule */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded hover:bg-gray-200 transition text-gray-700"
          title="Horizontal separator line"
        >
          <Minus size={16} />
        </button>

        <span className="w-px h-6 bg-gray-200 mx-1" />

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="p-1.5 rounded hover:bg-gray-200 transition text-gray-700"
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="p-1.5 rounded hover:bg-gray-200 transition text-gray-700"
          title="Redo"
        >
          <Redo2 size={16} />
        </button>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />

      {/* Media Picker Dialog */}
      <MediaLibraryModal
        open={isMediaOpen}
        onOpenChange={setIsMediaOpen}
        onSelect={handleSelectImage}
      />
    </div>
  );
};

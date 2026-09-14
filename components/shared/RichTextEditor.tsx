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
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { useEffect, useRef, useState } from "react";
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
  Baseline,
  Highlighter,
  ChevronDown,
  Check,
  RotateCcw,
  Pipette,
} from "lucide-react";
import MediaLibraryModal from "./MediaLibrary/MediaLibraryModal";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const TEXT_COLORS = [
  { name: "ডিফল্ট (Default)", value: "" },
  { name: "কালো (Black)", value: "#000000" },
  { name: "গাঢ় ধূসর (Dark Gray)", value: "#374151" },
  { name: "ধূসর (Slate)", value: "#64748b" },
  { name: "লাল (Red)", value: "#dc2626" },
  { name: "গোলাপী (Rose)", value: "#e11d48" },
  { name: "কমলা (Orange)", value: "#ea580c" },
  { name: "হলুদ/অ্যাম্বার (Amber)", value: "#d97706" },
  { name: "মুক্তিমার্গ সবুজ (Muktimarg Green)", value: "#226b3a" },
  { name: "সবুজ (Green)", value: "#16a34a" },
  { name: "নীলচে সবুজ (Teal)", value: "#0d9488" },
  { name: "হালকা নীল (Sky)", value: "#0284c7" },
  { name: "নীল (Blue)", value: "#2563eb" },
  { name: "ইন্ডিগো (Indigo)", value: "#4f46e5" },
  { name: "বেগুনী (Purple)", value: "#9333ea" },
  { name: "ম্যাজেন্টা (Pink)", value: "#db2777" },
];

const HIGHLIGHT_COLORS = [
  { name: "হলুদ (Yellow)", value: "#fef08a" },
  { name: "অ্যাম্বার (Amber)", value: "#fde68a" },
  { name: "হালকা সবুজ (Soft Green)", value: "#bbf7d0" },
  { name: "মিন্ট (Mint)", value: "#a7f3d0" },
  { name: "হালকা নীল (Sky Blue)", value: "#bae6fd" },
  { name: "সায়ান (Cyan)", value: "#a5f3fc" },
  { name: "ল্যাভেন্ডার (Indigo)", value: "#c7d2fe" },
  { name: "বেগুনী (Soft Purple)", value: "#e9d5ff" },
  { name: "গোলাপী (Pastel Pink)", value: "#fbcfe8" },
  { name: "রোজ (Soft Rose)", value: "#fecdd3" },
  { name: "কমলা (Peach Orange)", value: "#fed7aa" },
  { name: "লেবু সবুজ (Lime)", value: "#d9f99d" },
];

export const RichTextEditor = ({ value, onChange }: Props) => {
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isTextColorOpen, setIsTextColorOpen] = useState(false);
  const [isHighlightOpen, setIsHighlightOpen] = useState(false);
  const [customTextColor, setCustomTextColor] = useState("#226b3a");
  const [customHighlightColor, setCustomHighlightColor] = useState("#fef08a");

  const textColorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Underline,
      Link.configure({ openOnClick: false }),
      Code,
      CodeBlock,
      Highlight.configure({ multicolor: true }),
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

  // Click outside to close color popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        textColorRef.current &&
        !textColorRef.current.contains(event.target as Node)
      ) {
        setIsTextColorOpen(false);
      }
      if (
        highlightRef.current &&
        !highlightRef.current.contains(event.target as Node)
      ) {
        setIsHighlightOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsTextColorOpen(false);
        setIsHighlightOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!editor) return null;

  const handleSelectImage = (url: string) => {
    editor.chain().focus().setImage({ src: url }).run();
  };

  const currentTextColor = editor.getAttributes("textStyle")?.color || "";
  const isHighlightActive = editor.isActive("highlight");
  const currentHighlightColor =
    editor.getAttributes("highlight")?.color ||
    (isHighlightActive ? "#fef08a" : "");

  const handleSetTextColor = (color: string) => {
    if (!color) {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
    setIsTextColorOpen(false);
  };

  const handleSetHighlight = (color: string) => {
    if (!color) {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().setHighlight({ color }).run();
    }
    setIsHighlightOpen(false);
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border p-1.5 rounded-md bg-gray-50 text-gray-700">
        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive("bold") ? "bg-primary text-white hover:bg-primary" : ""
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </button>

        {/* Italic */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive("italic") ? "bg-primary text-white hover:bg-primary" : ""
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </button>

        {/* Underline */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive("underline") ? "bg-primary text-white hover:bg-primary" : ""
          }`}
          title="Underline (Ctrl+U)"
        >
          <span className="font-bold underline text-sm leading-none">U</span>
        </button>

        {/* Strike */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive("strike") ? "bg-primary text-white hover:bg-primary" : ""
          }`}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>

        {/* Code Inline */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded hover:bg-gray-200 transition ${
            editor.isActive("code") ? "bg-primary text-white hover:bg-primary" : ""
          }`}
          title="Inline Code"
        >
          <CodeIcon size={16} />
        </button>

        <span className="w-px h-6 bg-gray-200 mx-1" />

        {/* Text Color Picker */}
        <div className="relative" ref={textColorRef}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setIsTextColorOpen((prev) => !prev);
              setIsHighlightOpen(false);
            }}
            className={`p-1.5 rounded hover:bg-gray-200 transition flex items-center gap-1 ${
              currentTextColor
                ? "bg-gray-200 text-gray-900 font-semibold"
                : "text-gray-700"
            }`}
            title="টেক্সট কালার (Text Color)"
          >
            <div className="flex flex-col items-center justify-center">
              <Baseline size={16} />
              <span
                className="w-3.5 h-1 rounded-full -mt-0.5 border border-black/10"
                style={{
                  backgroundColor: currentTextColor || "#222222",
                }}
              />
            </div>
            <ChevronDown size={11} className="text-gray-500 -ml-0.5" />
          </button>

          {isTextColorOpen && (
            <div className="absolute top-full left-0 mt-1.5 z-50 w-64 p-3 bg-white rounded-lg shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-700">
                  টেক্সট কালার (Text Color)
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSetTextColor("")}
                  className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-gray-100 transition"
                  title="রিসেট / ডিফল্ট কালার"
                >
                  <RotateCcw size={11} />
                  <span>ডিফল্ট</span>
                </button>
              </div>

              {/* Color swatches */}
              <div className="grid grid-cols-8 gap-1.5 mb-3">
                {TEXT_COLORS.map((col) => {
                  const isSelected =
                    (!col.value && !currentTextColor) ||
                    (col.value &&
                      currentTextColor.toLowerCase() === col.value.toLowerCase());
                  return (
                    <button
                      key={col.value || "default"}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSetTextColor(col.value)}
                      title={col.name}
                      className="relative w-6 h-6 rounded-md border border-gray-300 hover:scale-110 transition flex items-center justify-center shadow-xs"
                      style={{
                        backgroundColor: col.value || "#ffffff",
                      }}
                    >
                      {!col.value && (
                        <span className="text-[10px] text-gray-400 font-bold">
                          A
                        </span>
                      )}
                      {isSelected && (
                        <Check
                          size={13}
                          className={
                            col.value &&
                            [
                              "#000000",
                              "#374151",
                              "#226b3a",
                              "#2563eb",
                              "#4f46e5",
                              "#9333ea",
                              "#dc2626",
                            ].includes(col.value.toLowerCase())
                              ? "text-white"
                              : "text-black"
                          }
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Input */}
              <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                <label
                  htmlFor="custom-text-color-input"
                  className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer flex-1"
                >
                  <Pipette size={13} className="text-gray-500" />
                  <span>কাস্টম কালার:</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="custom-text-color-input"
                    type="color"
                    value={customTextColor}
                    onChange={(e) => {
                      const newCol = e.target.value;
                      setCustomTextColor(newCol);
                      editor.chain().focus().setColor(newCol).run();
                    }}
                    className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5 bg-white"
                    title="কাস্টম কালার বেছে নিন"
                  />
                  <input
                    type="text"
                    value={customTextColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomTextColor(val);
                      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                        editor.chain().focus().setColor(val).run();
                      }
                    }}
                    placeholder="#000000"
                    className="w-20 px-1.5 py-0.5 text-xs font-mono border rounded text-gray-700 uppercase"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color Picker */}
        <div className="relative" ref={highlightRef}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setIsHighlightOpen((prev) => !prev);
              setIsTextColorOpen(false);
            }}
            className={`p-1.5 rounded hover:bg-gray-200 transition flex items-center gap-1 ${
              isHighlightActive
                ? "bg-amber-100 text-amber-900 font-semibold"
                : "text-gray-700"
            }`}
            title="টেক্সট হাইলাইট (Highlight Text)"
          >
            <div className="flex flex-col items-center justify-center">
              <Highlighter size={16} />
              <span
                className="w-3.5 h-1 rounded-full -mt-0.5 border border-black/10"
                style={{
                  backgroundColor:
                    currentHighlightColor ||
                    (isHighlightActive ? "#fef08a" : "transparent"),
                }}
              />
            </div>
            <ChevronDown size={11} className="text-gray-500 -ml-0.5" />
          </button>

          {isHighlightOpen && (
            <div className="absolute top-full left-0 mt-1.5 z-50 w-64 p-3 bg-white rounded-lg shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-700">
                  হাইলাইট কালার (Highlight)
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSetHighlight("")}
                  className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-gray-100 transition"
                  title="হাইলাইট মুছুন"
                >
                  <RotateCcw size={11} />
                  <span>মুছুন</span>
                </button>
              </div>

              {/* Highlight swatches */}
              <div className="grid grid-cols-6 gap-2 mb-3">
                {HIGHLIGHT_COLORS.map((col) => {
                  const isSelected =
                    isHighlightActive &&
                    currentHighlightColor.toLowerCase() ===
                      col.value.toLowerCase();
                  return (
                    <button
                      key={col.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSetHighlight(col.value)}
                      title={col.name}
                      className="relative w-8 h-7 rounded-md border border-gray-300 hover:scale-105 transition flex items-center justify-center shadow-xs"
                      style={{
                        backgroundColor: col.value,
                      }}
                    >
                      {isSelected && (
                        <Check size={14} className="text-gray-800" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Highlight Input */}
              <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                <label
                  htmlFor="custom-highlight-color-input"
                  className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer flex-1"
                >
                  <Pipette size={13} className="text-gray-500" />
                  <span>কাস্টম হাইলাইট:</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="custom-highlight-color-input"
                    type="color"
                    value={customHighlightColor}
                    onChange={(e) => {
                      const newCol = e.target.value;
                      setCustomHighlightColor(newCol);
                      editor.chain().focus().setHighlight({ color: newCol }).run();
                    }}
                    className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5 bg-white"
                    title="কাস্টম হাইলাইট কালার বেছে নিন"
                  />
                  <input
                    type="text"
                    value={customHighlightColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomHighlightColor(val);
                      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                        editor.chain().focus().setHighlight({ color: val }).run();
                      }
                    }}
                    placeholder="#FEF08A"
                    className="w-20 px-1.5 py-0.5 text-xs font-mono border rounded text-gray-700 uppercase"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <span className="w-px h-6 bg-gray-200 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
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
              onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setIsMediaOpen(true)}
          className="p-1.5 rounded hover:bg-gray-200 transition text-gray-700"
          title="Insert Image from Library"
        >
          <ImageIcon size={16} />
        </button>

        {/* Blockquote */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
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
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
          className="p-1.5 rounded hover:bg-gray-200 transition text-gray-700"
          title="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
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

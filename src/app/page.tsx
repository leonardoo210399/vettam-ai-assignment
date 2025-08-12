// src/app/page.tsx
"use client";

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import type { AnyExtension } from "@tiptap/core";
import {
  PaginationPlus,
  TableCellPlus,
  TableHeaderPlus,
  TablePlus,
  TableRowPlus,
} from "tiptap-pagination-plus";

import { editorContent } from "@/lib/editor-content";
import TiptapEditor from "@/ui/tiptap-editor";
import Sidebar from "@/ui/Sidebar";

export default function Home() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      ListItem,

      // Here’s the cast to AnyExtension
      (TablePlus as unknown as AnyExtension),
      (TableRowPlus as unknown as AnyExtension),
      (TableCellPlus as unknown as AnyExtension),
      (TableHeaderPlus as unknown as AnyExtension),
      (PaginationPlus.configure({
        pageHeight: 842,
        pageGap: 20,
        pageBreakBackground: "hsl(var(--background))",
        pageHeaderHeight: 50,
        footerRight: "Made with ❤️ by Romik",
        footerLeft: "Page {page}",
        headerLeft: "Header Left",
        headerRight: "Header Right",
      }) as unknown as AnyExtension),
    ],
    content: editorContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] px-10",
      },
    },
    onUpdate: ({ editor }) => console.log(editor.getJSON()),
    immediatelyRender: false,
  });

  if (!editor) return null;

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex justify-center overflow-auto p-4">
        <div className="w-full max-w-4xl">
          <TiptapEditor editor={editor} />
        </div>
      </div>
      <div className="border-l">
        <Sidebar editor={editor} />
      </div>
    </div>
  );
}

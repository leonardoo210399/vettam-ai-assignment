"use client";

import { EditorContent, type Editor } from "@tiptap/react";
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon,
  List, ListOrdered, Quote, Undo, Redo, Code,
  Table as TableIcon, Trash2, Heading1, Heading2,
} from "lucide-react";
import { Button } from "./button";
import Ruler from "@/ui/Ruler";              // horizontal ruler (already had)
import RulerVertical from "@/ui/RulerVertical"; // ← your vertical ruler file

interface TiptapEditorProps {
  editor: Editor;
}

export default function TiptapEditor({ editor }: TiptapEditorProps) {
  const insertTable = () =>
    editor.chain().focus().insertTable({ rows: 3, cols: 4, withHeaderRow: true }).run();
  const addColumnBefore = () => editor.chain().focus().addColumnBefore().run();
  const addColumnAfter = () => editor.chain().focus().addColumnAfter().run();
  const addRowBefore = () => editor.chain().focus().addRowBefore().run();
  const addRowAfter = () => editor.chain().focus().addRowAfter().run();
  const deleteTable = () => editor.chain().focus().deleteTable().run();

  return (
    <div className="">
      <div className="sticky top-0 z-[10]">
        <div className="border rounded-lg shadow-sm p-2 bg-muted/90 flex flex-wrap gap-1 backdrop-blur-md">
          <div className="flex flex-wrap gap-0.5">
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()}>
              <Redo className="h-4 w-4" />
            </Button>

            <div className="border-l mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""}
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
            >
              <Heading2 className="h-4 w-4" />
            </Button>

            <div className="border-l mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive("bold") ? "bg-muted" : ""}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive("italic") ? "bg-muted" : ""}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive("underline") ? "bg-muted" : ""}
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive("strike") ? "bg-muted" : ""}
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={editor.isActive("code") ? "bg-muted" : ""}
            >
              <Code className="h-4 w-4" />
            </Button>

            <div className="border-l mx-1" />

            <Button
              variant="ghost" size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive("bulletList") ? "bg-muted" : ""}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive("orderedList") ? "bg-muted" : ""}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>

            <div className="border-l mx-1" />

            <Button
              variant="ghost" size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive("blockquote") ? "bg-muted" : ""}
            >
              <Quote className="h-4 w-4" />
            </Button>

            <div className="border-l mx-1" />

            <Button
              variant="ghost" size="sm"
              onClick={insertTable}
              className={editor.isActive("table") ? "bg-muted" : ""}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            {editor.isActive("table") && (
              <>
                <Button variant="ghost" size="sm" onClick={addColumnBefore} className="text-xs">
                  ←Col
                </Button>
                <Button variant="ghost" size="sm" onClick={addColumnAfter} className="text-xs">
                  Col→
                </Button>
                <Button variant="ghost" size="sm" onClick={addRowBefore} className="text-xs">
                  ↑Row
                </Button>
                <Button variant="ghost" size="sm" onClick={addRowAfter} className="text-xs">
                  Row↓
                </Button>
                <Button variant="ghost" size="sm" onClick={deleteTable} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Horizontal ruler under the toolbar */}
          <Ruler editor={editor} />
        </div>
      </div>

      {/* Editor area with vertical ruler */}
      <div className="relative" style={{ paddingLeft: 28 }}>
        <RulerVertical editor={editor} />
        <EditorContent editor={editor} className="w-full border mb-5 mt-2" id="editor" />
      </div>
    </div>
  );
}

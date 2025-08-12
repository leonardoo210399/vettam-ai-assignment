"use client";

import React, { useState, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import html2canvas from "html2canvas";
import debounce from "lodash.debounce";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { Extension } from "@tiptap/core";

const PAGE_HEIGHT = 842;
const PAGE_GAP = 20;

// 1) A tiny TipTap extension to hold our search decorations
const SearchHighlight = Extension.create({
  name: "searchHighlight",
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: new PluginKey("searchHighlight"),
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            return tr.getMeta("searchHighlight") ?? old;
          },
        },
        props: {
          decorations(state) {
            return (this as any).getState(state);
          },
        },
      }),
    ];
  },
});

type Tab = "thumbnail" | "index" | "search";

interface SidebarProps {
  editor: Editor;
}

export default function Sidebar({ editor }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>("thumbnail");
  const [pageCount, setPageCount] = useState(0);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [headings, setHeadings] = useState<{ text: string; pos: number }[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");

  // INDEX TAB
  useEffect(() => {
    if (!editor) return;
    const updateHeadings = () => {
      const h: { text: string; pos: number }[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          h.push({ text: node.textContent, pos });
        }
      });
      setHeadings(h);
    };
    updateHeadings();
    editor.on("update", updateHeadings);
    return () => {
      editor.off("update", updateHeadings);
    };
  }, [editor]);

  // THUMBNAILS TAB
  useEffect(() => {
    if (activeTab !== "thumbnail" || !editor) return;

    const capturePages = debounce(async () => {
      const pages = Array.from(
        editor.view.dom.querySelectorAll<HTMLElement>(".page")
      );
      setPageCount(pages.length);

      const images = await Promise.all(
        pages.map((el) =>
          html2canvas(el, { backgroundColor: null }).then((c) =>
            c.toDataURL("image/png", 0.7)
          )
        )
      );
      setThumbs(images);
    }, 200);

    capturePages();
    editor.on("update", capturePages);
    return () => {
      editor.off("update", capturePages);
      capturePages.cancel();
    };
  }, [activeTab, editor]);

  const jumpToPage = (i: number) => {
    const container = editor.view.dom.closest<HTMLElement>(".overflow-auto");
    if (!container) return;
    const offset = i * (PAGE_HEIGHT + PAGE_GAP);
    container.scrollTo({ top: offset, behavior: "smooth" });
  };

  const jumpToHeading = (pos: number) => {
    editor.chain().focus().setTextSelection(pos).run();
    const headingEl = editor.view.nodeDOM(pos) as HTMLElement | null;
    if (!headingEl) return;
    headingEl.scrollIntoView({ behavior: "smooth", block: "start" });
    scrollBy(0, 1000);
  };

  // SEARCH TAB — now using Decorations
  const doSearch = debounce((term: string) => {
    if (activeTab !== "search") return;
    const { state, view } = editor;
    const { doc } = state;
    const decos: Decoration[] = [];
    const lcTerm = term.toLowerCase();

    if (!lcTerm) {
      // clear decorations
      const tr = state.tr.setMeta("searchHighlight", DecorationSet.empty);
      view.dispatch(tr);
      return;
    }

    // collect all matches in the doc model
    doc.descendants((node, pos) => {
      if (node.isText) {
        let from = 0,
          idx: number;
        const text = node.text!;
        while ((idx = text.toLowerCase().indexOf(lcTerm, from)) > -1) {
          const start = pos + idx;
          const end = start + term.length;
          decos.push(
            Decoration.inline(start, end, {}, { inclusiveStart: false })
          );
          from = idx + term.length;
        }
      }
    });

    // build and dispatch decoration set
    const decoSet = DecorationSet.create(doc, decos);
    const tr = state.tr.setMeta("searchHighlight", decoSet);
    view.dispatch(tr);

    // scroll first match into view
    if (decos.length > 0) {
      const { from } = decos[0];
      const dom = view.domAtPos(from).node as HTMLElement;
      dom.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 200);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    doSearch(e.target.value);
  };

  const tabs = [
    { key: "thumbnail" as Tab, label: `Thumbnail (${pageCount})` },
    { key: "index" as Tab, label: "Index" },
    { key: "search" as Tab, label: "Search" },
  ];

  return (
    <div className="w-64 border-l bg-white dark:bg-gray-800 h-full flex flex-col">
      {/* Tabs */}
      <div className="flex">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 text-center ${
              activeTab === key
                ? "border-b-2 border-primary font-medium"
                : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2">
        {activeTab === "thumbnail" && (
          <div className="space-y-2">
            {thumbs.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Page ${i + 1}`}
                className="w-full h-24 object-cover border rounded cursor-pointer"
                onClick={() => jumpToPage(i)}
              />
            ))}
          </div>
        )}
        {activeTab === "index" && (
          <ul className="list-disc pl-4 space-y-1">
            {headings.map((h, i) => (
              <li key={i}>
                <button
                  className="text-sm text-left hover:underline"
                  onClick={() => jumpToHeading(h.pos)}
                >
                  {h.text}
                </button>
              </li>
            ))}
          </ul>
        )}
        {activeTab === "search" && (
          <div>
            <input
              type="text"
              placeholder="Search…"
              className="w-full px-2 py-1 border rounded mb-2"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// src/ui/Ruler.tsx
"use client";

import React, { useCallback, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";

const RULER_HEIGHT = 28;
const TICK_EVERY = 10;
const LABEL_EVERY = 50;
const BIG_EVERY = 100;

type Props = { editor: Editor };

export default function Ruler({ editor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const measure = useCallback(() => {
    const canvas = canvasRef.current!;
    const canvasRect = canvas.getBoundingClientRect();

    const pageEl =
      (editor.view.dom.querySelector(".breaker") as HTMLElement | null) ||
      (editor.view.dom.querySelector(".page") as HTMLElement | null);

    const pageRect =
      pageEl?.getBoundingClientRect() ??
      (editor.view.dom as HTMLElement).getBoundingClientRect();

    const originX = pageRect.left - canvasRect.left;
    const pageWidth = pageRect.width;

    return { originX, pageWidth, canvasRect };
  }, [editor]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssW = canvas.clientWidth;
    const cssH = RULER_HEIGHT;

    if (canvas.width !== cssW * dpr) canvas.width = cssW * dpr;
    if (canvas.height !== cssH * dpr) canvas.height = cssH * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, cssW, cssH);

    const { originX, pageWidth } = measure();

    ctx.strokeStyle = "#e5e7eb";
    ctx.beginPath();
    ctx.moveTo(0, cssH - 0.5);
    ctx.lineTo(cssW, cssH - 0.5);
    ctx.stroke();

    const startX = Math.floor((originX - 120) / TICK_EVERY) * TICK_EVERY;
    const endX = Math.ceil((originX + pageWidth + 120) / TICK_EVERY) * TICK_EVERY;

    for (let x = startX; x <= endX; x += TICK_EVERY) {
      const insidePage = x >= originX && x <= originX + pageWidth;
      const big = x % BIG_EVERY === 0;
      const label = x % LABEL_EVERY === 0;

      const h = big ? 14 : label ? 10 : 6;
      ctx.strokeStyle = insidePage ? "#94a3b8" : "#e5e7eb";
      ctx.beginPath();
      ctx.moveTo(x, cssH);
      ctx.lineTo(x, cssH - h);
      ctx.stroke();

      if (label && insidePage) {
        const unit = Math.round((x - originX) / TICK_EVERY);
        ctx.fillStyle = "#475569";
        ctx.font = "10px system-ui, -apple-system, Segoe UI, Roboto";
        ctx.textAlign = "center";
        ctx.fillText(String(unit), x, 10);
      }
    }

    // Caret guide
    const { from } = editor.state.selection;
    const caret = editor.view.coordsAtPos(from);
    const caretX = caret.left - canvas.getBoundingClientRect().left;
    if (!Number.isNaN(caretX)) {
      ctx.strokeStyle = "#0ea5e9";
      ctx.beginPath();
      ctx.moveTo(caretX, 0);
      ctx.lineTo(caretX, cssH);
      ctx.stroke();
    }
  }, [editor, measure]);

  useEffect(() => {
    if (!editor) return;

    draw();

    const onResize = () => draw();
    const container = editor.view.dom.closest(".overflow-auto") as HTMLElement | null;
    const onScroll = () => draw();

    window.addEventListener("resize", onResize);
    container?.addEventListener("scroll", onScroll, { passive: true });

    // IMPORTANT: .on returns the editor, so we don't store it.
    editor.on("selectionUpdate", draw);
    editor.on("update", draw);

    return () => {
      window.removeEventListener("resize", onResize);
      container?.removeEventListener("scroll", onScroll);
      editor.off("selectionUpdate", draw);
      editor.off("update", draw);
    };
  }, [editor, draw]);

  return (
    <div className="w-full mt-2">
      <canvas ref={canvasRef} style={{ width: "100%", height: RULER_HEIGHT }} />
    </div>
  );
}

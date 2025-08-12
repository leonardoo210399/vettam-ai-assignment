"use client";

import React, { useCallback, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";

const RULER_W = 28;           // px
const TICK_EVERY = 10;        // px
const LABEL_EVERY = 50;       // px
const BIG_EVERY = 100;        // px

type Props = { editor: Editor };

export default function RulerVertical({ editor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const measure = useCallback(() => {
    const canvas = canvasRef.current!;
    const canvasRect = canvas.getBoundingClientRect();

    // Page column (left edge) – prefer PaginationPlus breaker/page if present
    const pageEl =
      (editor.view.dom.querySelector(".breaker") as HTMLElement | null) ||
      (editor.view.dom.querySelector(".page") as HTMLElement | null) ||
      (editor.view.dom as HTMLElement);

    const pageRect = pageEl.getBoundingClientRect();

    return {
      // distance from canvas to page left/top
      offsetLeft: pageRect.left - canvasRect.left,
      offsetTop: pageRect.top - canvasRect.top,
      pageHeight: pageRect.height,
      canvasRect,
    };
  }, [editor]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssW = RULER_W;
    const cssH = canvas.clientHeight || 0;

    // Size for HiDPI
    if (canvas.width !== cssW * dpr) canvas.width = cssW * dpr;
    if (canvas.height !== cssH * dpr) canvas.height = cssH * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    // background
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, cssW, cssH);

    const { offsetTop, pageHeight } = measure();

    // Right border
    ctx.strokeStyle = "#e5e7eb";
    ctx.beginPath();
    ctx.moveTo(cssW - 0.5, 0);
    ctx.lineTo(cssW - 0.5, cssH);
    ctx.stroke();

    // Visible scroll window in the editor container
    const container =
      editor.view.dom.closest(".overflow-auto") || window;
    const scrollTop =
      container === window
        ? window.scrollY
        : (container as HTMLElement).scrollTop;

    const startY = Math.floor((scrollTop + offsetTop - 120) / TICK_EVERY) * TICK_EVERY;
    const endY = Math.ceil((scrollTop + offsetTop + cssH + 120) / TICK_EVERY) * TICK_EVERY;

    for (let y = startY; y <= endY; y += TICK_EVERY) {
      const yOnCanvas = y - scrollTop; // convert doc Y → canvas Y
      const insidePage = y >= offsetTop && y <= offsetTop + pageHeight;
      const big = y % BIG_EVERY === 0;
      const label = y % LABEL_EVERY === 0;

      const w = big ? 14 : label ? 10 : 6;
      ctx.strokeStyle = insidePage ? "#94a3b8" : "#e5e7eb";
      ctx.beginPath();
      ctx.moveTo(cssW, yOnCanvas);
      ctx.lineTo(cssW - w, yOnCanvas);
      ctx.stroke();

      if (label && insidePage) {
        // label in px-from-top-of-page
        const unit = Math.round(y - offsetTop);
        ctx.fillStyle = "#475569";
        ctx.font = "10px system-ui, -apple-system, Segoe UI, Roboto";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(String(unit), cssW - w - 2, yOnCanvas);
      }
    }

    // Caret guide (horizontal)
    const { from } = editor.state.selection;
    const caret = editor.view.coordsAtPos(from);
    const caretY = caret.top - (canvas.getBoundingClientRect().top);
    if (!Number.isNaN(caretY)) {
      ctx.strokeStyle = "#0ea5e9";
      ctx.beginPath();
      ctx.moveTo(0, caretY);
      ctx.lineTo(cssW, caretY);
      ctx.stroke();
    }
  }, [editor, measure]);

  useEffect(() => {
    if (!editor) return;
    const redraw = () => draw();

    // Size the canvas height to match the scroll container
    const container = editor.view.dom.closest(".overflow-auto") as HTMLElement | null;
    const resizeHeight = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.style.width = `${RULER_W}px`;
      canvas.style.height = `${(container?.clientHeight ?? window.innerHeight)}px`;
      draw();
    };

    resizeHeight();
    window.addEventListener("resize", resizeHeight);
    container?.addEventListener("scroll", redraw, { passive: true });

    editor.on("selectionUpdate", redraw);
    editor.on("update", () => {
      resizeHeight(); // recalc page metrics on content change
    });

    return () => {
      window.removeEventListener("resize", resizeHeight);
      container?.removeEventListener("scroll", redraw);
      editor.off("selectionUpdate", redraw);
      editor.off("update", resizeHeight);
    };
  }, [editor, draw]);

  // Absolutely position next to the page column; we compute left in parent
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: RULER_W,
        height: "100%",
        zIndex: 9,
        pointerEvents: "none", // don’t block selection/scroll
      }}
    />
  );
}

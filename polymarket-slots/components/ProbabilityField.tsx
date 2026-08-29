"use client";

import { useEffect, useRef } from "react";

import { mountProbabilityField, type FieldHandle } from "@/lib/probabilityField";

/**
 * Mounts the ambient background and lets anything on the page make it react by
 * dispatching `slots:surge`. An event rather than a ref or context: the field
 * sits at the root and the machine is deep in the tree, and nothing else needs
 * to know they're connected.
 */
export function surgeField(strength = 1) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("slots:surge", { detail: { strength } }));
}

export default function ProbabilityField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let handle: FieldHandle | null = null;
    try {
      handle = mountProbabilityField(canvas);
    } catch {
      // A missing 2d context is not a reason to take the page down.
      return;
    }

    const onSurge = (e: Event) => {
      const strength = (e as CustomEvent<{ strength?: number }>).detail?.strength ?? 1;
      handle?.surge(strength);
    };
    window.addEventListener("slots:surge", onSurge);

    return () => {
      window.removeEventListener("slots:surge", onSurge);
      handle?.destroy();
    };
  }, []);

  return <canvas ref={canvasRef} className="field" aria-hidden="true" />;
}

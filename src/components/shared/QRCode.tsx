"use client";
import { useEffect, useRef } from "react";
import { generateQR } from "@/lib/utils";

interface Props {
  seed: number | string;
  size?: number;
  fg?: string;
}

/** Convert a string to a deterministic integer seed. */
function strToSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 12345;
}

export function QRCode({ seed, size = 160, fg = "#0A0608" }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const numSeed = typeof seed === "string" ? strToSeed(seed) : seed;

  useEffect(() => {
    if (!svgRef.current) return;
    const grid = generateQR(numSeed);
    const N = 21;
    const cell = 10;
    let paths = "";

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (grid[r][c]) {
          const x = c * cell, y = r * cell;
          const isFinderZone = (r < 8 && c < 8) || (r < 8 && c >= 13) || (r >= 13 && c < 8);
          if (isFinderZone) {
            paths += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${fg}"/>`;
          } else {
            paths += `<rect x="${x + 1}" y="${y + 1}" width="${cell - 2}" height="${cell - 2}" rx="2" fill="${fg}"/>`;
          }
        }
      }
    }
    svgRef.current.innerHTML = `<rect width="210" height="210" fill="white"/>${paths}`;
  }, [numSeed, fg]);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox="0 0 210 210"
      xmlns="http://www.w3.org/2000/svg"
    />
  );
}

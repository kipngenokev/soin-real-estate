import type { ReactNode } from "react";
import { TONES, type Tone } from "./tones";

type Props = {
  tone: Tone;
  children: ReactNode;
  size?: "sm" | "md";
};

export function Pill({ tone, children, size = "md" }: Props) {
  const t = TONES[tone];
  const cls = size === "sm"
    ? "px-1.5 py-0.5 text-[10.5px]"
    : "px-2 py-0.5 text-[11px]";
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${cls}`}
      style={{ backgroundColor: t.bg, color: t.fg }}
    >
      {children}
    </span>
  );
}

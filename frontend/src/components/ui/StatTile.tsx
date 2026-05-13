import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { TONES, type Tone } from "./tones";

type Props = {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
  tone: Tone;
  icon?: ReactNode;
  progress?: number; // 0..100, renders a thin colored bar under the value
};

export function StatTile({ label, value, hint, href, tone, icon, progress }: Props) {
  const t = TONES[tone];
  const body = (
    <div className="rounded-xl border border-gray-200 bg-white p-4 h-full hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between">
        {icon && (
          <span
            className="h-8 w-8 rounded-md flex items-center justify-center"
            style={{ backgroundColor: t.bg, color: t.fg }}
          >
            {icon}
          </span>
        )}
        <span className="text-[10.5px] uppercase tracking-wider font-semibold text-ink-soft">
          {label}
        </span>
      </div>
      <div className="mt-3 text-[24px] font-semibold text-ink tracking-tightish tabular-nums leading-none">
        {value}
      </div>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
              backgroundColor: t.fg,
            }}
          />
        </div>
      )}
      {hint && <div className="text-[11px] text-ink-soft mt-2">{hint}</div>}
    </div>
  );
  return href ? <Link to={href} className="block">{body}</Link> : body;
}

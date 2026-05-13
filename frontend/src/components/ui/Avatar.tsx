import { TONES, type Tone, initialsOf } from "./tones";

type Props = {
  name?: string | null;
  initials?: string; // override
  tone?: Tone;
  size?: "sm" | "md" | "lg";
};

const SIZE: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-[12px]",
  lg: "h-12 w-12 text-[14px]",
};

export function Avatar({ name, initials, tone = "violet", size = "md" }: Props) {
  const t = TONES[tone];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold shrink-0 ${SIZE[size]}`}
      style={{ backgroundColor: t.bg, color: t.fg }}
      aria-hidden
    >
      {initials ?? initialsOf(name)}
    </span>
  );
}

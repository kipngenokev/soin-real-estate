// Shared semantic color palette used across the app.
// Each tone is a (bg, fg) pair tuned for soft tinted badges, avatars and stat icons.

export const TONES = {
  indigo:   { bg: "#eef2ff", fg: "#4338ca" }, // properties / structure
  teal:     { bg: "#ecfeff", fg: "#0e7490" }, // units / inventory
  emerald:  { bg: "#ecfdf5", fg: "#047857" }, // occupancy / revenue / M-Pesa
  violet:   { bg: "#f5f3ff", fg: "#6d28d9" }, // tenants / people
  blue:     { bg: "#eff6ff", fg: "#1d4ed8" }, // payments / bank
  amber:    { bg: "#fffbeb", fg: "#b45309" }, // warnings / drafts / cash
  rose:     { bg: "#fff1f2", fg: "#be123c" }, // danger / overdue
  slate:    { bg: "#f1f5f9", fg: "#475569" }, // neutral / ended
} as const;

export type Tone = keyof typeof TONES;

export function initialsOf(name: string | undefined | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

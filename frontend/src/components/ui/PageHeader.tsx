import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
};

/**
 * Standard page header used on every list/detail page.
 * Eyebrow (tiny uppercase) → big tracking-tight title → muted subtitle.
 * Optional right-aligned actions slot for primary buttons / dropdowns.
 */
export function PageHeader({ eyebrow, title, subtitle, actions }: Props) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 text-[28px] sm:text-[32px] font-semibold text-ink tracking-tightish leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-ink-muted max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </header>
  );
}

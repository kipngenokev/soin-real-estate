import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode; // small chip rendered top-right beside actions
};

/**
 * Gradient hero used for high-identity pages: dashboard, property detail, tenant detail.
 * Navy → royal-blue gradient with two soft radial-blur orbs for depth.
 */
export function HeroBanner({ eyebrow, title, subtitle, actions, badge }: Props) {
  return (
    <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 via-brand-600 to-brand-500 text-white p-7 sm:p-9">
      <div
        aria-hidden
        className="absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-20"
        style={{ backgroundImage: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="absolute -right-10 bottom-0 h-40 w-40 rounded-full opacity-10"
        style={{ backgroundImage: "radial-gradient(circle, #60a5fa 0%, transparent 70%)" }}
      />
      <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs uppercase tracking-[0.12em] text-white/70 font-semibold">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 text-[28px] sm:text-[32px] font-semibold leading-tight tracking-tightish">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-white/80 max-w-xl">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          {actions}
        </div>
      </div>
    </header>
  );
}

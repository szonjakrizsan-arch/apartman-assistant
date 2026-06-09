import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  prominent?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  prominent = false,
}: SectionHeaderProps) {
  return (
    <div
      className={`flex items-end justify-between gap-3 ${
        prominent ? "mb-3.5 border-l-2 border-navy/28 pl-3.5" : "mb-3"
      }`}
    >
      <div>
        <h2
          className={`tracking-tight text-text-primary ${
            prominent
              ? "text-[16px] font-semibold leading-tight"
              : "text-[14px] font-semibold leading-snug"
          }`}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

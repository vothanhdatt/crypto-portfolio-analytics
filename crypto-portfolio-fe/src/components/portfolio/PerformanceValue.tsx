import { getPerformance } from "@/lib/format";

export function PerformanceValue({ value, compact = false }: { value: string; compact?: boolean }) {
  const performance = getPerformance(value);

  return (
    <span
      className={`performance-value performance-${performance.tone}${compact ? " performance-compact" : ""}`}
      aria-label={`${performance.label}: ${performance.formatted}`}
    >
      <span className="performance-icon" aria-hidden="true">
        {performance.icon}
      </span>
      <span>{performance.formatted}</span>
      {!compact && <span className="performance-label">{performance.label}</span>}
    </span>
  );
}


import { formatCurrency } from "@/lib/format";
import { PerformanceValue } from "./PerformanceValue";

type SummaryCardProps = {
  label: string;
  value: string;
  description: string;
  performance?: boolean;
};

export function SummaryCard({ label, value, description, performance = false }: SummaryCardProps) {
  return (
    <article className="summary-card">
      <p className="summary-label">{label}</p>
      <div className="summary-value">{performance ? <PerformanceValue value={value} /> : formatCurrency(value)}</div>
      <p className="summary-description">{description}</p>
    </article>
  );
}


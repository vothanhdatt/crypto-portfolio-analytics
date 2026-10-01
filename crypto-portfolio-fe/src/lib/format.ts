export type PerformanceTone = "positive" | "negative" | "neutral";

const toDisplayNumber = (value: string) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const currencyFormatter = (maximumFractionDigits: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits,
  });

export const formatCurrency = (value: string) => currencyFormatter(2).format(toDisplayNumber(value));

export const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const formatPrice = (value: string | null) => {
  if (value === null) return "Unavailable";
  const number = toDisplayNumber(value);
  return currencyFormatter(Math.abs(number) < 1 ? 8 : 2).format(number);
};

export const formatQuantity = (value: string) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(toDisplayNumber(value));

export const formatAllocation = (value: string) =>
  new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(toDisplayNumber(value));

export const allocationPercent = (value: string) =>
  Math.min(100, Math.max(0, toDisplayNumber(value) * 100));

export const getPerformance = (value: string) => {
  const number = toDisplayNumber(value);
  const tone: PerformanceTone = number > 0 ? "positive" : number < 0 ? "negative" : "neutral";
  const label = tone === "positive" ? "Gain" : tone === "negative" ? "Loss" : "Flat";
  const icon = tone === "positive" ? "▲" : tone === "negative" ? "▼" : "●";
  const sign = tone === "positive" ? "+" : tone === "negative" ? "−" : "±";

  return {
    tone,
    label,
    icon,
    formatted: `${sign}${currencyFormatter(2).format(Math.abs(number))}`,
  };
};

export const formatPriceTimestamp = (value: string | null) => {
  if (!value) return "Price timestamp unavailable";

  return `${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value))}`;
};

"use client";

import { useState } from "react";
import { allocationPercent, formatAllocation, formatCompactCurrency, formatCurrency, getPerformance } from "@/lib/format";
import type { PortfolioPosition } from "@/types/portfolio";

const allocationColors = ["#80e4b7", "#65b9df", "#e3bd72", "#d98fc8", "#ff9d91", "#a8d780"];
const pnlSeries = [
  { key: "realizedPnl", label: "Realized P&L", color: "#e3bd72" },
  { key: "unrealizedPnl", label: "Unrealized P&L", color: "#80e4b7" },
] as const;

type AllocationPoint = {
  symbol: string;
  currentValue: string;
  allocation: string;
  percent: number;
  color: string;
};

type PnlPoint = {
  symbol: string;
  series: (typeof pnlSeries)[number]["label"];
  value: string;
  color: string;
};

function ChartHeader({ id, eyebrow, title, description }: { id: string; eyebrow: string; title: string; description: string }) {
  return (
    <div className="chart-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
      <p>{description}</p>
    </div>
  );
}

function AllocationChart({ positions }: { positions: PortfolioPosition[] }) {
  const [active, setActive] = useState<AllocationPoint | null>(null);
  const points = positions.map((position, index) => ({
    symbol: position.symbol,
    currentValue: position.currentValue,
    allocation: position.allocation,
    percent: allocationPercent(position.allocation),
    color: allocationColors[index % allocationColors.length],
  }));
  return (
    <section className="panel chart-panel" aria-labelledby="allocation-chart-title">
      <ChartHeader
        id="allocation-chart-title"
        eyebrow="Portfolio mix"
        title="Allocation"
        description="Share of total current value"
      />
      <div className="allocation-chart-layout">
        <div className="donut-stage">
          <svg className="donut-chart" viewBox="0 0 200 200" role="img" aria-labelledby="allocation-chart-title allocation-chart-desc">
            <desc id="allocation-chart-desc">Portfolio allocation by current market value for each asset.</desc>
            <circle className="donut-track" cx="100" cy="100" r="76" pathLength="100" />
            {points.map((point, pointIndex) => {
              const start = points.slice(0, pointIndex).reduce((total, item) => total + item.percent, 0);
              if (point.percent <= 0) return null;

              return (
                <circle
                  className="donut-segment"
                  key={point.symbol}
                  cx="100"
                  cy="100"
                  r="76"
                  pathLength="100"
                  stroke={point.color}
                  strokeDasharray={`${point.percent} ${100 - point.percent}`}
                  strokeDashoffset={-start}
                  transform="rotate(-90 100 100)"
                  tabIndex={0}
                  aria-label={`${point.symbol}: ${formatCurrency(point.currentValue)}, ${formatAllocation(point.allocation)}`}
                  onFocus={() => setActive(point)}
                  onBlur={() => setActive(null)}
                  onMouseEnter={() => setActive(point)}
                  onMouseLeave={() => setActive(null)}
                  onClick={() => setActive(point)}
                />
              );
            })}
          </svg>
          <div className="donut-center" aria-hidden="true">
            <strong>{positions.length}</strong>
            <span>assets</span>
          </div>
          {active && (
            <div className="chart-tooltip donut-tooltip" role="status">
              <strong>{active.symbol}</strong>
              <span>{formatCurrency(active.currentValue)}</span>
              <small>{formatAllocation(active.allocation)} allocated</small>
            </div>
          )}
        </div>

        <ul className="chart-legend allocation-legend" aria-label="Allocation legend">
          {points.map((point) => (
            <li key={point.symbol}>
              <button
                type="button"
                className="legend-button"
                onFocus={() => setActive(point)}
                onBlur={() => setActive(null)}
                onMouseEnter={() => setActive(point)}
                onMouseLeave={() => setActive(null)}
                onClick={() => setActive(point)}
              >
                <span className="legend-swatch" style={{ backgroundColor: point.color }} aria-hidden="true" />
                <strong>{point.symbol}</strong>
                <span>{formatAllocation(point.allocation)}</span>
                <small>{formatCurrency(point.currentValue)}</small>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PnlChart({ positions }: { positions: PortfolioPosition[] }) {
  const [active, setActive] = useState<PnlPoint | null>(null);
  const values = positions.flatMap((position) => [Number(position.realizedPnl), Number(position.unrealizedPnl)]);
  const rawMin = Math.min(0, ...values);
  const rawMax = Math.max(0, ...values);
  const spread = rawMax - rawMin || 2;
  const domainMin = rawMin - spread * 0.12;
  const domainMax = rawMax + spread * 0.12;
  const chartTop = 30;
  const chartBottom = 280;
  const chartLeft = 76;
  const chartRight = 700;
  const plotHeight = chartBottom - chartTop;
  const plotWidth = chartRight - chartLeft;
  const groupWidth = plotWidth / Math.max(positions.length, 1);
  const barWidth = Math.min(32, groupWidth * 0.28);
  const yFor = (value: number) => chartTop + ((domainMax - value) / (domainMax - domainMin)) * plotHeight;
  const zeroY = yFor(0);
  const ticks = [domainMax, 0, domainMin];

  return (
    <section className="panel chart-panel" aria-labelledby="pnl-chart-title">
      <ChartHeader
        id="pnl-chart-title"
        eyebrow="Profit and loss"
        title="P&L by asset"
        description="Realized compared with unrealized"
      />
      <ul className="chart-legend series-legend" aria-label="Profit and loss series">
        {pnlSeries.map((series) => (
          <li key={series.key}>
            <span className="legend-swatch" style={{ backgroundColor: series.color }} aria-hidden="true" />
            <span>{series.label}</span>
          </li>
        ))}
        <li className="zero-legend"><span aria-hidden="true">↕</span><span>Zero line separates gain and loss</span></li>
      </ul>
      <div className="pnl-chart-stage">
        <div className="chart-scroll" tabIndex={0} role="region" aria-label="Scrollable profit and loss chart">
          <svg className="pnl-chart" viewBox="0 0 740 340" role="img" aria-labelledby="pnl-chart-title pnl-chart-desc">
            <desc id="pnl-chart-desc">Grouped bars compare realized and unrealized profit or loss. Bars above zero are gains and bars below zero are losses.</desc>
            {ticks.map((tick) => {
              const y = yFor(tick);
              return (
                <g key={tick}>
                  <line className={tick === 0 ? "chart-zero-line" : "chart-grid-line"} x1={chartLeft} x2={chartRight} y1={y} y2={y} />
                  <text className="chart-axis-label" x={chartLeft - 12} y={y + 4} textAnchor="end">
                    {formatCompactCurrency(tick)}
                  </text>
                </g>
              );
            })}
            {positions.map((position, positionIndex) => {
              const groupCenter = chartLeft + groupWidth * positionIndex + groupWidth / 2;

              return (
                <g key={position.symbol}>
                  {pnlSeries.map((series, seriesIndex) => {
                    const rawValue = position[series.key];
                    const value = Number(rawValue);
                    const valueY = yFor(value);
                    const x = groupCenter + (seriesIndex === 0 ? -barWidth - 3 : 3);
                    const point: PnlPoint = { symbol: position.symbol, series: series.label, value: rawValue, color: series.color };
                    const performance = getPerformance(rawValue);

                    return (
                      <rect
                        className="pnl-bar"
                        key={series.key}
                        x={x}
                        y={Math.min(valueY, zeroY)}
                        width={barWidth}
                        height={Math.max(2, Math.abs(zeroY - valueY))}
                        rx="5"
                        fill={series.color}
                        tabIndex={0}
                        aria-label={`${position.symbol} ${series.label}, ${performance.label}: ${performance.formatted}`}
                        onFocus={() => setActive(point)}
                        onBlur={() => setActive(null)}
                        onMouseEnter={() => setActive(point)}
                        onMouseLeave={() => setActive(null)}
                        onClick={() => setActive(point)}
                      />
                    );
                  })}
                  <text className="chart-asset-label" x={groupCenter} y="318" textAnchor="middle">
                    {position.symbol}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        {active && (
          <div className="chart-tooltip pnl-tooltip" role="status">
            <span><strong>{active.symbol}</strong> · {active.series}</span>
            <strong className={`performance-${getPerformance(active.value).tone}`}>
              {getPerformance(active.value).formatted}
            </strong>
          </div>
        )}
      </div>
    </section>
  );
}

export function PortfolioCharts({ positions }: { positions: PortfolioPosition[] }) {
  return (
    <div className="charts-grid">
      <AllocationChart positions={positions} />
      <PnlChart positions={positions} />
    </div>
  );
}

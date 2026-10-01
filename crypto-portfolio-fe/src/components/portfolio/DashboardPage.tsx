"use client";

import { useEffect, useState } from "react";
import { getPortfolioOverview } from "@/lib/api";
import { formatPriceTimestamp } from "@/lib/format";
import type { PortfolioSnapshot } from "@/types/portfolio";
import { HoldingsTable } from "./HoldingsTable";
import { ImportPanel } from "./ImportPanel";
import { PortfolioCharts } from "./PortfolioCharts";
import { SummaryCard } from "./SummaryCard";
import { TransactionExplorer } from "./TransactionExplorer";

type DashboardState =
  | { status: "loading"; data: null; message: null }
  | { status: "error"; data: null; message: string }
  | { status: "ready"; data: PortfolioSnapshot; message: null };

const initialState: DashboardState = { status: "loading", data: null, message: null };

function LoadingDashboard() {
  return (
    <div className="dashboard-content" aria-busy="true" aria-label="Loading portfolio">
      <div className="dashboard-heading skeleton-heading">
        <span className="skeleton skeleton-short" />
        <span className="skeleton skeleton-title" />
        <span className="skeleton skeleton-copy" />
      </div>
      <div className="summary-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="summary-card skeleton-card" key={index}>
            <span className="skeleton skeleton-short" />
            <span className="skeleton skeleton-value" />
            <span className="skeleton skeleton-copy" />
          </div>
        ))}
      </div>
      <div className="charts-grid">
        {Array.from({ length: 2 }, (_, index) => (
          <div className="panel skeleton-chart" key={index}>
            <span className="skeleton skeleton-short" />
            <span className="skeleton skeleton-title" />
            <span className="skeleton skeleton-chart-area" />
          </div>
        ))}
      </div>
      <div className="panel skeleton-table">
        <span className="skeleton skeleton-title" />
        <span className="skeleton skeleton-row" />
        <span className="skeleton skeleton-row" />
        <span className="skeleton skeleton-row" />
      </div>
      <div className="panel skeleton-table skeleton-transaction-table">
        <span className="skeleton skeleton-title" />
        <span className="skeleton skeleton-copy" />
        <span className="skeleton skeleton-row" />
        <span className="skeleton skeleton-row" />
      </div>
      <span className="sr-only">Loading current portfolio data.</span>
    </div>
  );
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <section className="state-panel" role="alert" aria-labelledby="error-title">
      <span className="state-icon state-icon-error" aria-hidden="true">
        !
      </span>
      <p className="eyebrow">Data unavailable</p>
      <h2 id="error-title">We couldn&apos;t load this portfolio.</h2>
      <p>{message}</p>
      <button className="primary-button" type="button" onClick={retry}>
        Try again
      </button>
    </section>
  );
}

function EmptyState({ priceAsOf }: { priceAsOf: string | null }) {
  return (
    <section className="state-panel" aria-labelledby="empty-title">
      <span className="state-icon" aria-hidden="true">
        0
      </span>
      <p className="eyebrow">No holdings</p>
      <h2 id="empty-title">There are no positions to display.</h2>
      <p>Import a valid trade history to calculate current holdings and performance.</p>
      <p className="state-meta">Price snapshot: {formatPriceTimestamp(priceAsOf)}</p>
    </section>
  );
}

export function DashboardPage() {
  const [state, setState] = useState<DashboardState>(initialState);

  const retryPortfolio = async () => {
    setState(initialState);

    try {
      const data = await getPortfolioOverview();
      setState({ status: "ready", data, message: null });
    } catch (error) {
      setState({
        status: "error",
        data: null,
        message: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    getPortfolioOverview(controller.signal)
      .then((data) => setState({ status: "ready", data, message: null }))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setState({
          status: "error",
          data: null,
          message: error instanceof Error ? error.message : "An unexpected error occurred.",
        });
      });

    return () => controller.abort();
  }, []);

  if (state.status === "loading") return <LoadingDashboard />;
  if (state.status === "error") return <ErrorState message={state.message} retry={retryPortfolio} />;

  const portfolio = state.data;
  if (portfolio.positions.length === 0) return <EmptyState priceAsOf={portfolio.priceAsOf} />;

  const cards = [
    {
      label: "Portfolio value",
      value: portfolio.summary.currentValue,
      description: "Market value at the latest supplied prices",
    },
    {
      label: "Current cost basis",
      value: portfolio.summary.currentCostBasis,
      description: "Remaining weighted-average cost",
    },
    {
      label: "Realized P&L",
      value: portfolio.summary.realizedPnl,
      description: "Net result from completed sales",
      performance: true,
    },
    {
      label: "Unrealized P&L",
      value: portfolio.summary.unrealizedPnl,
      description: "Open-position gain or loss",
      performance: true,
    },
    {
      label: "Total P&L",
      value: portfolio.summary.totalPnl,
      description: "Realized plus unrealized performance",
      performance: true,
    },
    {
      label: "Fees paid",
      value: portfolio.summary.totalFees,
      description: "BUY and SELL fees across all trades",
    },
  ];

  return (
    <div className="dashboard-content">
      <section className="dashboard-heading" aria-labelledby="dashboard-title">
        <div>
          <p className="eyebrow">Current portfolio</p>
          <h2 id="dashboard-title">Performance at a glance</h2>
          <p className="dashboard-description">
            Weighted-average holdings and profit or loss across Binance and Coinbase.
          </p>
        </div>
        <div className="valuation-stamp">
          <span className="valuation-dot" aria-hidden="true" />
          <div>
            <span>Valued at supplied prices</span>
            <time dateTime={portfolio.priceAsOf || undefined}>{formatPriceTimestamp(portfolio.priceAsOf)}</time>
          </div>
        </div>
      </section>

      <ImportPanel
        portfolio={portfolio}
        onPortfolioChange={(snapshot) => setState({ status: "ready", data: snapshot, message: null })}
      />

      <section className="summary-grid" aria-label="Portfolio summary">
        {cards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </section>

      <PortfolioCharts positions={portfolio.positions} />

      <section className="panel holdings-panel" aria-labelledby="holdings-title">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Asset breakdown</p>
            <h2 id="holdings-title">Holdings</h2>
          </div>
          <div className="panel-meta">
            <strong>{portfolio.positions.length}</strong> assets · <strong>{portfolio.transactionCount}</strong> trades
          </div>
        </div>
        <HoldingsTable positions={portfolio.positions} />
      </section>

      <TransactionExplorer transactions={portfolio.transactions} />
    </div>
  );
}

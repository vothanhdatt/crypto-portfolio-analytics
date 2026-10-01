"use client";

import { useMemo, useState } from "react";
import { formatCurrency, formatPrice, formatQuantity } from "@/lib/format";
import type { PortfolioTransaction } from "@/types/portfolio";

const pageSizeOptions = [10, 25, 50];

type SideFilter = "ALL" | PortfolioTransaction["side"];
type SortDirection = "asc" | "desc";

export function TransactionExplorer({ transactions }: { transactions: PortfolioTransaction[] }) {
  const [query, setQuery] = useState("");
  const [exchange, setExchange] = useState("ALL");
  const [side, setSide] = useState<SideFilter>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const exchanges = useMemo(
    () => Array.from(new Set(transactions.map((transaction) => transaction.exchange))).sort(),
    [transactions],
  );

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return transactions
      .filter((transaction) => !normalizedQuery || transaction.symbol.toLowerCase().includes(normalizedQuery))
      .filter((transaction) => exchange === "ALL" || transaction.exchange === exchange)
      .filter((transaction) => side === "ALL" || transaction.side === side)
      .filter((transaction) => !dateFrom || transaction.timestamp.slice(0, 10) >= dateFrom)
      .filter((transaction) => !dateTo || transaction.timestamp.slice(0, 10) <= dateTo)
      .toSorted((left, right) => {
        const timestampOrder = left.timestamp.localeCompare(right.timestamp);
        const order = timestampOrder || left.tradeId.localeCompare(right.tradeId);
        return sortDirection === "asc" ? order : -order;
      });
  }, [dateFrom, dateTo, exchange, query, side, sortDirection, transactions]);

  const pageCount = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const visibleTransactions = filteredTransactions.slice(pageStart, pageStart + pageSize);
  const hasFilters = Boolean(query || exchange !== "ALL" || side !== "ALL" || dateFrom || dateTo);

  const resetPage = () => setPage(1);
  const clearFilters = () => {
    setQuery("");
    setExchange("ALL");
    setSide("ALL");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <section className="panel transaction-panel" aria-labelledby="transactions-title">
      <div className="panel-heading transaction-heading">
        <div>
          <p className="eyebrow">Activity ledger</p>
          <h2 id="transactions-title">Transaction explorer</h2>
        </div>
        <div className="transaction-summary" aria-live="polite">
          <span className="transaction-count"><strong>{filteredTransactions.length}</strong> / <strong>{transactions.length}</strong> transactions</span>
          <span>View-only filters · portfolio totals stay unchanged</span>
        </div>
      </div>

      <div className="transaction-filters" aria-label="Transaction filters">
        <label className="filter-field filter-search">
          <span>Asset</span>
          <input
            type="search"
            value={query}
            placeholder="Search BTC, ETH…"
            onChange={(event) => {
              setQuery(event.target.value);
              resetPage();
            }}
          />
        </label>

        <label className="filter-field">
          <span>Exchange</span>
          <select
            value={exchange}
            onChange={(event) => {
              setExchange(event.target.value);
              resetPage();
            }}
          >
            <option value="ALL">All exchanges</option>
            {exchanges.map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
        </label>

        <label className="filter-field">
          <span>Side</span>
          <select
            value={side}
            onChange={(event) => {
              setSide(event.target.value as SideFilter);
              resetPage();
            }}
          >
            <option value="ALL">BUY &amp; SELL</option>
            <option value="BUY">BUY only</option>
            <option value="SELL">SELL only</option>
          </select>
        </label>

        <label className="filter-field">
          <span>From</span>
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(event) => {
              setDateFrom(event.target.value);
              resetPage();
            }}
          />
        </label>

        <label className="filter-field">
          <span>To</span>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(event) => {
              setDateTo(event.target.value);
              resetPage();
            }}
          />
        </label>

        <button className="secondary-button clear-filter-button" type="button" onClick={clearFilters} disabled={!hasFilters}>
          Clear filters
        </button>
      </div>

      <div className="transaction-table-scroll" role="region" aria-label="Filtered transactions" tabIndex={0}>
        <table className="transaction-table">
          <thead>
            <tr>
              <th scope="col">Trade ID</th>
              <th scope="col" aria-sort={sortDirection === "desc" ? "descending" : "ascending"}>
                <button
                  className="sort-button"
                  type="button"
                  onClick={() => {
                    setSortDirection((current) => current === "desc" ? "asc" : "desc");
                    resetPage();
                  }}
                  aria-label={`Sort timestamp ${sortDirection === "desc" ? "oldest first" : "newest first"}`}
                >
                  Timestamp <span aria-hidden="true">{sortDirection === "desc" ? "↓" : "↑"}</span>
                </button>
              </th>
              <th scope="col">Exchange</th>
              <th scope="col">Asset</th>
              <th scope="col">Side</th>
              <th scope="col" className="numeric-cell">Quantity</th>
              <th scope="col" className="numeric-cell">Execution price</th>
              <th scope="col" className="numeric-cell">
                <span className="column-heading-stack">Gross value<small>quantity × price</small></span>
              </th>
              <th scope="col" className="numeric-cell fee-heading">Fee</th>
            </tr>
          </thead>
          <tbody>
            {visibleTransactions.length > 0 ? visibleTransactions.map((transaction) => (
              <tr key={transaction.tradeId}>
                <th scope="row" className="trade-id-cell">{transaction.tradeId}</th>
                <td><time dateTime={transaction.timestamp}>{transaction.timestamp}</time></td>
                <td>{transaction.exchange}</td>
                <td><strong>{transaction.symbol}</strong></td>
                <td><span className={`side-badge side-${transaction.side.toLowerCase()}`}>{transaction.side}</span></td>
                <td className="numeric-cell tabular-number">{formatQuantity(transaction.quantity)}</td>
                <td className="numeric-cell tabular-number">{formatPrice(transaction.priceUsd)}</td>
                <td className="numeric-cell tabular-number gross-value-cell">{formatCurrency(transaction.grossValue)}</td>
                <td className="numeric-cell"><span className="fee-value">{formatCurrency(transaction.feeUsd)}</span></td>
              </tr>
            )) : (
              <tr>
                <td className="transaction-empty" colSpan={9}>
                  <strong>No transactions match these filters.</strong>
                  <span>Adjust the asset, exchange, side, or date range to see results.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-bar">
        <label className="page-size-control">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              resetPage();
            }}
          >
            {pageSizeOptions.map((size) => <option value={size} key={size}>{size}</option>)}
          </select>
        </label>

        <p>
          {filteredTransactions.length > 0
            ? `${pageStart + 1}–${Math.min(pageStart + pageSize, filteredTransactions.length)} of ${filteredTransactions.length}`
            : "0 results"}
        </p>

        <nav className="pagination-controls" aria-label="Transaction pages">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage === 1}>
            Previous
          </button>
          <span>Page <strong>{safePage}</strong> of <strong>{pageCount}</strong></span>
          <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={safePage === pageCount}>
            Next
          </button>
        </nav>
      </div>
    </section>
  );
}

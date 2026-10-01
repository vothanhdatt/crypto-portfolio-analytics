import { allocationPercent, formatAllocation, formatCurrency, formatPrice, formatQuantity } from "@/lib/format";
import type { PortfolioPosition } from "@/types/portfolio";
import { PerformanceValue } from "./PerformanceValue";

export function HoldingsTable({ positions }: { positions: PortfolioPosition[] }) {
  return (
    <div className="table-scroll" role="region" aria-label="Portfolio holdings" tabIndex={0}>
      <table className="holdings-table">
        <thead>
          <tr>
            <th scope="col">Asset</th>
            <th scope="col" className="numeric-cell">Quantity</th>
            <th scope="col" className="numeric-cell">Avg. cost</th>
            <th scope="col" className="numeric-cell">Current price</th>
            <th scope="col" className="numeric-cell">Cost basis</th>
            <th scope="col" className="numeric-cell">Current value</th>
            <th scope="col" className="numeric-cell">Realized P&amp;L</th>
            <th scope="col" className="numeric-cell">Unrealized P&amp;L</th>
            <th scope="col" className="numeric-cell">Total P&amp;L</th>
            <th scope="col">Allocation</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => {
            const allocation = allocationPercent(position.allocation);

            return (
              <tr key={position.symbol}>
                <th scope="row">
                  <span className="asset-cell">
                    <span className="asset-mark" aria-hidden="true">
                      {position.symbol.slice(0, 1)}
                    </span>
                    <span>{position.symbol}</span>
                  </span>
                </th>
                <td className="numeric-cell tabular-number">{formatQuantity(position.quantity)}</td>
                <td className="numeric-cell tabular-number">{formatPrice(position.averageCost)}</td>
                <td className="numeric-cell tabular-number">{formatPrice(position.currentPrice)}</td>
                <td className="numeric-cell tabular-number">{formatCurrency(position.currentCostBasis)}</td>
                <td className="numeric-cell tabular-number value-cell">{formatCurrency(position.currentValue)}</td>
                <td className="numeric-cell">
                  <PerformanceValue value={position.realizedPnl} compact />
                </td>
                <td className="numeric-cell">
                  <PerformanceValue value={position.unrealizedPnl} compact />
                </td>
                <td className="numeric-cell">
                  <PerformanceValue value={position.totalPnl} compact />
                </td>
                <td>
                  <div className="allocation-cell">
                    <span className="tabular-number">{formatAllocation(position.allocation)}</span>
                    <progress value={allocation} max="100" aria-label={`${position.symbol} allocation`} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


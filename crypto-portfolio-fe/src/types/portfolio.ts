export type PortfolioSummary = {
  currentValue: string;
  currentCostBasis: string;
  realizedPnl: string;
  unrealizedPnl: string;
  totalPnl: string;
  totalFees: string;
};

export type PortfolioPosition = {
  symbol: string;
  quantity: string;
  averageCost: string;
  currentPrice: string | null;
  currentCostBasis: string;
  currentValue: string;
  realizedPnl: string;
  unrealizedPnl: string;
  totalPnl: string;
  allocation: string;
  totalFees: string;
};

export type PortfolioTransaction = {
  tradeId: string;
  timestamp: string;
  exchange: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: string;
  priceUsd: string;
  feeUsd: string;
  grossValue: string;
};

export type PortfolioSnapshot = {
  priceAsOf: string | null;
  summary: PortfolioSummary;
  positions: PortfolioPosition[];
  transactions: PortfolioTransaction[];
  transactionCount: number;
  source: "sample" | "import";
};

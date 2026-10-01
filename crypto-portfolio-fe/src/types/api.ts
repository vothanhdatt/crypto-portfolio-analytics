export type ApiResponse<T> = {
  status: boolean;
  data: T | null;
  message: string;
};

export type ApiErrorDetail = {
  row?: number | null;
  tradeId?: string | null;
  field?: string | null;
  code: string;
  message: string;
  value?: unknown;
};

export type HealthResponse = {
  service: string;
  state: "ready";
  timestamp: string;
};

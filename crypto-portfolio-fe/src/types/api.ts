export type ApiResponse<T> = {
  status: boolean;
  data: T | null;
  message: string;
};

export type HealthResponse = {
  service: string;
  state: "ready";
  timestamp: string;
};


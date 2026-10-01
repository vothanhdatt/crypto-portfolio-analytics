import type { ApiErrorDetail, ApiResponse, HealthResponse } from "@/types/api";
import type { PortfolioSnapshot } from "@/types/portfolio";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:1113").replace(/\/$/, "");

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

const parseResponse = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.status || payload.data === null) {
    throw new ApiRequestError(
      payload.message || "Request failed",
      response.status,
      Array.isArray(payload.data) ? (payload.data as ApiErrorDetail[]) : [],
    );
  }

  return payload.data;
};

const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store", ...init });
  return parseResponse<T>(response);
};

export const getHealth = () => apiRequest<HealthResponse>("/api/v1/health");

export const getPortfolioOverview = (signal?: AbortSignal) =>
  apiRequest<PortfolioSnapshot>("/api/portfolio", { signal });

export const importTrades = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<PortfolioSnapshot>("/api/import", {
    method: "POST",
    body: formData,
  });
};

export const resetTrades = () =>
  apiRequest<PortfolioSnapshot>("/api/reset", {
    method: "POST",
  });

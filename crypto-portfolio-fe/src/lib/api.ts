import type { ApiResponse, HealthResponse } from "@/types/api";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:1113").replace(/\/$/, "");

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

const apiRequest = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.status || payload.data === null) {
    throw new ApiRequestError(payload.message || "Request failed", response.status);
  }

  return payload.data;
};

export const getHealth = () => apiRequest<HealthResponse>("/api/v1/health");


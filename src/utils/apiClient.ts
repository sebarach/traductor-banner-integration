import type { IPublicClientApplication } from "@azure/msal-browser";
import type { ApiError, ApiResponse } from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const APIM_SUBSCRIPTION_KEY = import.meta.env.VITE_APIM_SUBSCRIPTION_KEY;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL no está configurada en .env");
}

async function getIdToken(
  msalInstance: IPublicClientApplication
): Promise<string> {
  const accounts = msalInstance.getAllAccounts();

  if (accounts.length === 0) {
    throw new Error("No hay usuario autenticado");
  }

  const account = accounts[0];

  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes: ["User.Read"],
      account: account,
    });

    return response.idToken;
  } catch (error) {
    try {
      const response = await msalInstance.acquireTokenPopup({
        scopes: ["User.Read"],
        account: account,
      });

      return response.idToken;
    } catch (popupError) {
      console.error("Error adquiriendo ID token:", popupError);
      throw new Error("No se pudo obtener un ID token válido");
    }
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
  retry?: boolean;
}

export class ApiClient {
  private msalInstance: IPublicClientApplication;

  constructor(msalInstance: IPublicClientApplication) {
    this.msalInstance = msalInstance;
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = "GET", body, headers = {}, retry = true } = options;

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(url);
      const requestHeaders: HeadersInit = {
        "Content-Type": "application/json",
        ...headers,
      };

      const idToken = await getIdToken(this.msalInstance);
      requestHeaders["X-User-Token"] = idToken;

      // Agregar subscription key de APIM si está configurada
      if (APIM_SUBSCRIPTION_KEY) {
        requestHeaders["Ocp-Apim-Subscription-Key"] = APIM_SUBSCRIPTION_KEY;
      }

      // Realizar petición
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status === 401 && retry) {
        const accounts = this.msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          await this.msalInstance.acquireTokenSilent({
            scopes: ["User.Read"],
            account: accounts[0],
            forceRefresh: true,
          });
          return this.request<T>(endpoint, { ...options, retry: false });
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          message: errorData.message || `HTTP Error ${response.status}`,
          status: response.status,
          details: errorData,
        };
        throw error;
      }

      const data = await response.json();

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      if (error && typeof error === "object" && "status" in error) {
        throw error;
      }

      const apiError: ApiError = {
        message: error instanceof Error ? error.message : "Error desconocido",
        status: 0,
        details: error,
      };
      throw apiError;
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: "GET",
      headers,
    });
    return response.data;
  }

  async getWithHeaders<T>(
    endpoint: string,
    customHeaders?: Record<string, string>
  ): Promise<{ data: T; headers: Headers }> {
    const { method = "GET", headers = {} } = {
      method: "GET" as const,
      headers: customHeaders || {},
    };

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const requestHeaders: HeadersInit = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        ...headers,
      };

      const idToken = await getIdToken(this.msalInstance);
      requestHeaders["X-User-Token"] = idToken;

      if (APIM_SUBSCRIPTION_KEY) {
        requestHeaders["Ocp-Apim-Subscription-Key"] = APIM_SUBSCRIPTION_KEY;
      }

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          message: errorData.message || `HTTP Error ${response.status}`,
          status: response.status,
          details: errorData,
        };
        throw error;
      }

      const data = await response.json();

      return {
        data,
        headers: response.headers,
      };
    } catch (error) {
      if (error && typeof error === "object" && "status" in error) {
        throw error;
      }
      const apiError: ApiError = {
        message: error instanceof Error ? error.message : "Error desconocido",
        status: 0,
        details: error,
      };
      throw apiError;
    }
  }

  async post<T>(
    endpoint: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: "POST",
      body,
      headers,
    });
    return response.data;
  }

  async put<T>(
    endpoint: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: "PUT",
      body,
      headers,
    });
    return response.data;
  }

  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: "DELETE",
      headers,
    });
    return response.data;
  }
}

export function createApiClient(
  msalInstance: IPublicClientApplication
): ApiClient {
  return new ApiClient(msalInstance);
}

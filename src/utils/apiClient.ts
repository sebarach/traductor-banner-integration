import type { IPublicClientApplication } from "@azure/msal-browser";
import type { ApiError, ApiResponse } from "../types/api";

/**
 * API Client robusto
 *
 * Características:
 * - SIEMPRE envía el ID token del usuario autenticado (SSO) para validar en Azure Function
 * - Azure Function valida el token antes de procesar la petición
 * - Retry automático en caso de error 401
 * - Manejo de errores centralizado
 * - Type-safe con TypeScript
 * - Soporte para diferentes métodos HTTP
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const APIM_SUBSCRIPTION_KEY = import.meta.env.VITE_APIM_SUBSCRIPTION_KEY;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL no está configurada en .env");
}

/**
 * Obtiene el ID token del usuario autenticado (SSO)
 * Este token se usará para validar que el usuario está autenticado en la Azure Function
 */
async function getIdToken(
  msalInstance: IPublicClientApplication
): Promise<string> {
  const accounts = msalInstance.getAllAccounts();

  if (accounts.length === 0) {
    throw new Error("No hay usuario autenticado");
  }

  const account = accounts[0];

  try {
    // Obtener el token silenciosamente (desde cache)
    const response = await msalInstance.acquireTokenSilent({
      scopes: ["User.Read"], // Solo necesitamos User.Read para obtener el ID token
      account: account,
    });

    // Retornamos el idToken (no el accessToken)
    return response.idToken;
  } catch (error) {
    // Si falla, intentar con popup
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

/**
 * Opciones para las peticiones de API
 */
interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
  retry?: boolean;
}

/**
 * Cliente API principal
 */
export class ApiClient {
  private msalInstance: IPublicClientApplication;

  constructor(msalInstance: IPublicClientApplication) {
    this.msalInstance = msalInstance;
  }

  /**
   * Realiza una petición HTTP a la API
   * - SIEMPRE envía el ID token del usuario para validar autenticación en Azure Function
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = "GET", body, headers = {}, retry = true } = options;

    try {
      // Construir URL completa
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(url);
      // Preparar headers base
      const requestHeaders: HeadersInit = {
        "Content-Type": "application/json",
        ...headers,
      };

      // SIEMPRE enviar el ID token del usuario autenticado
      // IMPORTANTE: Solo usar X-User-Token porque Azure Static Web Apps intercepta Authorization
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

      // Si es 401 y retry está habilitado, intenta refrescar token
      if (response.status === 401 && retry) {
        // Forzar refresh del token
        const accounts = this.msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          await this.msalInstance.acquireTokenSilent({
            scopes: ["User.Read"],
            account: accounts[0],
            forceRefresh: true,
          });

          // Reintentar con retry = false para evitar loop infinito
          return this.request<T>(endpoint, { ...options, retry: false });
        }
      }

      // Manejar errores HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          message: errorData.message || `HTTP Error ${response.status}`,
          status: response.status,
          details: errorData,
        };
        throw error;
      }

      // Parsear respuesta
      const data = await response.json();

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      // Si es un ApiError, re-lanzarlo
      if (error && typeof error === "object" && "status" in error) {
        throw error;
      }

      // Si es otro tipo de error, convertirlo a ApiError
      const apiError: ApiError = {
        message: error instanceof Error ? error.message : "Error desconocido",
        status: 0,
        details: error,
      };
      throw apiError;
    }
  }

  /**
   * GET request helper
   */
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    const response = await this.request<T>(endpoint, {
      method: "GET",
      headers,
    });
    return response.data;
  }

  /**
   * GET request que devuelve datos y headers (útil para paginación)
   */
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

      console.log("🌐 Full request URL:", url);
      console.log("📋 Request headers:", requestHeaders);

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        cache: "no-store", // Disable browser caching
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

  /**
   * POST request helper
   */
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

  /**
   * PUT request helper
   */
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

  /**
   * DELETE request helper
   */
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

/**
 * Hook para usar el ApiClient en componentes React
 */
export function createApiClient(
  msalInstance: IPublicClientApplication
): ApiClient {
  return new ApiClient(msalInstance);
}

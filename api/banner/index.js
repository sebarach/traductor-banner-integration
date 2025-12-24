const msal = require("@azure/msal-node");
const { authorizeRequest } = require("../shared/authMiddleware");

const msalConfig = {
  auth: {
    clientId: process.env.API_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.API_CLIENT_SECRET,
  },
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

async function getAccessToken() {
  const tokenRequest = {
    scopes: [process.env.API_SCOPE],
  };

  try {
    const response = await cca.acquireTokenByClientCredential(tokenRequest);
    return response.accessToken;
  } catch (error) {
    throw error;
  }
}

function handlePersonNotFoundError(route) {
  return {
    error: "PersonNotFound",
    message: "No se encontro ninguna persona con el Banner ID proporcionado.",
  };
}

const ERROR_HANDLERS = {
  person: {
    404: handlePersonNotFoundError,
  },
};

function getErrorHandler(route, statusCode) {
  const routePrefix = route.split("/")[0];
  return ERROR_HANDLERS[routePrefix]?.[statusCode] || null;
}

module.exports = async function (context, req) {
  const route = context.bindingData.route || "";

  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Token",
    "Content-Type": "application/json",
  };

  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    context.res = {
      status: 204,
      headers,
    };
    return;
  }

  try {
    // OJITO: Usar solo X-User-Token porque Azure Static Web Apps intercepta Authorization
    const userToken = req.headers["x-user-token"];
    const writeSecret = req.headers["x-secret-write"];
    // Validar autorización con middleware
    const authResult = await authorizeRequest(userToken, route, req.method);

    if (!authResult.authorized) {
      context.log.error("Autorización fallida:", authResult.error);
      context.res = {
        status: authResult.error.status,
        headers,
        body: {
          error: authResult.error.status === 401 ? "Unauthorized" : "Forbidden",
          message: authResult.error.message,
          details: authResult.error.details,
        },
      };
      return;
    }

    context.log("Usuario autorizado:", authResult.user.email);

    // Obtener access token con Client Credentials
    const accessToken = await getAccessToken();

    // Construir la URL de la API backend con la ruta dinámica
    let apiUrl = `${process.env.API_BASE_URL}/api/${route}`;

    // IMPORTANTE: Agregar query parameters del request original
    if (req.query && Object.keys(req.query).length > 0) {
      const queryString = Object.entries(req.query)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        )
        .join("&");
      apiUrl += `?${queryString}`;
    }

    // Construir headers para APIM
    const apimHeaders = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": process.env.APIM_SUBSCRIPTION_KEY || "",
    };

    // Pasar el header x-secret-write a APIM si existe
    if (writeSecret) {
      apimHeaders["x-secret-write"] = writeSecret;
    }

    context.log("📤 Headers enviados a APIM:", Object.keys(apimHeaders));
    context.log(
      "x-secret-write enviado a APIM:",
      !!apimHeaders["x-secret-write"]
    );

    const response = await fetch(apiUrl, {
      method: req.method || "GET",
      headers: apimHeaders,
      body:
        req.method !== "GET" && req.body ? JSON.stringify(req.body) : undefined,
    });

    const rawBody = await response.text();
    let data = null;

    if (rawBody) {
      try {
        data = JSON.parse(rawBody);
      } catch (parseError) {
        data = rawBody;
      }
    }

    if (!response.ok) {
      const errorHandler = getErrorHandler(route, response.status);

      if (errorHandler) {
        const errorBody = errorHandler(route);
        context.res = {
          status: response.status,
          headers,
          body: errorBody,
        };
        return;
      }

      context.res = {
        status: response.status,
        headers,
        body: data || {
          error: "ApiError",
          message: `La API respondio con el estado ${response.status}.`,
        },
      };
      return;
    }

    context.res = {
      status: response.status,
      headers,
      body: data,
    };
  } catch (error) {
    context.log.error("Error in banner proxy function:", error);
    context.res = {
      status: 500,
      headers,
      body: {
        error: "Internal server error",
        message: error.message,
        route: route,
      },
    };
  }
};

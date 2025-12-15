const msal = require("@azure/msal-node");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const msalConfig = {
  auth: {
    clientId: process.env.API_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.API_CLIENT_SECRET,
  },
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

// const client = jwksClient({
//   jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`,
// });

async function validateUserToken(token) {
  if (!token) return false;

  const cleanToken = token.replace("Bearer ", "").trim();
  const decoded = jwt.decode(cleanToken);

  if (!decoded) return false;

  const expectedIssuer = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`;
  const expectedAudience = process.env.SSO_CLIENT_ID;

  const issuerOk = decoded.iss === expectedIssuer;
  const audienceOk = decoded.aud === expectedAudience;

  return issuerOk && audienceOk;
}

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

    if (process.env.SSO_CLIENT_ID) {
      const isValidToken = await validateUserToken(userToken);

      if (!isValidToken) {
        context.log.error("Token de usuario inválido");
        context.res = {
          status: 401,
          headers,
          body: {
            error: "Unauthorized",
            message: "Debe estar autenticado para acceder a este recurso",
          },
        };
        return;
      }
    }

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

    const response = await fetch(apiUrl, {
      method: req.method || "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": process.env.APIM_SUBSCRIPTION_KEY || "",
      },
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

    if (response.status === 404 && route.startsWith("person/")) {
      context.res = {
        status: 404,
        headers,
        body: {
          error: "PersonNotFound",
          message:
            "No se encontro ninguna persona con el Banner ID proporcionado.",
        },
      };
      return;
    }

    if (!response.ok) {
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

    console.log("Respuesta recibida - Status:", response.status);

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

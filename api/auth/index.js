const msal = require("@azure/msal-node");
const jwt = require("jsonwebtoken");

// Configuración MSAL para Client Credentials (igual que banner)
const msalConfig = {
  auth: {
    clientId: process.env.API_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.API_CLIENT_SECRET,
  },
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

// Obtener Access Token con Client Credentials
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

// Validar ID Token del usuario (SSO)
async function validateUserToken(token) {
  if (!token) return null;

  const cleanToken = token.replace("Bearer ", "").trim();
  const decoded = jwt.decode(cleanToken);

  if (!decoded) return null;

  const expectedIssuer = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`;
  const expectedAudience = process.env.SSO_CLIENT_ID;

  const issuerOk = decoded.iss === expectedIssuer;
  const audienceOk = decoded.aud === expectedAudience;

  if (issuerOk && audienceOk) {
    return {
      email: decoded.email || decoded.preferred_username,
      name: decoded.name,
      tenantId: decoded.tid,
    };
  }

  return null;
}

// Transformar respuesta de APIM a formato del frontend
function transformUserProfileResponse(apiData) {
  // Transformar modules array a objeto de permisos
  const permissions = {};

  if (apiData.modules && Array.isArray(apiData.modules)) {
    apiData.modules.forEach(module => {
      const moduleCode = module.moduleCode.toLowerCase();

      // Mapear códigos de módulo de APIM a códigos del frontend
      let frontendModuleCode = moduleCode;
      if (moduleCode === 'int') {
        frontendModuleCode = 'integrations';
      } else if (moduleCode === 'usr' || moduleCode === 'users' || moduleCode === 'user') {
        frontendModuleCode = 'users-roles';
      }

      // Si tiene múltiples permisos, tomar el más alto (WRITE > READ)
      if (module.permissions && Array.isArray(module.permissions)) {
        if (module.permissions.includes('WRITE')) {
          permissions[frontendModuleCode] = 'WRITE';
        } else if (module.permissions.includes('READ')) {
          permissions[frontendModuleCode] = 'READ';
        }
      }
    });
  }

  return {
    user: {
      userId: apiData.userId,
      email: apiData.email,
      displayName: apiData.displayName,
      roleId: apiData.role?.roleId,
      status: apiData.status,
      lastAccessAt: apiData.lastAccessAt,
      createdAt: apiData.userCreatedAt,
    },
    role: apiData.role,
    permissions: permissions,
  };
}

module.exports = async function (context, req) {
  const route = context.bindingData.route || "";

  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Token",
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
    // Validar ID Token del usuario (SSO)
    const userToken = req.headers["x-user-token"];
    const tokenData = await validateUserToken(userToken);

    if (!tokenData) {
      context.log.error("❌ Token inválido o no proporcionado");
      context.res = {
        status: 401,
        headers,
        body: {
          error: "Unauthorized",
          message: "Token inválido o expirado"
        },
      };
      return;
    }

    context.log("✅ Usuario autenticado:", tokenData.email);
    context.log("🔍 Route capturada:", route);
    context.log("🔍 Query params:", req.query);

    // Obtener access token con Client Credentials para llamar a APIM
    const accessToken = await getAccessToken();
    context.log("✅ Access Token obtenido");

    // Construir URL de APIM
    // API_BASE_URL ya incluye "traductor-sis", solo agregamos /api/auth/
    let apiUrl = `${process.env.API_BASE_URL}/api/auth/${route}`;

    // Agregar query parameters del request original
    if (req.query && Object.keys(req.query).length > 0) {
      const queryString = Object.entries(req.query)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        )
        .join("&");
      apiUrl += `?${queryString}`;
    }

    context.log("📡 Llamando a APIM:", apiUrl);

    // Hacer request a APIM con Access Token
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

    if (!response.ok) {
      context.log.error("❌ Error de APIM:", response.status, data);
      context.res = {
        status: response.status,
        headers,
        body: data || {
          error: "ApiError",
          message: `La API respondió con el estado ${response.status}.`,
        },
      };
      return;
    }

    // Transformar respuesta según el endpoint
    if (route === "user-profile") {
      data = transformUserProfileResponse(data);
      context.log("✅ Perfil de usuario transformado:", {
        email: data.user.email,
        role: data.role.roleName,
        permissions: data.permissions
      });
    } else if (route === "users" && req.method === "GET") {
      // Transformar lista de usuarios
      data = data.map(user => ({
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
        roleId: user.role.roleId,
        status: user.status,
        lastAccessAt: user.lastAccessAt,
        createdAt: user.userCreatedAt,
        createdBy: user.createdBy || "SYSTEM",
        role: user.role
      }));
      context.log("✅ Lista de usuarios transformada:", data.length, "usuarios");
    } else if (route === "roles" && req.method === "GET") {
      // Transformar lista de roles - asegurar que permissions sea un array
      data = data.map(role => ({
        ...role,
        permissions: role.permissions || [],
        permissionCount: role.permissions ? role.permissions.length : 0,
        userCount: role.userCount || 0
      }));
      context.log("✅ Lista de roles transformada:", data.length, "roles");
    } else if (route === "modules" && req.method === "GET") {
      // Transformar lista de módulos
      data = data.map(module => ({
        moduleId: module.id,
        moduleCode: module.moduleCode,
        moduleName: module.moduleName,
        moduleDescription: module.moduleDescription,
        iconName: module.iconName || "Layers",
        routePattern: module.routePattern,
        displayOrder: parseInt(module.displayOrder) || 0,
        isActive: module.isActive === 1 || module.isActive === true
      }));
      context.log("✅ Lista de módulos transformada:", data.length, "módulos");
    }

    context.res = {
      status: response.status,
      headers,
      body: data,
    };
  } catch (error) {
    context.log.error("❌ Error in auth proxy function:", error);
    context.res = {
      status: 500,
      headers,
      body: {
        error: "InternalServerError",
        message: error.message,
        route: route,
      },
    };
  }
};

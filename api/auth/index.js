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

function transformUserProfileResponse(apiData) {
  const permissions = {};

  if (apiData.modules && Array.isArray(apiData.modules)) {
    apiData.modules.forEach((module) => {
      const moduleCode = module.moduleCode.toLowerCase();

      let frontendModuleCode = moduleCode;
      if (moduleCode === "int") {
        frontendModuleCode = "integrations";
      } else if (
        moduleCode === "usr" ||
        moduleCode === "users" ||
        moduleCode === "user"
      ) {
        frontendModuleCode = "users-roles";
      }

      if (module.permissions && Array.isArray(module.permissions)) {
        if (module.permissions.includes("WRITE")) {
          permissions[frontendModuleCode] = "WRITE";
        } else if (module.permissions.includes("READ")) {
          permissions[frontendModuleCode] = "READ";
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

function transformUsersList(users) {
  return users.map((user) => ({
    userId: user.userId,
    email: user.email,
    displayName: user.displayName,
    roleId: user.role.roleId,
    status: user.status,
    lastAccessAt: user.lastAccessAt,
    createdAt: user.userCreatedAt,
    createdBy: user.createdBy || "SYSTEM",
    role: user.role,
  }));
}

function transformUserResponse(user) {
  return {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    roleId: user.roleId,
    status: user.status,
    lastAccessAt: user.lastAccessAt,
    createdAt: user.createdAt,
    createdBy: user.createdBy,
    updatedAt: user.updatedAt,
    updatedBy: user.updatedBy,
  };
}

function transformRolesList(roles) {
  return roles.map((role) => ({
    ...role,
    permissions: role.permissions || [],
    permissionCount: role.permissions ? role.permissions.length : 0,
    userCount: role.userCount || 0,
  }));
}

function transformModulesList(modules) {
  return modules.map((module) => ({
    moduleId: module.id,
    moduleCode: module.moduleCode,
    moduleName: module.moduleName,
    moduleDescription: module.moduleDescription,
    iconName: module.iconName || "Layers",
    routePattern: module.routePattern,
    displayOrder: parseInt(module.displayOrder) || 0,
    isActive: module.isActive === 1 || module.isActive === true,
  }));
}

const TRANSFORMERS = {
  "user-profile": {
    GET: (data, context) => {
      const transformed = transformUserProfileResponse(data);
      return transformed;
    },
  },
  users: {
    GET: (data, context) => {
      const transformed = transformUsersList(data);
      return transformed;
    },
    POST: (data, context) => {
      const transformed = transformUserResponse(data);
      return transformed;
    },
  },
  "users/:id": {
    PUT: (data, context) => {
      const transformed = transformUserResponse(data);
      return transformed;
    },
  },
  roles: {
    GET: (data, context) => {
      const transformed = transformRolesList(data);
      return transformed;
    },
  },
  modules: {
    GET: (data, context) => {
      const transformed = transformModulesList(data);
      return transformed;
    },
  },
};

function getTransformer(route, method) {
  if (TRANSFORMERS[route]?.[method]) {
    return TRANSFORMERS[route][method];
  }

  if (route.startsWith("users/")) {
    return TRANSFORMERS["users/:id"]?.[method];
  }

  return null;
}

module.exports = async function (context, req) {
  const route = context.bindingData.route || "";

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
      context.res = {
        status: 401,
        headers,
        body: {
          error: "Unauthorized",
          message: "Token inválido o expirado",
        },
      };
      return;
    }

    // Obtener access token con Client Credentials para llamar a APIM
    const accessToken = await getAccessToken();

    // Construir URL de APIM
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

    context.log("Llamando a APIM:", apiUrl);

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

    const transformer = getTransformer(route, req.method);
    if (transformer) {
      data = transformer(data, context);
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

const jwt = require("jsonwebtoken");
const msal = require("@azure/msal-node");

// Configuración MSAL para Client Credentials
const msalConfig = {
  auth: {
    clientId: process.env.API_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.API_CLIENT_SECRET,
  },
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

/**
 * Obtiene Access Token con Client Credentials para llamar a APIM
 */
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

/**
 * Valida el token JWT del usuario
 * @param {string} token - Token de usuario (X-User-Token)
 * @returns {Object|null} - Datos del token decodificado o null si es inválido
 */
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

/**
 * Transforma la respuesta de APIM al formato esperado por el middleware
 */
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

  const userObject = {
    userId: apiData.userId,
    email: apiData.email,
    displayName: apiData.displayName,
    roleId: apiData.role?.roleId,
    status: apiData.status,
    lastAccessAt: apiData.lastAccessAt,
    createdAt: apiData.userCreatedAt,
  };

  return {
    user: userObject,
    role: apiData.role,
    permissions: permissions,
    status: userObject.status || "inactive",
  };
}

/**
 * Obtiene los permisos del usuario desde APIM
 * @param {string} email - Email del usuario
 * @returns {Object|null} - { user, role, permissions, status }
 */
async function getUserPermissionsFromAPI(email) {
  try {
    const accessToken = await getAccessToken();
    const apiUrl = `${process.env.API_BASE_URL}/api/auth/user-profile?email=${encodeURIComponent(email)}`;

    console.log("🔍 [DEBUG] Calling APIM user-profile for:", email);
    console.log("🔍 [DEBUG] APIM URL:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": process.env.APIM_SUBSCRIPTION_KEY || "",
      },
    });

    console.log("🔍 [DEBUG] APIM Response Status:", response.status);

    if (!response.ok) {
      console.log("❌ [DEBUG] APIM Response NOT OK");
      return null;
    }

    const apiData = await response.json();
    console.log("🔍 [DEBUG] APIM Raw Response:", JSON.stringify(apiData, null, 2));

    // Transformar la respuesta de APIM
    const result = transformUserProfileResponse(apiData);

    console.log("🔍 [DEBUG] User Status from APIM:", result.user?.status);
    console.log("🔍 [DEBUG] User Object:", JSON.stringify(result.user, null, 2));
    console.log("🔍 [DEBUG] Transformed Result:", JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error("❌ [DEBUG] Error fetching user permissions:", error);
    return null;
  }
}

/**
 * Mapea una ruta a un módulo/tab code
 * @param {string} route - Ruta solicitada (ej: "academic-period", "auth/users")
 * @returns {string} - Código del módulo ("integrations" o "users-roles")
 */
function getTabFromRoute(route) {
  const cleanRoute = route.toLowerCase();

  // Rutas de gestión de usuarios y roles
  if (cleanRoute.includes("auth/")) {
    return "users-roles";
  }

  // Todas las demás rutas requieren permiso de 'integrations'
  return "integrations";
}

/**
 * Middleware de autorización que valida permisos usando endpoints de APIM
 * @param {string} token - Token de usuario (X-User-Token)
 * @param {string} route - Ruta solicitada
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE, PATCH)
 * @returns {Object} - { authorized: boolean, user: Object, error: Object }
 */
async function authorizeRequest(token, route, method) {
  console.log("🔐 [DEBUG] === AUTHORIZE REQUEST START ===");
  console.log("🔐 [DEBUG] Route:", route);
  console.log("🔐 [DEBUG] Method:", method);

  // 1. Validar token
  const tokenData = await validateUserToken(token);

  if (!tokenData) {
    console.log("❌ [DEBUG] Token validation failed");
    return {
      authorized: false,
      error: {
        status: 401,
        message: "Token inválido o expirado",
      },
    };
  }

  const userEmail = tokenData.email;
  console.log("✅ [DEBUG] Token validated for:", userEmail);

  // 2. Obtener permisos del usuario desde APIM
  const userPermissions = await getUserPermissionsFromAPI(userEmail);

  if (!userPermissions) {
    console.log("❌ [DEBUG] No permissions found for user");
    return {
      authorized: false,
      error: {
        status: 403,
        message: "Usuario no autorizado en el sistema. Contacta al administrador.",
        details: { userEmail },
      },
    };
  }

  console.log("✅ [DEBUG] Permissions retrieved:", JSON.stringify(userPermissions, null, 2));

  // 3. Verificar estado del usuario
  console.log("🔍 [DEBUG] Checking user status:", userPermissions.status);
  if (userPermissions.status !== "active") {
    console.log("❌ [DEBUG] User status is NOT active:", userPermissions.status);
    return {
      authorized: false,
      error: {
        status: 403,
        message:
          userPermissions.status === "inactive"
            ? "Tu cuenta está desactivada. Contacta al administrador."
            : "Tu cuenta está suspendida. Contacta al administrador.",
        details: { userEmail, status: userPermissions.status },
      },
    };
  }

  console.log("✅ [DEBUG] User status is active");

  // 4. Mapear ruta a tab code
  const tabCode = getTabFromRoute(route);
  console.log("🔍 [DEBUG] Tab code for route:", tabCode);

  if (!tabCode) {
    console.log("✅ [DEBUG] No tab code required - authorized");
    return {
      authorized: true,
      user: userPermissions,
    };
  }

  // 5. Verificar acceso al tab
  const permission = userPermissions.permissions?.[tabCode];
  console.log("🔍 [DEBUG] Permission for tab", tabCode, ":", permission);
  const hasAccess = permission === "READ" || permission === "WRITE";

  if (!hasAccess) {
    console.log("❌ [DEBUG] No access to tab:", tabCode);
    return {
      authorized: false,
      error: {
        status: 403,
        message: `No tienes permisos para acceder a: ${tabCode}`,
        details: { tabCode, userEmail },
      },
    };
  }

  console.log("✅ [DEBUG] User has access to tab:", tabCode);

  // 6. Verificar permisos de escritura para operaciones que modifican datos
  const writeMethods = ["POST", "PUT", "DELETE", "PATCH"];

  if (writeMethods.includes(method.toUpperCase()) && tabCode === "users-roles") {
    const canWrite = permission === "WRITE";
    console.log("🔍 [DEBUG] Checking write permission for users-roles:", canWrite);

    if (!canWrite) {
      console.log("❌ [DEBUG] No write permission for users-roles");
      return {
        authorized: false,
        error: {
          status: 403,
          message: `No tienes permisos de escritura en: ${tabCode}`,
          details: { tabCode, userEmail, permission: "READ_ONLY" },
        },
      };
    }
  }

  // 7. Autorizado
  console.log("✅ [DEBUG] === AUTHORIZATION SUCCESSFUL ===");
  return {
    authorized: true,
    user: userPermissions,
  };
}

module.exports = {
  authorizeRequest,
  validateUserToken,
};

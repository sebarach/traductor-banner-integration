const mockAuthData = require("../data/mockAuthData");
const jwt = require("jsonwebtoken");

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
 * Middleware de autorización simplificado para validar permisos por TAB
 * @param {string} token - Token de usuario (X-User-Token)
 * @param {string} route - Ruta solicitada (ej: "banner-integrations", "users-roles")
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE, PATCH)
 * @returns {Object} - { authorized: boolean, user: Object, error: Object }
 */
async function authorizeRequest(token, route, method) {
  // 1. Validar token
  const tokenData = await validateUserToken(token);

  if (!tokenData) {
    return {
      authorized: false,
      error: {
        status: 401,
        message: "Token inválido o expirado",
      },
    };
  }

  const userEmail = tokenData.email;

  // 2. Obtener permisos del usuario
  const userPermissions = mockAuthData.getUserPermissions(userEmail);

  if (!userPermissions) {
    return {
      authorized: false,
      error: {
        status: 403,
        message: "Usuario no autorizado en el sistema. Contacta al administrador.",
        details: { userEmail },
      },
    };
  }

  // 3. Verificar estado del usuario
  if (userPermissions.status !== "active") {
    return {
      authorized: false,
      error: {
        status: 403,
        message: userPermissions.status === "inactive"
          ? "Tu cuenta está desactivada. Contacta al administrador."
          : "Tu cuenta está suspendida. Contacta al administrador.",
        details: { userEmail, status: userPermissions.status },
      },
    };
  }

  // 4. Mapear ruta a tab (solo 'integrations' requiere validación de acceso)
  // Las rutas de Banner API requieren permiso de lectura en 'integrations'
  const tabCode = mockAuthData.getTabFromRoute(route);

  if (!tabCode) {
    // Si no es una ruta protegida, permitir
    return {
      authorized: true,
      user: userPermissions,
    };
  }

  // 5. Verificar acceso al tab
  const hasAccess = mockAuthData.hasTabAccess(userPermissions, tabCode);

  if (!hasAccess) {
    return {
      authorized: false,
      error: {
        status: 403,
        message: `No tienes permisos para acceder a: ${tabCode}`,
        details: { tabCode, userEmail },
      },
    };
  }

  // 6. Verificar permisos de escritura para operaciones que modifican datos
  // Solo aplica para el tab 'users-roles'
  const writeMethods = ["POST", "PUT", "DELETE", "PATCH"];

  if (writeMethods.includes(method.toUpperCase()) && tabCode === 'users-roles') {
    const canWriteTab = mockAuthData.canWrite(userPermissions, tabCode);

    if (!canWriteTab) {
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
  return {
    authorized: true,
    user: userPermissions,
  };
}

module.exports = {
  authorizeRequest,
  validateUserToken,
};

const mockAuthData = require("../data/mockAuthData");
const jwt = require("jsonwebtoken");

// Validar token de usuario (reutilizar lógica de banner/index.js)
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

module.exports = async function (context, req) {
  const route = context.bindingData.route || "";

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Token",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    context.res = { status: 204, headers };
    return;
  }

  try {
    // Validar token
    const userToken = req.headers["x-user-token"];
    const tokenData = await validateUserToken(userToken);

    if (!tokenData) {
      context.res = {
        status: 401,
        headers,
        body: { error: "Unauthorized", message: "Token inválido o expirado" },
      };
      return;
    }

    const userEmail = tokenData.email;

    // Rutas públicas (después de autenticación)
    if (route === "user" || route.startsWith("user/")) {
      // GET /api/auth/user/:email - Obtener info del usuario y permisos
      const emailParam = route.replace("user/", "") || userEmail;

      context.log("🔍 DEBUG - Route:", route);
      context.log("🔍 DEBUG - Email from token:", userEmail);
      context.log("🔍 DEBUG - Email param:", emailParam);
      context.log("🔍 DEBUG - Todos los usuarios:", mockAuthData.users.map(u => u.email));

      const userPermissions = mockAuthData.getUserPermissions(emailParam);

      context.log("🔍 DEBUG - Permisos encontrados:", userPermissions);

      if (!userPermissions) {
        context.log("❌ Usuario no encontrado en mock data");
        context.res = {
          status: 404,
          headers,
          body: {
            error: "UserNotFound",
            message: "Usuario no autorizado en el sistema",
            userEmail: emailParam
          },
        };
        return;
      }

      // Actualizar último acceso
      const user = mockAuthData.users.find(u => u.email.toLowerCase() === emailParam.toLowerCase());
      if (user) {
        user.lastAccessAt = new Date().toISOString();
      }

      context.res = {
        status: 200,
        headers,
        body: {
          user: {
            userId: userPermissions.user.userId,
            email: userPermissions.user.email,
            displayName: userPermissions.user.displayName,
            status: userPermissions.user.status,
            lastAccessAt: userPermissions.user.lastAccessAt,
          },
          role: userPermissions.role,
          permissions: userPermissions.permissions,
        },
      };
      return;
    }

    // Para el resto de rutas, verificar que el usuario sea administrador
    const userPermissions = mockAuthData.getUserPermissions(userEmail);

    if (!userPermissions || userPermissions.user.roleId !== 1) {
      context.res = {
        status: 403,
        headers,
        body: {
          error: "Forbidden",
          message: "Solo administradores pueden acceder a esta función"
        },
      };
      return;
    }

    // Rutas administrativas
    if (route === "users" && req.method === "GET") {
      // GET /api/auth/users - Listar todos los usuarios
      const usersWithRoles = mockAuthData.users.map(user => {
        const role = mockAuthData.roles.find(r => r.roleId === user.roleId);
        return { ...user, role };
      });

      context.res = {
        status: 200,
        headers,
        body: usersWithRoles,
      };
      return;
    }

    if (route === "users" && req.method === "POST") {
      // POST /api/auth/users - Crear nuevo usuario
      const { email, displayName, roleId, status } = req.body;

      if (!email || !displayName || !roleId) {
        context.res = {
          status: 400,
          headers,
          body: {
            error: "BadRequest",
            message: "Faltan campos requeridos: email, displayName, roleId"
          },
        };
        return;
      }

      // Verificar si el email ya existe
      const existingUser = mockAuthData.users.find(
        u => u.email.toLowerCase() === email.toLowerCase()
      );

      if (existingUser) {
        context.res = {
          status: 409,
          headers,
          body: {
            error: "Conflict",
            message: "Ya existe un usuario con este email"
          },
        };
        return;
      }

      // Crear nuevo usuario
      const newUser = {
        userId: mockAuthData.users.length + 1,
        email,
        displayName,
        roleId: parseInt(roleId),
        status: status || "active",
        lastAccessAt: null,
        createdAt: new Date().toISOString(),
        createdBy: userEmail,
        photoUrl: null,
        tenantId: null,
      };

      mockAuthData.users.push(newUser);

      context.res = {
        status: 201,
        headers,
        body: newUser,
      };
      return;
    }

    if (route.startsWith("users/") && req.method === "PUT") {
      // PUT /api/auth/users/:email - Actualizar usuario
      const targetEmail = decodeURIComponent(route.replace("users/", ""));
      const { roleId, status } = req.body;

      const userIndex = mockAuthData.users.findIndex(
        u => u.email.toLowerCase() === targetEmail.toLowerCase()
      );

      if (userIndex === -1) {
        context.res = {
          status: 404,
          headers,
          body: { error: "NotFound", message: "Usuario no encontrado" },
        };
        return;
      }

      // Actualizar usuario
      if (roleId !== undefined) {
        mockAuthData.users[userIndex].roleId = parseInt(roleId);
      }
      if (status !== undefined) {
        mockAuthData.users[userIndex].status = status;
      }
      mockAuthData.users[userIndex].updatedAt = new Date().toISOString();
      mockAuthData.users[userIndex].updatedBy = userEmail;

      context.res = {
        status: 200,
        headers,
        body: mockAuthData.users[userIndex],
      };
      return;
    }

    if (route === "roles" && req.method === "GET") {
      // GET /api/auth/roles - Listar roles con cantidad de permisos
      const rolesWithStats = mockAuthData.roles.map(role => {
        const permissions = mockAuthData.rolePermissions.filter(rp => rp.roleId === role.roleId);
        const userCount = mockAuthData.users.filter(u => u.roleId === role.roleId).length;

        return {
          ...role,
          permissionCount: permissions.length,
          userCount,
          permissions: permissions.map(rp => {
            const module = mockAuthData.modules.find(m => m.moduleId === rp.moduleId);
            return {
              moduleCode: module?.moduleCode,
              moduleName: module?.moduleName,
              permissionType: rp.permissionType,
            };
          }),
        };
      });

      context.res = {
        status: 200,
        headers,
        body: rolesWithStats,
      };
      return;
    }

    if (route === "roles" && req.method === "POST") {
      // POST /api/auth/roles - Crear nuevo rol
      const { roleName, roleDescription, permissions } = req.body;

      if (!roleName || !permissions || !Array.isArray(permissions)) {
        context.res = {
          status: 400,
          headers,
          body: {
            error: "BadRequest",
            message: "Faltan campos: roleName, permissions[]"
          },
        };
        return;
      }

      const newRoleId = Math.max(...mockAuthData.roles.map(r => r.roleId)) + 1;

      const newRole = {
        roleId: newRoleId,
        roleName,
        roleDescription: roleDescription || null,
        isSystemRole: false,
        createdAt: new Date().toISOString(),
        createdBy: userEmail,
      };

      mockAuthData.roles.push(newRole);

      // Agregar permisos
      permissions.forEach((perm, index) => {
        const module = mockAuthData.modules.find(m => m.moduleCode === perm.moduleCode);
        if (module) {
          const newPermId = Math.max(...mockAuthData.rolePermissions.map(rp => rp.permissionId)) + index + 1;
          mockAuthData.rolePermissions.push({
            permissionId: newPermId,
            roleId: newRoleId,
            moduleId: module.moduleId,
            permissionType: perm.permissionType,
          });
        }
      });

      context.res = {
        status: 201,
        headers,
        body: newRole,
      };
      return;
    }

    if (route.startsWith("roles/") && req.method === "PUT") {
      // PUT /api/auth/roles/:id - Actualizar rol
      const roleId = parseInt(route.replace("roles/", ""));
      const { roleName, roleDescription, permissions } = req.body;

      const roleIndex = mockAuthData.roles.findIndex(r => r.roleId === roleId);

      if (roleIndex === -1) {
        context.res = {
          status: 404,
          headers,
          body: { error: "NotFound", message: "Rol no encontrado" },
        };
        return;
      }

      // No permitir editar roles del sistema
      if (mockAuthData.roles[roleIndex].isSystemRole) {
        context.res = {
          status: 403,
          headers,
          body: {
            error: "Forbidden",
            message: "No se pueden modificar roles del sistema"
          },
        };
        return;
      }

      // Actualizar rol
      if (roleName) mockAuthData.roles[roleIndex].roleName = roleName;
      if (roleDescription !== undefined) mockAuthData.roles[roleIndex].roleDescription = roleDescription;
      mockAuthData.roles[roleIndex].updatedAt = new Date().toISOString();
      mockAuthData.roles[roleIndex].updatedBy = userEmail;

      // Actualizar permisos si se proporcionan
      if (permissions && Array.isArray(permissions)) {
        // Eliminar permisos existentes
        mockAuthData.rolePermissions = mockAuthData.rolePermissions.filter(rp => rp.roleId !== roleId);

        // Agregar nuevos permisos
        permissions.forEach((perm, index) => {
          const module = mockAuthData.modules.find(m => m.moduleCode === perm.moduleCode);
          if (module) {
            const newPermId = Math.max(...mockAuthData.rolePermissions.map(rp => rp.permissionId)) + index + 1;
            mockAuthData.rolePermissions.push({
              permissionId: newPermId,
              roleId: roleId,
              moduleId: module.moduleId,
              permissionType: perm.permissionType,
            });
          }
        });
      }

      context.res = {
        status: 200,
        headers,
        body: mockAuthData.roles[roleIndex],
      };
      return;
    }

    if (route === "modules" && req.method === "GET") {
      // GET /api/auth/modules - Listar módulos disponibles
      context.res = {
        status: 200,
        headers,
        body: mockAuthData.modules,
      };
      return;
    }

    // Ruta no encontrada
    context.res = {
      status: 404,
      headers,
      body: { error: "NotFound", message: `Ruta no encontrada: ${route}` },
    };

  } catch (error) {
    context.log.error("Error in auth function:", error);
    context.res = {
      status: 500,
      headers,
      body: {
        error: "InternalServerError",
        message: error.message,
      },
    };
  }
};

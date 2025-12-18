// Mock data para el sistema de autorización
// Modelo simplificado: Solo 2 permisos por TABS (no por módulos)

// ============================================
// TABS DEL SISTEMA
// ============================================
const tabs = [
  {
    tabId: 1,
    tabCode: "integrations",
    tabName: "Integraciones Banner",
    iconName: "Link",
    routePattern: "/dashboard/banner-integrations",
    displayOrder: 1,
    isActive: true,
  },
  {
    tabId: 2,
    tabCode: "users-roles",
    tabName: "Usuarios y Roles",
    iconName: "Shield",
    routePattern: "/dashboard/users-roles",
    displayOrder: 2,
    isActive: true,
  },
];

// ============================================
// MODULOS (equivalentes a tabs mientras dure el mock)
// ============================================
const modules = [
  {
    moduleId: 1,
    moduleCode: "integrations",
    moduleName: "Integraciones Banner",
    moduleDescription: "Mantenimiento de conectores Banner",
    iconName: "Link",
    routePattern: "/dashboard/banner-integrations",
    displayOrder: 1,
    isActive: true,
  },
  {
    moduleId: 2,
    moduleCode: "users-roles",
    moduleName: "Usuarios y Roles",
    moduleDescription: "Administración de usuarios y roles internos",
    iconName: "Shield",
    routePattern: "/dashboard/users-roles",
    displayOrder: 2,
    isActive: true,
  },
];

// ============================================
// ROLES
// ============================================
const roles = [
  {
    roleId: 1,
    roleName: "Administrador",
    roleDescription: "Acceso completo: lectura en integraciones y escritura en usuarios/roles",
    isSystemRole: true,
    createdAt: "2024-01-15T08:00:00Z",
    createdBy: "SYSTEM",
  },
  {
    roleId: 2,
    roleName: "Usuario de Consulta",
    roleDescription: "Solo lectura en integraciones Banner",
    isSystemRole: false,
    createdAt: "2024-01-15T08:00:00Z",
    createdBy: "SYSTEM",
  },
  {
    roleId: 3,
    roleName: "Sin Acceso",
    roleDescription: "Usuario sin permisos de acceso",
    isSystemRole: false,
    createdAt: "2024-01-15T08:00:00Z",
    createdBy: "SYSTEM",
  },
];

// ============================================
// PERMISOS POR ROL
// ============================================
const rolePermissions = [
  // Administrador - READ en integraciones + WRITE en users-roles
  { permissionId: 1, roleId: 1, tabId: 1, moduleId: 1, permissionType: "READ" },
  { permissionId: 2, roleId: 1, tabId: 2, moduleId: 2, permissionType: "WRITE" },

  // Usuario de Consulta - Solo READ en integraciones
  { permissionId: 3, roleId: 2, tabId: 1, moduleId: 1, permissionType: "READ" },

  // Sin Acceso - Sin permisos
];

// ============================================
// USUARIOS
// ============================================
const users = [
  {
    userId: 1,
    email: "s.sepulveda@uai.cl",
    displayName: "Sebastian Andres Sepulveda Campos",
    roleId: 1, // Administrador
    status: "active",
    lastAccessAt: "2025-01-15T10:30:00Z",
    createdAt: "2024-01-15T08:00:00Z",
    createdBy: "SYSTEM",
  },
  {
    userId: 2,
    email: "maria.gonzalez@uai.cl",
    displayName: "María González Pérez",
    roleId: 2, // Usuario de Consulta
    status: "active",
    lastAccessAt: "2025-01-14T15:20:00Z",
    createdAt: "2024-02-01T09:00:00Z",
    createdBy: "s.sepulveda@uai.cl",
  },
  {
    userId: 3,
    email: "juan.perez@uai.cl",
    displayName: "Juan Pérez Silva",
    roleId: 3, // Sin Acceso
    status: "active",
    lastAccessAt: "2025-01-15T09:15:00Z",
    createdAt: "2024-02-01T09:00:00Z",
    createdBy: "s.sepulveda@uai.cl",
  },
  {
    userId: 4,
    email: "ana.martinez@uai.cl",
    displayName: "Ana Martínez López",
    roleId: 2, // Usuario de Consulta
    status: "inactive",
    lastAccessAt: "2024-12-01T08:00:00Z",
    createdAt: "2024-03-01T10:00:00Z",
    createdBy: "s.sepulveda@uai.cl",
  },
];

// ============================================
// HELPERS
// ============================================

/**
 * Obtiene los permisos de un usuario por email
 * @param {string} email
 * @returns {Object|null} { user, role, permissions: { integrations: 'READ'|'WRITE', 'users-roles': 'WRITE' } }
 */
function getUserPermissions(email) {
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;

  if (user.status !== 'active') {
    return { user, permissions: {}, status: user.status };
  }

  const userRole = roles.find(r => r.roleId === user.roleId);
  const userRolePermissions = rolePermissions.filter(rp => rp.roleId === user.roleId);

  const permissions = {};
  userRolePermissions.forEach(rp => {
    const tab = tabs.find(t => t.tabId === rp.tabId);
    if (tab && tab.isActive) {
      permissions[tab.tabCode] = rp.permissionType;
    }
  });

  return {
    user,
    role: userRole,
    permissions,
    status: 'active'
  };
}

/**
 * Verifica si el usuario tiene acceso a un tab
 * @param {Object} userPermissions
 * @param {string} tabCode - 'integrations' o 'users-roles'
 * @returns {boolean}
 */
function hasTabAccess(userPermissions, tabCode) {
  return userPermissions && userPermissions.permissions &&
         (userPermissions.permissions[tabCode] === 'READ' ||
          userPermissions.permissions[tabCode] === 'WRITE');
}

/**
 * Verifica si el usuario puede escribir en un tab
 * @param {Object} userPermissions
 * @param {string} tabCode
 * @returns {boolean}
 */
function canWrite(userPermissions, tabCode) {
  return userPermissions && userPermissions.permissions &&
         userPermissions.permissions[tabCode] === 'WRITE';
}

/**
 * Mapea una ruta a un tab code
 * @param {string} route - Ej: "academic-period", "building/123", "auth/users", etc.
 * @returns {string|null} - 'integrations' o 'users-roles'
 */
function getTabFromRoute(route) {
  const cleanRoute = route.toLowerCase();

  // Rutas de gestión de usuarios y roles
  if (cleanRoute.includes('auth/')) {
    return 'users-roles';
  }

  // TODAS las demás rutas de la API Banner requieren permiso de 'integrations'
  // Esto incluye: academic-period, academic-level, program-rule, building, person, instructor
  return 'integrations';
}

/**
 * Verifica si el usuario es administrador
 * @param {Object} userPermissions
 * @returns {boolean}
 */
function isAdmin(userPermissions) {
  return userPermissions && userPermissions.user && userPermissions.user.roleId === 1;
}

module.exports = {
  tabs,
  modules,
  roles,
  rolePermissions,
  users,
  getUserPermissions,
  hasTabAccess,
  canWrite,
  getTabFromRoute,
  isAdmin,
};

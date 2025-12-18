// Tipos para el sistema de autorización

export type PermissionType = 'READ' | 'WRITE';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface Module {
  moduleId: number;
  moduleCode: string;
  moduleName: string;
  moduleDescription: string;
  iconName: string;
  routePattern: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Role {
  roleId: number;
  roleName: string;
  roleDescription: string | null;
  isSystemRole: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface RoleWithStats extends Role {
  permissionCount: number;
  userCount: number;
  permissions: {
    moduleCode: string;
    moduleName: string;
    permissionType: PermissionType;
  }[];
}

export interface User {
  userId: number;
  email: string;
  displayName: string;
  roleId: number;
  status: UserStatus;
  lastAccessAt: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  photoUrl?: string | null;
  tenantId?: string | null;
}

export interface UserWithRole extends User {
  role: Role;
}

export interface UserPermissions {
  user: User;
  role: Role;
  permissions: Record<string, PermissionType>; // { "academic-periods": "WRITE", ... }
}

export interface CreateUserRequest {
  email: string;
  displayName: string;
  roleId: number;
  status?: UserStatus;
}

export interface UpdateUserRequest {
  roleId?: number;
  status?: UserStatus;
}

export interface CreateRoleRequest {
  roleName: string;
  roleDescription?: string;
  permissions: {
    moduleCode: string;
    permissionType: PermissionType;
  }[];
}

export interface UpdateRoleRequest {
  roleName?: string;
  roleDescription?: string;
  permissions?: {
    moduleCode: string;
    permissionType: PermissionType;
  }[];
}

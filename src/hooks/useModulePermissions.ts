import { useAuthorization } from "../context/AuthorizationContext";

export function useModulePermissions(moduleCode: string) {
  const { hasModuleAccess, canWrite, canRead, isLoading } = useAuthorization();

  return {
    hasAccess: hasModuleAccess(moduleCode),
    canWrite: canWrite(moduleCode),
    canRead: canRead(moduleCode),
    isReadOnly: canRead(moduleCode) && !canWrite(moduleCode),
    isLoading,
  };
}

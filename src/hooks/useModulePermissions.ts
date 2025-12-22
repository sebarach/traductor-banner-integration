import { useAuthorization } from "../context/AuthorizationContext";

export function useModulePermissions() {
  const { isLoading } = useAuthorization();

  return {
    // hasAccess: hasModuleAccess(moduleCode),
    // canWrite: canWrite(moduleCode),
    // canRead: canRead(moduleCode),
    isLoading,
  };
}

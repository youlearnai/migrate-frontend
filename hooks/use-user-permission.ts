import { AccessControl } from "@/lib/types";
import useAuth from "./use-auth";

const useUserPermission = (accessControl: AccessControl[]) => {
  const { user, loading } = useAuth();

  if (loading) return { userPermission: null, loading };

  const userPermission = accessControl?.find(
    (control) => control.user.id === user?.uid,
  ) || {
    role: "viewer",
  };

  return { userPermission, loading };
};

export default useUserPermission;

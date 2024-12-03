import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export const useSetPrimaryColor = () => {
  const { user } = useAuth();
  const role = user?.role || "guest";

  useEffect(() => {
    const roleColors: Record<string, string> = {
      guest: "#A03048",
      "regular user": "#A03048",
      vet: "#480777",
      admin: "#065758",
    };

    document.documentElement.style.setProperty(
      "--primary-color",
      roleColors[role]
    );
  }, [role]);
};

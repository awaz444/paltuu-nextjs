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
      "shelter admin": "#1d6b34",
      "shop admin": "#b86b00",
      "ecommerce admin": "#004a99",
    };

    // fallback to guest color if role not in map
    const color = roleColors[role] || roleColors["guest"];

    document.documentElement.style.setProperty("--primary-color", color);
  }, [role]);
};

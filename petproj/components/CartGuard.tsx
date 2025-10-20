
import { ReactNode } from "react";
import { useCartProtection } from "@/hooks/useCartProtection";


interface CartGuardProps {
  children: ReactNode;
}

export const CartGuard = ({ children }: CartGuardProps) => {
  const { isChecking, hasItems } = useCartProtection({ showMessage: true });

  if (isChecking) {
    // Optional: show spinner or blank screen
    return (
      <div className="w-full h-screen flex items-center justify-center">
        Checking cart...
      </div>
    );
  }

  if (!hasItems) {
    // Redirect is already happening in hook
    return null;
  }

  return <>{children}</>;
};
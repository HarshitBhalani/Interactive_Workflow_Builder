"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth.context";
import { logoutUser } from "@/features/auth/services/auth.service";

export function LogoutButton() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    setIsLoading(true);

    const result = await logoutUser();
    if (result.success) {
      router.replace("/login");
      return;
    }

    setIsLoading(false);
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-gray-700">
        Welcome, <strong>{user.displayName || user.email}</strong>
      </span>
      <Button
        className="rounded-xl"
        disabled={isLoading}
        onClick={handleLogout}
        type="button"
        variant="outline"
      >
        <LogOut className="h-4 w-4" />
        {isLoading ? "Logging out..." : "Logout"}
      </Button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth.context";
import { logoutUser } from "@/features/auth/services/auth.service";

type LogoutButtonProps = {
  onBeforeLogout?: () => boolean;
};

export function LogoutButton({ onBeforeLogout }: LogoutButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    if (onBeforeLogout && !onBeforeLogout()) {
      return;
    }

    setIsLoading(true);

    const result = await logoutUser();
    if (result.success) {
      router.replace("/login");
      return;
    }

    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-end gap-4">
      <span className="max-w-[18rem] truncate whitespace-nowrap text-right text-gray-700">
        Welcome, <strong>{user.displayName || user.email}</strong>
      </span>
      <Button
        className="rounded-xl border-rose-200/80 text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProtectedProps {
  roles?: string[];
  children: React.ReactNode;
}

/**
 * Protected component for route protection
 * Based on the excellent pattern from next-ams
 */
export default function Protected({ roles = [], children }: ProtectedProps) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/verify");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!data.admin) {
          router.push("/login");
          return;
        }
        if (roles.length > 0 && !roles.includes(data.admin.role as string)) {
          setAuthorized(false);
        } else {
          setAuthorized(true);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [roles, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-lg">Loading...</p>
      </div>
    );
  }
  
  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">You are not authorized to view this page.</p>
          <button 
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

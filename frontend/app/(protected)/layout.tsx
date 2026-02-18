"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = window.localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = () => {
    window.localStorage.removeItem("authToken");
    window.localStorage.removeItem("authUser");
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
        <h1 className="text-lg font-semibold">Student Tracking Dashboard</h1>
        <button
          onClick={handleLogout}
          className="rounded bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
        >
          Logout
        </button>
      </header>
      <main>{children}</main>
    </div>
  );
}


"use client";

import useSWR from "swr";
import axios from "axios";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

const fetcher = async (url: string) => {
  const token = window.localStorage.getItem("authToken");
  const res = await axios.get(url, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });
  return res.data;
};

export default function DashboardPage() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR(`${API}/dashboard/summary`, fetcher);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error) return <p className="text-red-600 p-4">Failed to load dashboard.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Students</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{data.totalStudents}</p>
          <p className="mt-1 text-xs text-slate-400">
            {data.activeStudents} active &bull; {data.inactiveStudents} inactive
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Schools</p>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{data.totalSchools}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Families</p>
          <p className="mt-2 text-3xl font-bold text-violet-600">{data.totalFamilies}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">GSF Contribution</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            ₹{data.financials.totalGSFContribution.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Parent: ₹{data.financials.totalParentContribution.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <button
          onClick={() => router.push("/students")}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 transition-colors"
        >
          View All Students
        </button>
      </div>

      {/* Economic Breakdown + Top Schools */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Economic Category */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Economic Categories</h2>
          <div className="space-y-3">
            {data.economicBreakdown.map((item: any) => {
              const pct = data.totalFamilies > 0 ? (item.count / data.totalFamilies) * 100 : 0;
              const colors: Record<string, string> = {
                SWB: "bg-red-500",
                EWS: "bg-orange-500",
                LIG: "bg-amber-500",
                LMIG: "bg-blue-500",
              };
              return (
                <div
                  key={item.category}
                  onClick={() => router.push(`/students?economicCategory=${item.category}`)}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                >
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{item.category}</span>
                    <span className="text-slate-500">{item.count} families ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${colors[item.category] || "bg-slate-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Schools */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Schools by Enrollment</h2>
          <div className="space-y-2">
            {data.topSchools.map((school: any) => (
              <div
                key={school.id}
                onClick={() => router.push(`/students?schoolName=${encodeURIComponent(school.name)}`)}
                className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">{school.name}</p>
                  <p className="text-xs text-slate-400">{school.curriculum}</p>
                </div>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  {school.enrollmentCount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Centres */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Centres</h2>
        <div className="grid gap-2 md:grid-cols-4">
          {data.centreBreakdown.map((centre: any) => (
            <div key={centre.id} className="rounded-lg border border-slate-200 p-3 text-center">
              <p className="text-sm font-medium text-slate-700">{centre.name}</p>
              <p className="text-xs text-slate-400">{centre.leb}</p>
              <p className="mt-1 text-lg font-bold text-violet-600">{centre.familyCount}</p>
              <p className="text-xs text-slate-400">families</p>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Financial Summary (2022-23)</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-xs text-slate-400">Total Education Cost</p>
            <p className="mt-1 text-xl font-bold text-slate-800">
              ₹{data.financials.totalCost.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4 text-center">
            <p className="text-xs text-slate-400">Parent Contribution</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">
              ₹{data.financials.totalParentContribution.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-lg bg-indigo-50 p-4 text-center">
            <p className="text-xs text-slate-400">GSF Contribution</p>
            <p className="mt-1 text-xl font-bold text-indigo-700">
              ₹{data.financials.totalGSFContribution.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

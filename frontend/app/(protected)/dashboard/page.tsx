"use client";

import useSWR from "swr";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

const fetcher = async (url: string) => {
  const token = window.localStorage.getItem("authToken");
  const res = await axios.get(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  return res.data;
};

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR(`${API_BASE}/dashboard/summary`, fetcher);

  if (isLoading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p className="text-red-600">Failed to load dashboard.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Students</p>
          <p className="mt-2 text-2xl font-semibold">{data.totalStudents}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Active</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{data.activeStudents}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Inactive</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600">{data.inactiveStudents}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Avg Attendance %</p>
          <p className="mt-2 text-2xl font-semibold text-indigo-600">
            {data.overallAttendancePercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Students below 50% attendance</h2>
        {data.studentsBelow50.length === 0 ? (
          <p className="text-sm text-slate-500">No students below 50% attendance.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Grade</th>
                  <th className="px-3 py-2">School</th>
                  <th className="px-3 py-2">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {data.studentsBelow50.map((item: any) => (
                  <tr key={item.student.id} className="border-b last:border-0">
                    <td className="px-3 py-2">{item.student.fullName}</td>
                    <td className="px-3 py-2">{item.student.grade}</td>
                    <td className="px-3 py-2">{item.student.schoolName}</td>
                    <td className="px-3 py-2 text-red-600">
                      {item.attendancePercentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
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

export default function StudentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, error, isLoading } = useSWR(
    `${API_BASE}/students?page=${page}&pageSize=10&search=${encodeURIComponent(search)}`,
    fetcher,
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  if (isLoading) {
    return <p>Loading students...</p>;
  }

  if (error) {
    return <p className="text-red-600">Failed to load students.</p>;
  }

  const { items, totalPages } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Students</h2>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Search by name, school, guardian..."
          className="w-full rounded border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="submit"
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Search
        </button>
      </form>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Grade</th>
                <th className="px-3 py-2">School</th>
                <th className="px-3 py-2">Guardian</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((student: any) => (
                <tr key={student.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{student.fullName}</td>
                  <td className="px-3 py-2">{student.grade}</td>
                  <td className="px-3 py-2">{student.schoolName}</td>
                  <td className="px-3 py-2">{student.guardianName}</td>
                  <td className="px-3 py-2">{student.contactNumber}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        student.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
          <div>
            Page {data.page} of {data.totalPages}
          </div>
          <div className="space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border px-2 py-1 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border px-2 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


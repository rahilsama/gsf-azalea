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

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const { data, error, isLoading, mutate } = useSWR(
    `${API_BASE}/students?page=1&pageSize=100`,
    fetcher,
  );

  const handleToggle = async (studentId: string, present: boolean) => {
    const token = window.localStorage.getItem("authToken");
    await axios.post(
      `${API_BASE}/attendance`,
      {
        studentId,
        date: selectedDate,
        present,
      },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      },
    );
    mutate();
  };

  if (isLoading) {
    return <p>Loading attendance...</p>;
  }

  if (error) {
    return <p className="text-red-600">Failed to load attendance.</p>;
  }

  const students = data.items;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mark Attendance</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded border px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Grade</th>
                <th className="px-3 py-2">Present</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student: any) => (
                <tr key={student.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{student.fullName}</td>
                  <td className="px-3 py-2">{student.grade}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleToggle(student.id, true)}
                      className="mr-2 rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleToggle(student.id, false)}
                      className="rounded bg-slate-200 px-3 py-1 text-xs font-medium text-slate-800 hover:bg-slate-300"
                    >
                      Absent
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


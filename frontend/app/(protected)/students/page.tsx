"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

const getToken = () =>
  typeof window !== "undefined"
    ? window.localStorage.getItem("authToken")
    : null;

const fetcher = async (url: string) => {
  const token = getToken();
  const res = await axios.get(url, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });
  return res.data;
};

/* ──────────────── types ──────────────── */
interface School {
  id: string;
  name: string;
  curriculum: string;
  location: string;
}

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  grade: string;
  status: string;
  school: School;
  parents: Parent[];
}

/* ──────────────── form state shape ──────────────── */
interface StudentForm {
  firstName: string;
  lastName: string;
  fatherName: string;
  grade: string;
  status: string;
  schoolName: string;
  schoolCurriculum: string;
  schoolLocation: string;
  parentFirstName: string;
  parentLastName: string;
  parentPhone: string;
}

const emptyForm: StudentForm = {
  firstName: "",
  lastName: "",
  fatherName: "",
  grade: "",
  status: "active",
  schoolName: "",
  schoolCurriculum: "",
  schoolLocation: "",
  parentFirstName: "",
  parentLastName: "",
  parentPhone: "",
};

/* ──────────────── page component ──────────────── */
export default function StudentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const listKey = `${API_BASE}/students?page=${page}&pageSize=10&search=${encodeURIComponent(search)}`;
  const { data, error: fetchError, isLoading } = useSWR(listKey, fetcher);
  const { data: schools } = useSWR(`${API_BASE}/schools`, fetcher);

  /* When editing, hydrate form */
  useEffect(() => {
    if (editing) {
      setForm({
        firstName: editing.firstName,
        lastName: editing.lastName,
        fatherName: editing.fatherName,
        grade: editing.grade,
        status: editing.status,
        schoolName: editing.school?.name || "",
        schoolCurriculum: editing.school?.curriculum || "",
        schoolLocation: editing.school?.location || "",
        parentFirstName: editing.parents?.[0]?.firstName || "",
        parentLastName: editing.parents?.[0]?.lastName || "",
        parentPhone: editing.parents?.[0]?.phone || "",
      });
    }
  }, [editing]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setError("");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  /* Pick existing school from dropdown */
  const handleSchoolSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__new__") {
      setForm((f) => ({
        ...f,
        schoolName: "",
        schoolCurriculum: "",
        schoolLocation: "",
      }));
    } else if (val && schools) {
      const s = (schools as School[]).find((sc: School) => sc.id === val);
      if (s) {
        setForm((f) => ({
          ...f,
          schoolName: s.name,
          schoolCurriculum: s.curriculum,
          schoolLocation: s.location,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const token = getToken();
    const headers = {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      fatherName: form.fatherName,
      grade: form.grade,
      status: form.status,
      schoolName: form.schoolName,
      schoolCurriculum: form.schoolCurriculum || undefined,
      schoolLocation: form.schoolLocation || undefined,
      parentFirstName: form.parentFirstName || undefined,
      parentLastName: form.parentLastName || undefined,
      parentPhone: form.parentPhone || undefined,
    };

    try {
      if (editing) {
        await axios.put(`${API_BASE}/students/${editing.id}`, payload, {
          headers,
        });
      } else {
        await axios.post(`${API_BASE}/students`, payload, { headers });
      }
      mutate(listKey);
      mutate(`${API_BASE}/schools`);
      closeForm();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Something went wrong",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ──────────────── search ──────────────── */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  /* ──────────────── render ──────────────── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (fetchError) {
    return <p className="text-red-600">Failed to load students.</p>;
  }

  const { items, totalPages } = data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Students</h2>
        <button
          id="add-student-btn"
          onClick={openNew}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 transition-colors"
        >
          + Add Student
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Search by name, school..."
          className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Father&apos;s Name</th>
                <th className="px-3 py-2">Grade</th>
                <th className="px-3 py-2">School</th>
                <th className="px-3 py-2">Parent</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-slate-400"
                  >
                    No students found. Click &quot;+ Add Student&quot; to add
                    one.
                  </td>
                </tr>
              )}
              {items.map((student: Student) => (
                <tr key={student.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2 font-medium">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="px-3 py-2">{student.fatherName}</td>
                  <td className="px-3 py-2">{student.grade}</td>
                  <td className="px-3 py-2">{student.school?.name}</td>
                  <td className="px-3 py-2">
                    {student.parents?.[0]
                      ? `${student.parents[0].firstName} ${student.parents[0].lastName}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${student.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => openEdit(student)}
                      className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* ──────────────── Add / Edit Modal ──────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-semibold">
              {editing ? "Edit Student" : "Add New Student"}
            </h3>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ── Student Info ── */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-700 border-b pb-1 w-full">
                  Student Information
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      First Name *
                    </label>
                    <input
                      id="student-first-name"
                      name="firstName"
                      required
                      value={form.firstName}
                      onChange={handleChange}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Last Name *
                    </label>
                    <input
                      id="student-last-name"
                      name="lastName"
                      required
                      value={form.lastName}
                      onChange={handleChange}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Father&apos;s Name *
                    </label>
                    <input
                      id="student-father-name"
                      name="fatherName"
                      required
                      value={form.fatherName}
                      onChange={handleChange}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Grade *
                    </label>
                    <input
                      id="student-grade"
                      name="grade"
                      required
                      value={form.grade}
                      onChange={handleChange}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Status
                  </label>
                  <select
                    id="student-status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </fieldset>

              {/* ── School Info ── */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-700 border-b pb-1 w-full">
                  School Information
                </legend>

                {/* Quick-select existing school */}
                {schools && (schools as School[]).length > 0 && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Select existing school or add new
                    </label>
                    <select
                      id="school-select"
                      onChange={handleSchoolSelect}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      defaultValue=""
                    >
                      <option value="">— Choose —</option>
                      {(schools as School[]).map((s: School) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                      <option value="__new__">+ Add new school</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    School Name *
                  </label>
                  <input
                    id="school-name"
                    name="schoolName"
                    required
                    value={form.schoolName}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Curriculum
                    </label>
                    <input
                      id="school-curriculum"
                      name="schoolCurriculum"
                      value={form.schoolCurriculum}
                      onChange={handleChange}
                      placeholder="e.g. CBSE, ICSE, State Board"
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Location
                    </label>
                    <input
                      id="school-location"
                      name="schoolLocation"
                      value={form.schoolLocation}
                      onChange={handleChange}
                      placeholder="City or area"
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </fieldset>

              {/* ── Parent Info ── */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-700 border-b pb-1 w-full">
                  Parent / Guardian Information
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Parent First Name
                    </label>
                    <input
                      id="parent-first-name"
                      name="parentFirstName"
                      value={form.parentFirstName}
                      onChange={handleChange}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Parent Last Name
                    </label>
                    <input
                      id="parent-last-name"
                      name="parentLastName"
                      value={form.parentLastName}
                      onChange={handleChange}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Parent Phone
                  </label>
                  <input
                    id="parent-phone"
                    name="parentPhone"
                    value={form.parentPhone}
                    onChange={handleChange}
                    placeholder="+91 ..."
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </fieldset>

              {/* ── Actions ── */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="save-student-btn"
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Update Student"
                      : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

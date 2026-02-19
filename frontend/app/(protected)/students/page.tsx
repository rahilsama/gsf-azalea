"use client";

import { useState, Suspense } from "react";
import useSWR, { mutate } from "swr";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

const fetcher = async (url: string) => {
  const token = window.localStorage.getItem("authToken");
  const res = await axios.get(url, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });
  return res.data;
};

// Main content component using search params
function StudentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const economicCategoryParam = searchParams.get("economicCategory");
  const schoolNameParam = searchParams.get("schoolName");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Delete state
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Construct query string
  let queryStr = `page=${page}&limit=20`;
  if (search) queryStr += `&search=${encodeURIComponent(search)}`;
  if (economicCategoryParam) queryStr += `&economicCategory=${encodeURIComponent(economicCategoryParam)}`;
  if (schoolNameParam) queryStr += `&schoolName=${encodeURIComponent(schoolNameParam)}`;

  const { data, error, isLoading } = useSWR(`${API}/students?${queryStr}`, fetcher);

  const openDetail = (student: any) => {
    setSelectedStudent(student);
    setShowDetail(true);
  };

  const confirmDelete = (student: any) => {
    setStudentToDelete(student);
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      const token = window.localStorage.getItem("authToken");
      await axios.delete(`${API}/students/${studentToDelete.id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      // Show success
      setToastMessage(`Student ${studentToDelete.firstName} deleted successfully.`);
      setTimeout(() => setToastMessage(null), 3000);

      // Refresh list
      mutate(`${API}/students?${queryStr}`);
      setStudentToDelete(null); // Close delete modal

      // If we deleted the student currently open in detail view, close it
      if (selectedStudent?.id === studentToDelete.id) {
        setShowDetail(false);
        setSelectedStudent(null);
      }
    } catch (err) {
      alert("Failed to delete student. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    router.push("/students");
    setSearch("");
    setPage(1);
  };

  const getCurrentEnrollment = (student: any) => {
    if (!student.enrollments || student.enrollments.length === 0) return null;
    return student.enrollments[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error) return <p className="text-red-600 p-4">Failed to load students.</p>;

  const { students = [], total = 0, totalPages = 1 } = data || {};

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[100] rounded-lg bg-emerald-600 px-6 py-3 text-white shadow-lg animate-fade-in-down">
          {toastMessage}
        </div>
      )}

      {/* Header & Back Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center justify-center rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 transition-colors"
            title="Back to Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Students</h1>
            <p className="text-sm text-slate-500">{total} students total</p>
          </div>
        </div>

        {/* Active Filters */}
        {(economicCategoryParam || schoolNameParam) && (
          <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
            <span className="font-semibold">Filtered by:</span>
            {economicCategoryParam && <span>Category: <b>{economicCategoryParam}</b></span>}
            {schoolNameParam && <span>School: <b>{schoolNameParam}</b></span>}
            <button
              onClick={clearFilters}
              className="ml-2 rounded-full bg-indigo-200 p-1 hover:bg-indigo-300 transition-colors"
              title="Clear filters"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by name, school, phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Student Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <th className="px-4 py-3">Sr.</th>
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">School (2022-23)</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Centre</th>
              <th className="px-4 py-3">GSF Contrib.</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student: any) => {
              const enrollment = getCurrentEnrollment(student);
              return (
                <tr key={student.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400">{student.serialNumber || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{student.firstName} {student.lastName}</div>
                    <div className="text-xs text-slate-500">{student.fatherName}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate" title={enrollment?.school?.name}>
                    {enrollment?.school?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${student.family?.economicCategory === "SWB" ? "bg-red-100 text-red-700" :
                        student.family?.economicCategory === "EWS" ? "bg-orange-100 text-orange-700" :
                          student.family?.economicCategory === "LIG" ? "bg-amber-100 text-amber-700" :
                            "bg-blue-100 text-blue-700"
                      }`}>
                      {student.family?.economicCategory || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {student.family?.centre ? `${student.family.centre.name}` : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-emerald-600">
                    {enrollment ? `₹${Number(enrollment.gsfContribution).toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetail(student)}
                        className="rounded bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); confirmDelete(student); }}
                        className="rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No students found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            {/* Detail modal content... */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h2>
                <p className="text-sm text-slate-500">
                  Father: {selectedStudent.fatherName} &bull; DOB: {selectedStudent.dob ? new Date(selectedStudent.dob).toLocaleDateString("en-IN") : "N/A"}
                  {selectedStudent.pid && <> &bull; PID: {selectedStudent.pid}</>}
                </p>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="rounded-lg p-2 hover:bg-slate-100 text-slate-400 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Family Info */}
            <div className="mb-6 rounded-lg bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Family Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-400">Phone:</span> {selectedStudent.family?.phone || "N/A"}</div>
                <div><span className="text-slate-400">Email:</span> {selectedStudent.family?.email || "N/A"}</div>
                <div><span className="text-slate-400">Category:</span> {selectedStudent.family?.economicCategory}</div>
                <div><span className="text-slate-400">UFN:</span> {selectedStudent.family?.ufn || "N/A"}</div>
                <div className="col-span-2"><span className="text-slate-400">Background:</span> {selectedStudent.family?.background || "N/A"}</div>
                {selectedStudent.family?.centre && (
                  <div className="col-span-2">
                    <span className="text-slate-400">Centre:</span> {selectedStudent.family.centre.name}, {selectedStudent.family.centre.leb}
                  </div>
                )}
              </div>
            </div>

            {/* Enrollments */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Enrollments</h3>
              {selectedStudent.enrollments?.map((e: any) => (
                <div key={e.id} className="mb-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-indigo-600">{e.academicYear}</span>
                    <span className="text-sm text-slate-500">{e.school?.name || "Not studying"}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                    <div>Standard: <b>{e.standard || "—"}</b></div>
                    <div>Curriculum: <b>{e.school?.curriculum || "—"}</b></div>
                    <div>Medium: <b>{e.school?.medium || "—"}</b></div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-slate-100 p-2">
                      <div className="text-slate-400">Total Cost</div>
                      <div className="font-bold text-slate-800">₹{Number(e.totalCost).toLocaleString("en-IN")}</div>
                    </div>
                    <div className="rounded bg-emerald-50 p-2">
                      <div className="text-slate-400">Parent Contribution</div>
                      <div className="font-bold text-emerald-700">₹{Number(e.parentContribution).toLocaleString("en-IN")}</div>
                    </div>
                    <div className="rounded bg-indigo-50 p-2">
                      <div className="text-slate-400">GSF Contribution</div>
                      <div className="font-bold text-indigo-700">₹{Number(e.gsfContribution).toLocaleString("en-IN")}</div>
                    </div>
                    <div className="rounded bg-amber-50 p-2">
                      <div className="text-slate-400">Scholarship</div>
                      <div className="font-bold text-amber-700">₹{Number(e.scholarshipSupport).toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Process Log */}
            {selectedStudent.processLog && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Process Log</h3>
                <div className="space-y-2 text-xs">
                  {selectedStudent.processLog.admissionProcess && (
                    <div className="rounded-lg bg-emerald-50 p-3">
                      <span className="font-semibold text-emerald-700">Admission Status:</span>{" "}
                      {selectedStudent.processLog.admissionProcess}
                    </div>
                  )}
                  {[
                    { label: "Remarks by SWB", value: selectedStudent.processLog.remarksSWB },
                    { label: "Remarks by GSF", value: selectedStudent.processLog.remarksGSF },
                    { label: "AKEBI Coordinator", value: selectedStudent.processLog.akebiCoordinatorRemarks },
                    { label: "Navroz President", value: selectedStudent.processLog.navrozPresidentRemarks },
                    { label: "AKEBI", value: selectedStudent.processLog.remarksAKEBI },
                    { label: "RCP Remarks", value: selectedStudent.processLog.rcpRemarks },
                    { label: "AKEB Coordinator", value: selectedStudent.processLog.akebCoordinatorRemarks },
                    { label: "GSF Comments", value: selectedStudent.processLog.gsfComments },
                  ]
                    .filter((r) => r.value)
                    .map((r, i) => (
                      <div key={i} className="rounded-lg bg-slate-50 p-3">
                        <span className="font-semibold text-slate-600">{r.label}:</span>{" "}
                        <span className="text-slate-700">{r.value}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Actions for detail modal */}
            <div className="mt-6 flex justify-end border-t pt-4">
              <button
                onClick={() => confirmDelete(selectedStudent)}
                className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                title="Only Admin can delete"
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl animate-scale-up">
            <h3 className="text-lg font-bold text-slate-800">Delete Student?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete <b>{studentToDelete.firstName} {studentToDelete.lastName}</b>?
              <br /><br />
              This will remove all their data, including enrollments and logs.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setStudentToDelete(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapped component with Suspense
export default function StudentsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    }>
      <StudentsContent />
    </Suspense>
  );
}

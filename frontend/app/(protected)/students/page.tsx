"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

const fetcher = async (url: string) => {
  const token = window.localStorage.getItem("authToken");
  const res = await axios.get(url, {
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });
  return res.data;
};

export default function StudentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  const queryStr = `page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`;
  const { data, error, isLoading } = useSWR(`${API}/students?${queryStr}`, fetcher);

  const openDetail = (student: any) => {
    setSelectedStudent(student);
    setShowDetail(true);
  };

  // Get current enrollment (latest academic year)
  const getCurrentEnrollment = (student: any) => {
    if (!student.enrollments || student.enrollments.length === 0) return null;
    return student.enrollments[0]; // Already sorted by academic_year desc
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Students</h1>
          <p className="text-sm text-slate-500">{total} students total</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by name, school, phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* Student Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <th className="px-4 py-3">Sr.</th>
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">Father</th>
              <th className="px-4 py-3">School (2022-23)</th>
              <th className="px-4 py-3">Standard</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Centre</th>
              <th className="px-4 py-3">GSF Contribution</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student: any) => {
              const enrollment = getCurrentEnrollment(student);
              return (
                <tr key={student.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400">{student.serialNumber || "—"}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="px-4 py-3">{student.fatherName || "—"}</td>
                  <td className="px-4 py-3">{enrollment?.school?.name || "—"}</td>
                  <td className="px-4 py-3">{enrollment?.standard || "—"}</td>
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
                    {student.family?.centre ? `${student.family.centre.name}, ${student.family.centre.leb}` : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-emerald-600">
                    {enrollment ? `₹${Number(enrollment.gsfContribution).toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openDetail(student)}
                      className="rounded bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                  No students found.
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
                  {(Number(e.annualFees) > 0 || Number(e.transportSchoolBus) > 0) && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-indigo-500">Fee breakdown</summary>
                      <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-500">
                        <div>Annual Fees: ₹{Number(e.annualFees).toLocaleString("en-IN")}</div>
                        <div>Admission: ₹{Number(e.admissionFee).toLocaleString("en-IN")}</div>
                        <div>Transport (Bus): ₹{Number(e.transportSchoolBus).toLocaleString("en-IN")}</div>
                        <div>Transport (Parent): ₹{Number(e.transportByParents).toLocaleString("en-IN")}</div>
                        <div>Tutorial: ₹{Number(e.tutorialCost).toLocaleString("en-IN")}</div>
                        <div>Uniform: ₹{Number(e.uniformCost).toLocaleString("en-IN")}</div>
                        <div>Textbooks: ₹{Number(e.textbooksCost).toLocaleString("en-IN")}</div>
                        <div>Other: ₹{Number(e.otherActivitiesCost).toLocaleString("en-IN")}</div>
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>

            {/* Process Log */}
            {selectedStudent.processLog && (
              <div>
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
          </div>
        </div>
      )}
    </div>
  );
}

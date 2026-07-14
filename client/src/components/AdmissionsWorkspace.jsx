import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Search, UserRound } from 'lucide-react';
import SelectField from './context/SelectField';

const admissionStatuses = ['Pending', 'Approved', 'Rejected', 'Deferred', 'Enrolled'];

const statusTone = (status) => {
  if (status === 'Approved' || status === 'Enrolled') return 'bg-emerald-50 text-emerald-700';
  if (status === 'Rejected') return 'bg-rose-50 text-rose-700';
  if (status === 'Deferred') return 'bg-amber-50 text-amber-700';
  return 'bg-sky-50 text-sky-700';
};

const formatTimestamp = (value) => {
  if (!value) return 'Unknown time';
  return new Date(value).toLocaleString();
};

const AdmissionsWorkspace = ({
  applications = [],
  title = 'Admissions',
  subtitle = 'Review and manage student applications.',
  showCourseFilter = true,
  secondaryAction = null,
  onReview = () => {},
  reviewLabel = 'Review',
  pageSize = 25,
  className = '',
}) => {
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const courseOptions = useMemo(
    () => ['ALL', ...new Set(applications.map((app) => app.course_name).filter(Boolean))],
    [applications]
  );

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const statusMatch = app.admission_status === statusFilter;
      const fullName = `${app.surname || ''} ${app.other_names || ''}`.toLowerCase();
      const search = searchTerm.trim().toLowerCase();
      const searchMatch = search
        ? fullName.includes(search) ||
          String(app.email || '').toLowerCase().includes(search) ||
          String(app.id || '').toLowerCase().includes(search)
        : true;
      const courseMatch = showCourseFilter ? (courseFilter === 'ALL' ? true : app.course_name === courseFilter) : true;
      return statusMatch && searchMatch && courseMatch;
    });
  }, [applications, statusFilter, searchTerm, courseFilter, showCourseFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredApps.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedApps = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return filteredApps.slice(startIndex, startIndex + pageSize);
  }, [filteredApps, safePage, pageSize]);

  const start = filteredApps.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, filteredApps.length);
  const visiblePages = useMemo(() => {
    const span = 5;
    const startPage = Math.max(1, safePage - Math.floor(span / 2));
    const pages = Array.from({ length: span }, (_, idx) => startPage + idx).filter((n) => n <= totalPages);
    return pages;
  }, [safePage, totalPages]);

  return (
    <div className={`w-full rounded-[36px] bg-[radial-gradient(circle_at_top_left,rgba(32,149,211,0.16),transparent_32%),linear-gradient(180deg,#f8fcff_0%,#eef7fd_100%)] p-4 sm:p-6 lg:p-8 ${className}`}>
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#45A1D6]">{title}</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-[#191839] sm:text-5xl">Admissions Workspace</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">{subtitle}</p>
          </div>
          <div className="rounded-[24px] border border-sky-100/90 bg-white px-5 py-4 shadow-[0_20px_40px_rgba(24,56,88,0.06)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#45A1D6]">{statusFilter} Admissions</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-[#2B2A4C]">{String(filteredApps.length).padStart(2, '0')}</p>
          </div>
        </div>

        <section className="overflow-hidden rounded-[32px] border border-sky-100/90 bg-white shadow-[0_28px_70px_rgba(24,56,88,0.08)]">
          <div className="border-b border-sky-100 bg-[linear-gradient(180deg,rgba(248,252,255,0.96),rgba(240,248,253,0.82))] px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-3">
                {admissionStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setStatusFilter(status);
                      setPage(1);
                    }}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                      statusFilter === status
                        ? 'bg-[#2095D3] text-white shadow-[0_10px_24px_rgba(32,149,211,0.22)]'
                        : 'bg-white text-slate-500 ring-1 ring-sky-100 hover:bg-sky-50 hover:text-[#2095D3]'
                    }`}
                  >
                    {status} ({applications.filter((app) => app.admission_status === status).length})
                  </button>
                ))}
              </div>
              <div className={`grid gap-3 ${showCourseFilter ? 'lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]' : 'lg:grid-cols-1'}`}>
                <div className="group relative">
                  <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2095D3]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search student by name, email, or ID..."
                    className="w-full rounded-[20px] border border-sky-100 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#2095D3] focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                {showCourseFilter && (
                  <SelectField
                    id="admissions-course-filter"
                    name="admissionsCourseFilter"
                    value={courseFilter}
                    onChange={(e) => {
                      setCourseFilter(e.target.value);
                      setPage(1);
                    }}
                    placeholder="All courses"
                    searchable
                  >
                    {courseOptions.map((course) => (
                      <option key={course} value={course}>
                        {course === 'ALL' ? 'All courses' : course}
                      </option>
                    ))}
                  </SelectField>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {paginatedApps.length > 0 ? (
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/60">
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">Applicant</th>
                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">Course</th>
                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">Submitted</th>
                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">Status</th>
                    <th className="px-8 py-5 text-right text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-50">
                  {paginatedApps.map((app) => {
                    const fullName = [app.surname, app.other_names].filter(Boolean).join(', ');
                    return (
                      <tr key={app.id} className="group transition-colors hover:bg-sky-50/40">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#99D2F2] text-lg font-bold text-[#2B2A4C]">
                              {app.surname?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-semibold text-[#2B2A4C]">{fullName || 'Unnamed Applicant'}</p>
                              <p className="mt-1 text-xs text-slate-500">{app.email || 'No email provided'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-medium text-slate-800">{app.course_name || 'Course not assigned'}</p>
                          <p className="mt-1 text-xs text-slate-500">{app.phone || 'No phone number'}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold text-slate-800">{formatTimestamp(app.created_at || app.submitted_at)}</p>
                          <p className="mt-1 text-xs text-slate-500">Application received</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${statusTone(app.admission_status)}`}>
                            {app.admission_status}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onReview(app)}
                              className="inline-flex items-center gap-2 rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm font-semibold text-[#2095D3] transition hover:border-sky-200 hover:bg-sky-50"
                            >
                              <Eye size={16} />
                              {reviewLabel}
                            </button>
                            {secondaryAction ? secondaryAction(app) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-sky-500">
                  <UserRound size={28} />
                </div>
                <p className="mt-6 text-xl font-bold text-slate-900">No {statusFilter.toLowerCase()} admissions found</p>
                <p className="mt-2 max-w-md text-sm leading-7 text-slate-400">
                  Change the admissions stage filter to inspect another part of the application queue.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-sky-100 bg-slate-50/60 px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing {start} to {end} of {filteredApps.length} {statusFilter.toLowerCase()} admissions
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage === 1}
                className="rounded-xl border border-transparent p-2 text-slate-400 transition hover:border-sky-100 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              {visiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`rounded-xl px-4 py-2 text-sm transition ${
                    safePage === pageNumber
                      ? 'border border-sky-100 bg-white font-bold text-sky-600 shadow-sm'
                      : 'border border-transparent text-slate-600 hover:border-sky-100 hover:bg-white'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={safePage === totalPages}
                className="rounded-xl border border-transparent p-2 text-slate-400 transition hover:border-sky-100 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdmissionsWorkspace;

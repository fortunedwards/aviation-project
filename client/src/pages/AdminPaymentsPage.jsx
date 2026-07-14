import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { Banknote, ChevronLeft, ChevronRight, CreditCard, Search, WalletCards } from 'lucide-react';
import SelectField from '../components/context/SelectField';

const REGISTRATION_FEE_NAIRA = 5000;
const PAGE_SIZE = 25;

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `NGN ${amount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
};

const paymentTone = (status) => {
  if (String(status || '').toLowerCase() === 'paid') return 'bg-emerald-50 text-emerald-700';
  return 'bg-amber-50 text-amber-700';
};

const normalizePaymentStatus = (value, ref) => {
  if (String(value || '').toLowerCase() === 'paid') return 'Paid';
  if (ref && ref !== 'FREE_REG') return 'Paid';
  return 'Pending';
};

const isApproved = (status) => String(status || '').toLowerCase() === 'approved';

const AdminPaymentsPage = () => {
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePaymentTab, setActivePaymentTab] = useState('tuition');

  const [tuitionSearchTerm, setTuitionSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');

  const [registrationSearchTerm, setRegistrationSearchTerm] = useState('');
  const [registrationStatusFilter, setRegistrationStatusFilter] = useState('ALL');
  const [tuitionPage, setTuitionPage] = useState(1);
  const [registrationPage, setRegistrationPage] = useState(1);

  useEffect(() => {
    const fetchPaymentsContext = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const [appsRes, coursesRes] = await Promise.allSettled([
          api.get('/api/applications/all', { headers }),
          api.get('/api/courses')
        ]);

        if (appsRes.status === 'fulfilled') {
          setApplications(appsRes.value.data?.data || []);
        }

        if (coursesRes.status === 'fulfilled') {
          setCourses(coursesRes.value.data || []);
        }
      } catch (err) {
        console.error('Failed to load payments context', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentsContext();
  }, []);

  const courseMetaById = useMemo(() => {
    return new Map(courses.map((course) => [String(course.id), course]));
  }, [courses]);

  const approvedApplications = useMemo(() => {
    return applications.filter((app) => isApproved(app.admission_status));
  }, [applications]);

  const enrichedApplications = useMemo(() => {
    return approvedApplications.map((app) => {
      const fullName = [app.surname, app.other_names].filter(Boolean).join(', ') || app.email || 'Unnamed Applicant';
      const paymentStatus = normalizePaymentStatus(app.payment_status, app.payment_ref);
      const feeAmount = Number(app.course_fee || 0);
      const courseMeta = courseMetaById.get(String(app.course_id));
      const formFee = Number(courseMeta?.form_fee || 0);
      const requiresRegistrationFee = Math.round(formFee) === REGISTRATION_FEE_NAIRA;
      const registrationFeeStatus = app.payment_ref && app.payment_ref !== 'FREE_REG' ? 'Paid' : 'Pending';

      return {
        ...app,
        fullName,
        paymentStatus,
        feeAmount,
        requiresRegistrationFee,
        registrationFeeStatus,
      };
    });
  }, [approvedApplications, courseMetaById]);

  const coursesFilterOptions = useMemo(() => {
    return ['ALL', ...new Set(enrichedApplications.map((app) => app.course_name).filter(Boolean))];
  }, [enrichedApplications]);

  const filteredTuitionRows = useMemo(() => {
    const query = tuitionSearchTerm.trim().toLowerCase();

    return enrichedApplications.filter((app) => {
      const matchesCourse = courseFilter === 'ALL' ? true : app.course_name === courseFilter;
      const haystack = `${app.fullName} ${app.email || ''} ${app.course_name || ''} ${app.id || ''} ${app.payment_ref || ''}`.toLowerCase();
      const matchesSearch = query ? haystack.includes(query) : true;

      const matchesPayment =
        paymentFilter === 'ALL'
          ? true
          : paymentFilter === 'Paid'
            ? app.paymentStatus === 'Paid'
            : app.paymentStatus === 'Pending';

      return matchesCourse && matchesSearch && matchesPayment;
    });
  }, [enrichedApplications, paymentFilter, courseFilter, tuitionSearchTerm]);

  const tuitionTotalPages = Math.max(1, Math.ceil(filteredTuitionRows.length / PAGE_SIZE));
  const safeTuitionPage = Math.min(tuitionPage, tuitionTotalPages);
  const paginatedTuitionRows = useMemo(() => {
    const startIndex = (safeTuitionPage - 1) * PAGE_SIZE;
    return filteredTuitionRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredTuitionRows, safeTuitionPage]);
  const tuitionVisiblePages = useMemo(() => {
    const span = 5;
    const startPage = Math.max(1, safeTuitionPage - Math.floor(span / 2));
    return Array.from({ length: span }, (_, idx) => startPage + idx).filter((n) => n <= tuitionTotalPages);
  }, [safeTuitionPage, tuitionTotalPages]);
  const tuitionStart = filteredTuitionRows.length === 0 ? 0 : (safeTuitionPage - 1) * PAGE_SIZE + 1;
  const tuitionEnd = Math.min(safeTuitionPage * PAGE_SIZE, filteredTuitionRows.length);

  const summary = useMemo(() => {
    const totalExpected = enrichedApplications.reduce((sum, app) => sum + app.feeAmount, 0);
    const paidApps = enrichedApplications.filter((app) => app.paymentStatus === 'Paid');
    const pendingApps = enrichedApplications.filter((app) => app.paymentStatus !== 'Paid');

    const collected = paidApps.reduce((sum, app) => sum + app.feeAmount, 0);
    const outstanding = pendingApps.reduce((sum, app) => sum + app.feeAmount, 0);
    const collectionRate = totalExpected > 0 ? Math.round((collected / totalExpected) * 100) : 0;

    return {
      totalExpected,
      collected,
      outstanding,
      paidCount: paidApps.length,
      pendingCount: pendingApps.length,
      collectionRate
    };
  }, [enrichedApplications]);

  const registrationFeeRows = useMemo(() => {
    const query = registrationSearchTerm.trim().toLowerCase();

    return enrichedApplications.filter((app) => {
      if (!app.requiresRegistrationFee) return false;

      const matchesStatus =
        registrationStatusFilter === 'ALL'
          ? true
          : registrationStatusFilter === 'Paid'
            ? app.registrationFeeStatus === 'Paid'
            : app.registrationFeeStatus === 'Pending';

      const haystack = `${app.fullName} ${app.email || ''} ${app.course_name || ''} ${app.id || ''} ${app.payment_ref || ''}`.toLowerCase();
      const matchesSearch = query ? haystack.includes(query) : true;

      return matchesStatus && matchesSearch;
    });
  }, [enrichedApplications, registrationSearchTerm, registrationStatusFilter]);

  const registrationTotalPages = Math.max(1, Math.ceil(registrationFeeRows.length / PAGE_SIZE));
  const safeRegistrationPage = Math.min(registrationPage, registrationTotalPages);
  const paginatedRegistrationRows = useMemo(() => {
    const startIndex = (safeRegistrationPage - 1) * PAGE_SIZE;
    return registrationFeeRows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [registrationFeeRows, safeRegistrationPage]);
  const registrationVisiblePages = useMemo(() => {
    const span = 5;
    const startPage = Math.max(1, safeRegistrationPage - Math.floor(span / 2));
    return Array.from({ length: span }, (_, idx) => startPage + idx).filter((n) => n <= registrationTotalPages);
  }, [safeRegistrationPage, registrationTotalPages]);
  const registrationStart = registrationFeeRows.length === 0 ? 0 : (safeRegistrationPage - 1) * PAGE_SIZE + 1;
  const registrationEnd = Math.min(safeRegistrationPage * PAGE_SIZE, registrationFeeRows.length);

  const registrationSummary = useMemo(() => {
    const baseRows = enrichedApplications.filter((app) => app.requiresRegistrationFee);
    const paid = baseRows.filter((app) => app.registrationFeeStatus === 'Paid').length;
    const pending = baseRows.filter((app) => app.registrationFeeStatus !== 'Paid').length;
    const expected = baseRows.length * REGISTRATION_FEE_NAIRA;
    const collected = paid * REGISTRATION_FEE_NAIRA;

    return {
      totalApplicants: baseRows.length,
      paid,
      pending,
      expected,
      collected,
      outstanding: expected - collected,
    };
  }, [enrichedApplications]);

  useEffect(() => {
    setTuitionPage(1);
  }, [tuitionSearchTerm, paymentFilter, courseFilter]);

  useEffect(() => {
    setRegistrationPage(1);
  }, [registrationSearchTerm, registrationStatusFilter]);

  return (
    <div className="w-full rounded-[36px] bg-[radial-gradient(circle_at_top_left,rgba(32,149,211,0.16),transparent_32%),linear-gradient(180deg,#f8fcff_0%,#eef7fd_100%)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#45A1D6]">Payments</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-[#191839] sm:text-5xl">Financial Overview</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Only approved applications are shown here. Switch between tuition and registration-fee tracking.
            </p>
          </div>
        </div>

        <section className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActivePaymentTab('tuition')}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
              activePaymentTab === 'tuition'
                ? 'bg-[#2095D3] text-white shadow-[0_10px_24px_rgba(32,149,211,0.22)]'
                : 'bg-white text-slate-500 ring-1 ring-sky-100 hover:bg-sky-50 hover:text-[#2095D3]'
            }`}
          >
            Tuition Payments
          </button>
          <button
            type="button"
            onClick={() => setActivePaymentTab('registration')}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
              activePaymentTab === 'registration'
                ? 'bg-[#2095D3] text-white shadow-[0_10px_24px_rgba(32,149,211,0.22)]'
                : 'bg-white text-slate-500 ring-1 ring-sky-100 hover:bg-sky-50 hover:text-[#2095D3]'
            }`}
          >
            Registration Fees
          </button>
        </section>

        {activePaymentTab === 'tuition' && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <article className="rounded-[24px] border border-sky-100/90 bg-white p-5 shadow-[0_20px_40px_rgba(24,56,88,0.06)]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Total Expected</p>
                  <span className="rounded-xl bg-sky-50 p-2 text-[#2095D3]"><WalletCards size={16} /></span>
                </div>
                <p className="mt-4 text-2xl font-black tracking-tight text-[#2B2A4C]">{formatCurrency(summary.totalExpected)}</p>
              </article>

              <article className="rounded-[24px] border border-sky-100/90 bg-white p-5 shadow-[0_20px_40px_rgba(24,56,88,0.06)]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Collected</p>
                  <span className="rounded-xl bg-emerald-50 p-2 text-emerald-600"><Banknote size={16} /></span>
                </div>
                <p className="mt-4 text-2xl font-black tracking-tight text-emerald-600">{formatCurrency(summary.collected)}</p>
              </article>

              <article className="rounded-[24px] border border-sky-100/90 bg-white p-5 shadow-[0_20px_40px_rgba(24,56,88,0.06)]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Outstanding</p>
                  <span className="rounded-xl bg-amber-50 p-2 text-amber-600"><CreditCard size={16} /></span>
                </div>
                <p className="mt-4 text-2xl font-black tracking-tight text-amber-600">{formatCurrency(summary.outstanding)}</p>
              </article>

              <article className="rounded-[24px] border border-sky-100/90 bg-white p-5 shadow-[0_20px_40px_rgba(24,56,88,0.06)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Paid / Pending</p>
                <p className="mt-4 text-2xl font-black tracking-tight text-[#2B2A4C]">{summary.paidCount} / {summary.pendingCount}</p>
              </article>

              <article className="rounded-[24px] border border-sky-100/90 bg-white p-5 shadow-[0_20px_40px_rgba(24,56,88,0.06)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Collection Rate</p>
                <p className="mt-4 text-2xl font-black tracking-tight text-[#2095D3]">{summary.collectionRate}%</p>
              </article>
            </section>

            <section className="overflow-hidden rounded-[32px] border border-sky-100/90 bg-white shadow-[0_28px_70px_rgba(24,56,88,0.08)]">
              <div className="border-b border-sky-100 bg-[linear-gradient(180deg,rgba(248,252,255,0.96),rgba(240,248,253,0.82))] px-6 py-5 sm:px-8">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_240px]">
                  <div className="group relative">
                    <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2095D3]" />
                    <input
                      value={tuitionSearchTerm}
                      onChange={(e) => setTuitionSearchTerm(e.target.value)}
                      placeholder="Search applicant, email, ID, reference"
                      className="w-full rounded-[20px] border border-sky-100 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#2095D3] focus:ring-2 focus:ring-sky-100"
                    />
                  </div>

                  <SelectField
                    id="payment-status-filter"
                    name="paymentStatusFilter"
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    placeholder="All statuses"
                  >
                    <option value="ALL">All statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </SelectField>

                  <SelectField
                    id="payment-course-filter"
                    name="paymentCourseFilter"
                    value={courseFilter}
                    onChange={(e) => setCourseFilter(e.target.value)}
                    placeholder="All courses"
                    searchable
                  >
                    {coursesFilterOptions.map((course) => (
                      <option key={course} value={course}>
                        {course === 'ALL' ? 'All courses' : course}
                      </option>
                    ))}
                  </SelectField>
                </div>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="px-8 py-16 text-center text-slate-500">Loading payment ledger...</div>
                ) : filteredTuitionRows.length === 0 ? (
                  <div className="px-8 py-16 text-center text-slate-500">No approved payment records match your filters.</div>
                ) : (
                  <table className="min-w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50/60">
                        <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">Applicant</th>
                        <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">Course</th>
                        <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">Tuition Fee</th>
                        <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">Payment</th>
                        <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-50">
                      {paginatedTuitionRows.map((app) => (
                        <tr key={app.id} className="group transition-colors hover:bg-sky-50/40">
                          <td className="px-8 py-5">
                            <p className="font-semibold text-[#2B2A4C]">{app.fullName}</p>
                            <p className="mt-1 text-xs text-slate-500">{app.email || 'No email provided'}</p>
                          </td>
                          <td className="px-6 py-5 text-sm font-medium text-slate-700">{app.course_name || 'No course assigned'}</td>
                          <td className="px-6 py-5 text-sm font-bold text-slate-800">{formatCurrency(app.feeAmount)}</td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${paymentTone(app.paymentStatus)}`}>
                              {app.paymentStatus}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-xs font-semibold text-slate-600">{app.payment_ref || 'Not generated'}</p>
                            <p className="mt-1 text-[11px] text-slate-400">App ID: {app.id}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex flex-col gap-4 border-t border-sky-100 bg-slate-50/60 px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing {tuitionStart} to {tuitionEnd} of {filteredTuitionRows.length} approved tuition records
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTuitionPage((current) => Math.max(1, current - 1))}
                    disabled={safeTuitionPage === 1}
                    className="rounded-xl border border-transparent p-2 text-slate-400 transition hover:border-sky-100 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {tuitionVisiblePages.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setTuitionPage(pageNumber)}
                      className={`rounded-xl px-4 py-2 text-sm transition ${
                        safeTuitionPage === pageNumber
                          ? 'border border-sky-100 bg-white font-bold text-sky-600 shadow-sm'
                          : 'border border-transparent text-slate-600 hover:border-sky-100 hover:bg-white'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTuitionPage((current) => Math.min(tuitionTotalPages, current + 1))}
                    disabled={safeTuitionPage === tuitionTotalPages}
                    className="rounded-xl border border-transparent p-2 text-slate-400 transition hover:border-sky-100 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {activePaymentTab === 'registration' && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              <article className="rounded-[24px] border border-sky-100/90 bg-white p-5 shadow-[0_20px_40px_rgba(24,56,88,0.06)]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Total Registrations</p>
                  <span className="rounded-xl bg-sky-50 p-2 text-[#2095D3]"><WalletCards size={16} /></span>
                </div>
                <p className="mt-4 text-2xl font-black tracking-tight text-[#2B2A4C]">{registrationSummary.totalApplicants}</p>
              </article>

              <article className="rounded-[24px] border border-sky-100/90 bg-white p-5 shadow-[0_20px_40px_rgba(24,56,88,0.06)]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Collected</p>
                  <span className="rounded-xl bg-emerald-50 p-2 text-emerald-600"><Banknote size={16} /></span>
                </div>
                <p className="mt-4 text-2xl font-black tracking-tight text-emerald-600">{formatCurrency(registrationSummary.collected)}</p>
              </article>
            </section>

            <section className="overflow-hidden rounded-[32px] border border-sky-100/90 bg-white shadow-[0_28px_70px_rgba(24,56,88,0.08)]">
              <div className="border-b border-sky-100 bg-[linear-gradient(180deg,rgba(248,252,255,0.96),rgba(240,248,253,0.82))] px-6 py-5 sm:px-8">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="group relative">
                    <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2095D3]" />
                    <input
                      value={registrationSearchTerm}
                      onChange={(e) => setRegistrationSearchTerm(e.target.value)}
                      placeholder="Search applicant, email, ID, reference"
                      className="w-full rounded-[20px] border border-sky-100 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#2095D3] focus:ring-2 focus:ring-sky-100"
                    />
                  </div>

                  <SelectField
                    id="registration-status-filter"
                    name="registrationStatusFilter"
                    value={registrationStatusFilter}
                    onChange={(e) => setRegistrationStatusFilter(e.target.value)}
                    placeholder="All statuses"
                  >
                    <option value="ALL">All statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </SelectField>
                </div>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="px-8 py-16 text-center text-slate-500">Loading registration fee records...</div>
                ) : registrationFeeRows.length === 0 ? (
                  <div className="px-8 py-16 text-center text-slate-500">No approved applications found for NGN 5,000 registration-fee courses.</div>
                ) : (
                  <table className="min-w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50/60">
                        <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">Applicant</th>
                        <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">Course</th>
                        <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">Reg Fee</th>
                        <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">Payment</th>
                        <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.26em] text-[#45A1D6]">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-50">
                      {paginatedRegistrationRows.map((app) => (
                        <tr key={`reg-${app.id}`} className="group transition-colors hover:bg-sky-50/40">
                          <td className="px-8 py-5">
                            <p className="font-semibold text-[#2B2A4C]">{app.fullName}</p>
                            <p className="mt-1 text-xs text-slate-500">{app.email || 'No email provided'}</p>
                          </td>
                          <td className="px-6 py-5 text-sm font-medium text-slate-700">{app.course_name || 'No course assigned'}</td>
                          <td className="px-6 py-5 text-sm font-bold text-slate-800">{formatCurrency(REGISTRATION_FEE_NAIRA)}</td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${paymentTone(app.registrationFeeStatus)}`}>
                              {app.registrationFeeStatus}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-xs font-semibold text-slate-600">{app.payment_ref || 'Not generated'}</p>
                            <p className="mt-1 text-[11px] text-slate-400">App ID: {app.id}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex flex-col gap-4 border-t border-sky-100 bg-slate-50/60 px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing {registrationStart} to {registrationEnd} of {registrationFeeRows.length} approved registration-fee records
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRegistrationPage((current) => Math.max(1, current - 1))}
                    disabled={safeRegistrationPage === 1}
                    className="rounded-xl border border-transparent p-2 text-slate-400 transition hover:border-sky-100 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {registrationVisiblePages.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setRegistrationPage(pageNumber)}
                      className={`rounded-xl px-4 py-2 text-sm transition ${
                        safeRegistrationPage === pageNumber
                          ? 'border border-sky-100 bg-white font-bold text-sky-600 shadow-sm'
                          : 'border border-transparent text-slate-600 hover:border-sky-100 hover:bg-white'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setRegistrationPage((current) => Math.min(registrationTotalPages, current + 1))}
                    disabled={safeRegistrationPage === registrationTotalPages}
                    className="rounded-xl border border-transparent p-2 text-slate-400 transition hover:border-sky-100 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPaymentsPage;

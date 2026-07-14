import React, { useMemo, useState } from 'react';
import api, { API_BASE_URL } from '../lib/api';
import {
  Check,
  Clock,
  ExternalLink,
  FileText,
  RotateCcw,
  ShieldCheck,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';
import { usePopup } from './context/PopupProvider';

const DASH = '-';
const cardShell = 'rounded-[32px] border border-sky-100/90 bg-white p-6 shadow-[0_28px_70px_rgba(24,56,88,0.08)]';
const sectionTitle = 'mb-5 border-b border-sky-100 pb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#45A1D6]';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : DASH);

const statusTone = (status) => {
  if (status === 'Approved' || status === 'Enrolled') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Rejected') return 'bg-rose-100 text-rose-700';
  if (status === 'Deferred') return 'bg-amber-100 text-amber-700';
  return 'bg-sky-100 text-sky-700';
};

const DataField = ({ label, value, highlight = false }) => (
  <div className="rounded-2xl border border-sky-100 bg-slate-50/80 px-4 py-3">
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
    <p className={`mt-1 text-sm font-semibold ${highlight ? 'text-[#2095D3]' : 'text-slate-700'}`}>{value || DASH}</p>
  </div>
);

const LongBlock = ({ label, value }) => (
  <div className="rounded-2xl border border-sky-100 bg-slate-50/80 px-4 py-4">
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{value || 'No information provided.'}</p>
  </div>
);

const ReviewModal = ({ app, onClose, refresh = () => {}, readOnly = false }) => {
  const popup = usePopup();
  const [remarks, setRemarks] = useState(app.instructor_remarks || '');
  const [submitting, setSubmitting] = useState(false);
  const [overrideMode, setOverrideMode] = useState(false);
  const [passportError, setPassportError] = useState(false);
  const [customFee, setCustomFee] = useState(app.course_fee ?? '');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user?.role;
  const token = localStorage.getItem('token');

  const resolveFileUrl = (filePath, passport = false) => {
    if (!filePath) return null;
    if (filePath.startsWith('http')) {
      return passport
        ? filePath.replace('/upload/', '/upload/w_500,h_620,c_fill,g_face,z_0.7,q_auto,f_auto/')
        : filePath;
    }
    const normalized = filePath.replace(/\\/g, '/');
    const pathWithUploads = normalized.startsWith('uploads/') ? normalized : `uploads/${normalized.replace(/^\/+/, '')}`;
    return `${API_BASE_URL}/${pathWithUploads}?token=${token}`;
  };

  const passportSrc = useMemo(() => resolveFileUrl(app.passport_url, true), [app.passport_url, token]);
  const certificateSrc = useMemo(() => resolveFileUrl(app.certificate_url, false), [app.certificate_url, token]);

  const fullName = `${app.surname || ''} ${app.other_names || ''}`.trim() || 'Unnamed Applicant';
  const initials = `${app.surname?.[0] || ''}${app.other_names?.[0] || ''}`.toUpperCase() || 'AP';
  const showDecisionForm = !readOnly && (app.admission_status === 'Pending' || overrideMode);

  const submitDecision = async (status) => {
    const requiresRemarks = status === 'Rejected' || status === 'Deferred';
    if (requiresRemarks && !remarks.trim()) {
      popup.warning(`Please provide a reason in the remarks for ${status} status.`, { title: 'Remarks Required' });
      return;
    }

    setSubmitting(true);
    try {
      await api.put(
        `/api/applications/${app.id}/status`,
        {
          status,
          remarks: remarks.trim(),
          course_fee: customFee === '' || customFee === null ? null : Number(customFee),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      popup.success(`Application ${status} successfully.`, { title: 'Decision Saved' });
      setOverrideMode(false);
      refresh();
      onClose();
    } catch (err) {
      console.error('Decision Error:', err);
      popup.error(err?.response?.data?.error || 'Action failed. Please check your network or server logs.', { title: 'Decision Failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
      <main className="flex h-[94vh] w-full max-w-[1320px] flex-col overflow-hidden rounded-[36px] border border-sky-100/90 bg-[radial-gradient(circle_at_top_left,rgba(32,149,211,0.14),transparent_34%),linear-gradient(180deg,#f8fcff_0%,#eef7fd_100%)] shadow-[0_36px_90px_rgba(12,38,77,0.34)]">
        <header className="flex items-start justify-between border-b border-sky-100 bg-[linear-gradient(180deg,rgba(248,252,255,0.96),rgba(240,248,253,0.82))] px-8 py-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2095D3] text-2xl font-black tracking-tight text-white">{initials}</div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-[#191839]">{fullName}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${statusTone(app.admission_status)}`}>{app.admission_status || 'Pending Review'}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">App ID: {app.id || DASH}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sky-100 bg-white text-slate-400 transition hover:border-sky-200 hover:text-slate-700">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <section className="w-[70%] overflow-y-auto p-6 pb-24">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-4">
                <div className={cardShell + ' p-4 h-full'}>
                  <div className="overflow-hidden rounded-2xl border border-sky-100 bg-slate-100">
                    {passportSrc && !passportError ? (
                      <img src={passportSrc} alt="Applicant passport" className="h-[320px] w-full object-cover" onError={() => setPassportError(true)} />
                    ) : (
                      <div className="flex h-[320px] items-center justify-center text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-400">No photo uploaded</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-8">
                <section className={cardShell}>
                  <p className={sectionTitle}>Identity and Course</p>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <DataField label="Surname" value={app.surname} />
                    <DataField label="Other Names" value={app.other_names} />
                    <DataField label="Course" value={app.course_name} highlight />
                    <DataField label="Date of Birth" value={formatDate(app.dob)} />
                    <DataField label="Sex" value={app.sex} />
                    <DataField label="Place of Birth" value={app.place_of_birth} />
                    <DataField label="Nationality" value={app.nationality} />
                    <DataField label="State of Origin" value={app.state_of_origin} />
                    <DataField label="Organization / Position" value={app.org_pos || 'N/A'} />
                  </div>
                </section>
              </div>

              <div className="col-span-12">
                <section className={cardShell}>
                  <p className={sectionTitle}>Contact and Emergency</p>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <DataField label="Email" value={app.email} highlight />
                    <DataField label="Primary Phone" value={app.phone} />
                    <DataField label="Residential Address" value={app.address} />
                    <DataField label="Next of Kin" value={app.nok_name} />
                    <DataField label="NOK Relationship" value={app.nok_relation} />
                    <DataField label="NOK Phone" value={app.nok_phone} />
                  </div>
                </section>
              </div>

              <div className="col-span-12">
                <section className={cardShell}>
                  <p className={sectionTitle}>Education and Background</p>
                  <div className="space-y-3">
                    <LongBlock label="Education" value={app.education} />
                    <LongBlock label="Technical Training" value={app.technical} />
                    <LongBlock label="Qualifications" value={app.qualifications} />
                    <LongBlock label="Aviation Experience" value={app.experience} />
                  </div>
                </section>
              </div>

              <div className="col-span-12">
                <section className={cardShell}>
                  <p className={sectionTitle}>Attached Documents</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <a href={certificateSrc || '#'} target="_blank" rel="noreferrer" className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${certificateSrc ? 'border-sky-100 bg-slate-50 text-slate-700 hover:bg-sky-50' : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400'}`}>
                      <span className="inline-flex items-center gap-2"><FileText size={16} className="text-[#2095D3]" /> Certificates (PDF)</span>
                      <ExternalLink size={14} className="text-slate-400" />
                    </a>
                  </div>
                </section>
              </div>
            </div>
          </section>

          <aside className="w-[30%] border-l border-sky-100 bg-white/90">
            <div className="flex h-full flex-col gap-6 p-6">
              <div>
                <h3 className="text-xl font-black tracking-tight text-[#191839]">Review and Decision</h3>
                <p className="mt-1 text-sm text-slate-500">Update application status, remarks, and fee (manager override).</p>
              </div>

              <div className="flex-1 space-y-5">
                {showDecisionForm ? (
                  <>
                    {userRole === 'Manager' && (
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#45A1D6]">Override Tuition Fee (NGN)</label>
                        <input
                          type="number"
                          value={customFee}
                          onChange={(e) => setCustomFee(e.target.value)}
                          className="w-full rounded-xl border border-sky-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#2095D3]"
                          placeholder="Leave blank for default course fee"
                        />
                        <p className="mt-2 text-[11px] text-slate-400">If left empty, default course fee is used on approval.</p>
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Reviewer Remarks</label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="h-40 w-full resize-none rounded-xl border border-sky-100 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#2095D3]"
                        placeholder="Add decision notes. Remarks are required for Deferred/Rejected."
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-3 rounded-2xl border border-sky-100 bg-slate-50 p-4">
                    <p className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${statusTone(app.admission_status)}`}>{app.admission_status || 'Pending'}</p>
                    {app.admission_status === 'Approved' && (
                      <p className="text-sm font-bold text-[#2095D3]">Assigned Fee: NGN {Number(app.course_fee || 0).toLocaleString()}</p>
                    )}
                    <p className="text-sm italic text-slate-600">"{app.instructor_remarks || 'No remarks provided.'}"</p>
                    {app.reviewed_at && <p className="text-[11px] font-semibold text-slate-400">Reviewed: {formatDate(app.reviewed_at)}</p>}
                    {!readOnly && userRole === 'Manager' && (
                      <button onClick={() => setOverrideMode(true)} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-100 bg-white px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#2095D3] transition hover:border-sky-200 hover:bg-sky-50">
                        <RotateCcw size={14} /> Change Decision / Fee
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-sky-100 pt-5">
                {showDecisionForm ? (
                  <div className="space-y-2">
                    <button onClick={() => submitDecision('Approved')} disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2095D3] px-4 py-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(32,149,211,0.22)] transition hover:bg-[#1A7BB1] disabled:opacity-60"><Check size={16} /> Approve</button>
                    <button onClick={() => submitDecision('Deferred')} disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"><Clock size={14} /> Defer</button>
                    <button onClick={() => submitDecision('Rejected')} disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"><XCircle size={14} /> Reject</button>
                  </div>
                ) : (
                  <div className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    {readOnly ? <UserRound size={14} /> : <ShieldCheck size={14} />} {readOnly ? 'Read Only View' : 'Decision Finalized'}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ReviewModal;

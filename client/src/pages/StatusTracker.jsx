import React, { useState } from 'react';
import api from '../lib/api';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plane, CheckCircle2, Circle, Loader2, AlertCircle, XCircle, Clock } from 'lucide-react';

const StatusTracker = () => {
  const [identifier, setIdentifier] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus(null);

    try {
      const res = await api.get(`/api/applications/track/${identifier}`);
      setStatus(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not find application.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: 'Applied', key: 'Pending' },
    { label: 'Under Review', key: 'Reviewing' },
    { label: 'Admission Granted', key: 'Approved' },
    { label: 'Enrolled', key: 'Enrolled' }
  ];

  const getStepIndex = (currentStatus) => {
    return steps.findIndex(s => s.key === currentStatus);
  };

  // Helper to check if the application is "stuck" or "stopped"
  const isTerminalState = status && ['Rejected', 'Deferred'].includes(status.admission_status);

  return (
    <div className="min-h-screen bg-[#F4FAFF] px-4 py-16 sm:px-6">
      <div className="max-w-xl mx-auto">
        <div className="mb-10 text-center">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#BDE3F6] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#45A1D6] shadow-sm"
          >
            Aeroconsult Ltd.
          </Link>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#2095D3] shadow-[0_18px_40px_rgba(32,149,211,0.24)]">
            <Plane className="text-white" size={30} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1D3557] sm:text-4xl">
            Track Your Application
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Enter your email address or application ID to review the latest admissions status.
          </p>
        </div>

        <form
          onSubmit={handleTrack}
          className="relative mb-8 rounded-[28px] border border-[#D6EAF7] bg-white p-3 shadow-[0_24px_70px_rgba(29,53,87,0.08)]"
        >
          <input 
            type="text" required
            placeholder="e.g. name@example.com"
            className="w-full rounded-[20px] border border-transparent bg-[#F7FBFF] px-5 py-5 pr-32 text-base font-medium text-[#1D3557] outline-none transition-all placeholder:text-slate-400 focus:border-[#BDE3F6] focus:bg-white focus:ring-0"
            value={identifier} onChange={(e) => setIdentifier(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute bottom-3 right-3 top-3 inline-flex items-center justify-center rounded-[18px] bg-[#2095D3] px-6 text-white transition-colors hover:bg-[#1A7BB1] disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
          </button>
        </form>

        {error && (
          <div className="mb-6 flex items-center space-x-3 rounded-[22px] border border-red-100 bg-red-50 p-4 text-red-600">
            <AlertCircle size={20} />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {status && (
          <div className="animate-in fade-in zoom-in duration-300 rounded-[32px] border border-[#D6EAF7] bg-white p-8 shadow-[0_24px_70px_rgba(29,53,87,0.08)]">
            <div className="mb-10 flex items-start justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-[#1D3557]">
                  Hi, {status.surname}
                </h2>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#45A1D6]">
                  {status.course_name}
                </p>
              </div>
              <div className="rounded-[20px] bg-[#F7FBFF] px-4 py-3 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Current Status
                </p>
                <p className={`mt-2 text-lg font-semibold ${
                  status.admission_status === 'Rejected' ? 'text-red-500' : 
                  status.admission_status === 'Deferred' ? 'text-amber-500' : 'text-slate-800'
                }`}>
                  {status.admission_status}
                </p>
              </div>
            </div>

            {/* CONDITIONAL UI: If Rejected/Deferred, show a specialized card instead of the full stepper */}
            {isTerminalState ? (
              <div className={`rounded-[28px] border-2 border-dashed p-6 ${
                status.admission_status === 'Rejected' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="mb-4 flex items-center gap-4">
                  {status.admission_status === 'Rejected' ? 
                    <XCircle className="text-red-500" size={32} /> : 
                    <Clock className="text-amber-500" size={32} />
                  }
                  <h3 className="text-lg font-semibold text-[#1D3557]">Notice Regarding Admission</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed italic">
                  "{status.instructor_remarks || 'No specific remarks provided at this time.'}"
                </p>
                <div className="mt-6 pt-6 border-t border-slate-200">
                   <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Next Steps</p>
                   <p className="text-xs text-slate-500 mt-1">
                     {status.admission_status === 'Rejected' 
                       ? "You may contact the admissions office for further clarification or re-apply in the next session."
                       : "Your application is on hold for a future batch. We will notify you once a slot becomes available."}
                   </p>
                </div>
              </div>
            ) : (
              /* Standard Stepper for Pending, Reviewing, Approved, Enrolled */
              <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-[#D6EAF7]">
                {steps.map((step, index) => {
                  const isCompleted = getStepIndex(status.admission_status) >= index;
                  const isCurrent = status.admission_status === step.key;

                  return (
                    <div key={index} className="relative flex items-center space-x-6">
                      <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 ${
                        isCompleted ? 'bg-[#2095D3] border-[#EAF7FF] text-white' : 'bg-white border-[#EEF6FB] text-slate-300'
                      }`}>
                        {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${isCompleted ? 'text-[#1D3557]' : 'text-slate-300'}`}>{step.label}</p>
                        {isCurrent && <p className="text-xs font-semibold text-[#2095D3]">Your application is currently here</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action button for Approved students */}
            {status.admission_status === 'Approved' && (
              <div className="mt-10 rounded-[28px] border border-[#BDE3F6] bg-[#EAF7FF] p-6 text-center">
                <p className="mb-4 text-sm font-semibold text-[#1A7BB1]">
                  Congratulations! You are cleared for admission.
                </p>
                <button 
                  onClick={() => navigate('/login')}
                  className="w-full rounded-full bg-[#2095D3] py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#1A7BB1]"
                >
                  Log in to Pay Tuition
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusTracker;

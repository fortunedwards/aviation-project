import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  FileText,
  MapPin,
  MessageSquareMore,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import api from '../lib/api';
import { openSquadPaymentModal } from '../lib/squadco';
import ChatWidget from '../components/ChatWidget';
import SideNavBar from '../components/SideNavBar';
import TopNavBar from '../components/TopNavBar';
import CalendarPage from './CalendarPage';
import { usePopup } from '../components/context/PopupProvider';

const formatCurrency = (value) =>
  '₦' + Number(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 });

const formatDate = (value, options = { day: 'numeric', month: 'long', year: 'numeric' }) => {
  if (!value) return 'To be confirmed';
  const date = new Date(String(value).slice(0, 10) + 'T00:00:00');
  return Number.isNaN(date.getTime()) ? 'To be confirmed' : date.toLocaleDateString('en-NG', options);
};

const statusStyle = (status) => {
  const value = String(status || 'pending').toLowerCase();
  if (['approved', 'enrolled'].includes(value)) return 'bg-emerald-100 text-emerald-700';
  if (['rejected', 'declined'].includes(value)) return 'bg-rose-100 text-rose-700';
  return 'bg-sky-100 text-sky-700';
};

const getDisplayName = (profile) =>
  [profile?.surname, profile?.other_names].filter(Boolean).join(' ').trim() || 'Student';

const InfoCard = ({ icon: Icon, label, value, tone = 'sky' }) => (
  <article className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
      tone === 'emerald' ? 'bg-emerald-50 text-emerald-600' : tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-[#2095D3]'
    }`}><Icon size={21} /></div>
    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
    <p className="mt-2 text-lg font-black text-[#2B2A4C]">{value}</p>
  </article>
);

const StudentPortal = ({ setUser }) => {
  const popup = usePopup();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [paymentStarting, setPaymentStarting] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  }, []);

  const loadProfile = async () => {
    setError('');
    try {
      const response = await api.get('/api/students/profile', { headers: { Authorization: 'Bearer ' + token } });
      setProfile(response.data?.data || null);
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Unable to load your student records.';
      setError(message);
      if ([401, 403].includes(err.response?.status)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleLogout = async () => {
    try {
      if (token) await api.post('/api/auth/logout', {}, { headers: { Authorization: 'Bearer ' + token } });
    } catch (err) {
      console.error('Student logout audit error:', err.message);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login');
    }
  };

  const handlePayment = async () => {
    if (Number(profile?.course_fee || 0) <= 0) {
      popup.warning('Your tuition fee has not been assigned yet. Please contact the admissions office.', { title: 'Tuition Fee Unavailable' });
      return;
    }
    setPaymentStarting(true);
    try {
      const response = await api.post('/api/payments/initialize', {}, { headers: { Authorization: 'Bearer ' + token } });
      const reference = response.data?.reference;
      if (!reference) throw new Error('The payment service did not return a payment reference.');
      await openSquadPaymentModal({
        email: profile.email,
        amount: Number(profile.course_fee),
        reference,
        customerName: getDisplayName(profile),
        onSuccess: () => navigate('/payment-success?transaction_ref=' + encodeURIComponent(reference)),
        onClose: () => popup.info('Payment was not completed. You can return and try again when ready.', { title: 'Payment Cancelled' }),
      });
    } catch (err) {
      popup.error(err.response?.data?.error || err.message || 'Unable to start tuition payment.', { title: 'Payment Could Not Start' });
    } finally {
      setPaymentStarting(false);
    }
  };

  const paymentPaid = String(profile?.payment_status || '').toLowerCase() === 'paid';
  const admissionStatus = profile?.admission_status || 'Pending';

  if (loading) {
    return <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4FAFF]"><div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2095D3] border-t-transparent" /><p className="mt-5 text-xs font-black uppercase tracking-[0.25em] text-slate-500">Loading your learning dashboard</p></div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F4FAFF] text-[#2B2A4C]">
      <SideNavBar role="Student" activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      <TopNavBar role="Student" userName={getDisplayName(profile)} notificationCount={profile?.instructor_remarks ? 1 : 0} onNotificationsClick={() => setActiveTab('dashboard')} />

      <main className="min-w-0 flex-1 px-6 pb-10 pt-24 md:px-10 md:pt-28">
        {error && <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700"><AlertCircle size={19} />{error}</div>}

        {activeTab === 'calendar' && <CalendarPage title="My Training Calendar" subtitle="View your scheduled course dates and important academy events." />}

        {activeTab === 'dashboard' && (
          <div className="mx-auto max-w-7xl">
            <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div><p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#2095D3]">Student Learning Portal</p><h1 className="mt-2 text-3xl font-black tracking-tight text-[#2B2A4C] sm:text-4xl">Welcome back, {profile?.surname || 'Student'}.</h1><p className="mt-2 text-sm text-slate-500">Here is your admission, course, and payment overview.</p></div>
              <span className={`inline-flex w-fit rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] ${statusStyle(admissionStatus)}`}>{admissionStatus} admission</span>
            </header>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard icon={BookOpen} label="My Course" value={profile?.course_name || 'Not assigned'} />
              <InfoCard icon={CircleDollarSign} label="Tuition" value={formatCurrency(profile?.course_fee)} tone="amber" />
              <InfoCard icon={paymentPaid ? CheckCircle2 : Wallet} label="Payment" value={paymentPaid ? 'Paid' : 'Outstanding'} tone={paymentPaid ? 'emerald' : 'amber'} />
              <InfoCard icon={CalendarDays} label="Next Training" value={formatDate(profile?.next_event_date, { day: 'numeric', month: 'short', year: 'numeric' })} />
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-3">
              <section className="xl:col-span-2 rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm sm:p-9">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2095D3]">Programme dossier</p><h2 className="mt-3 text-2xl font-black text-[#2B2A4C]">{profile?.course_name || 'Your training programme'}</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{profile?.course_description || 'Your course information will appear here once it is assigned.'}</p></div><BookOpen className="h-10 w-10 shrink-0 text-[#2095D3]" /></div>
                <div className="mt-8 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
                  <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duration</p><p className="mt-2 text-sm font-bold text-slate-700">{profile?.course_duration || 'To be confirmed'}</p></div>
                  <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Application ID</p><p className="mt-2 break-all text-sm font-bold text-slate-700">{profile?.application_id || '—'}</p></div>
                  <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Submitted</p><p className="mt-2 text-sm font-bold text-slate-700">{formatDate(profile?.submitted_at)}</p></div>
                </div>
              </section>

              <section className="rounded-[30px] bg-[#2B2A4C] p-7 text-white shadow-xl shadow-slate-300/40">
                <div className="flex items-center gap-3 text-[#99D2F2]"><Wallet size={23} /><p className="text-[10px] font-black uppercase tracking-[0.2em]">Financial clearance</p></div>
                <p className="mt-7 text-4xl font-black">{paymentPaid ? 'Cleared' : formatCurrency(profile?.course_fee)}</p>
                <p className="mt-2 text-sm leading-6 text-white/70">{paymentPaid ? 'Your tuition payment has been recorded.' : 'Complete your tuition payment to secure your training place.'}</p>
                {!paymentPaid && <button type="button" onClick={handlePayment} disabled={paymentStarting} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2095D3] px-5 py-4 text-sm font-black transition hover:bg-[#1785be] disabled:cursor-not-allowed disabled:opacity-60">{paymentStarting ? 'Opening payment…' : 'Pay Tuition'}<ArrowRight size={17} /></button>}
              </section>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <section className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm"><div className="flex items-center gap-3"><CalendarDays className="text-[#2095D3]" /><h2 className="text-lg font-black">Upcoming course date</h2></div>{profile?.next_event_date ? <div className="mt-6 rounded-2xl bg-sky-50 p-5"><p className="text-xl font-black text-[#2B2A4C]">{formatDate(profile.next_event_date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p><p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><Clock3 size={15} />{profile.next_event_start_time || 'Time to be confirmed'}{profile.next_event_end_time ? ' – ' + profile.next_event_end_time : ''}</p>{profile.next_event_location && <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><MapPin size={15} />{profile.next_event_location}</p>}</div> : <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-500">There is no scheduled course date yet. You will see it here when the academy adds one to the training calendar.</p>}</section>
              <section className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm"><div className="flex items-center gap-3"><MessageSquareMore className="text-[#2095D3]" /><h2 className="text-lg font-black">Admissions update</h2></div><p className="mt-6 rounded-2xl bg-sky-50 p-5 text-sm leading-7 text-slate-700">{profile?.instructor_remarks || 'Your application is being reviewed. We will share an update here when the admissions team adds remarks.'}</p><p className="mt-4 text-xs leading-5 text-slate-500">Need assistance? Use the support chat button at the bottom-right of this page.</p></section>
            </div>
          </div>
        )}

        {activeTab === 'finance' && <section className="mx-auto max-w-5xl"><header className="mb-8"><p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#2095D3]">Finance</p><h1 className="mt-2 text-3xl font-black">Payments & receipts</h1></header><div className="grid gap-6 md:grid-cols-2"><article className="rounded-[30px] bg-[#2B2A4C] p-8 text-white"><ReceiptText className="text-[#99D2F2]" size={28} /><p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Tuition payment status</p><p className="mt-2 text-3xl font-black">{paymentPaid ? 'Paid' : 'Payment due'}</p><p className="mt-4 text-sm text-white/70">Course tuition: {formatCurrency(profile?.course_fee)}</p>{profile?.payment_ref && <p className="mt-2 break-all text-xs text-white/50">Reference: {profile.payment_ref}</p>}{!paymentPaid && <button type="button" onClick={handlePayment} disabled={paymentStarting} className="mt-7 rounded-2xl bg-[#2095D3] px-6 py-4 text-sm font-black disabled:opacity-60">{paymentStarting ? 'Opening payment…' : 'Pay securely with SquadCo'}</button>}</article><article className="rounded-[30px] border border-slate-100 bg-white p-8 shadow-sm"><ShieldCheck className="text-emerald-600" size={28} /><h2 className="mt-6 text-xl font-black">Payment safety</h2><p className="mt-3 text-sm leading-7 text-slate-600">Payments are processed by SquadCo. A confirmed payment updates your portal automatically. If a debit occurs but the status does not update, contact support with the payment reference above.</p></article></div></section>}

        {activeTab === 'documents' && <section className="mx-auto max-w-5xl"><header className="mb-8"><p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#2095D3]">Documents</p><h1 className="mt-2 text-3xl font-black">My application documents</h1><p className="mt-2 text-sm text-slate-500">View the files submitted with your application.</p></header><div className="grid gap-6 md:grid-cols-2">{[{ title: 'Passport photograph', url: profile?.passport_url, icon: FileText }, { title: 'Supporting certificate', url: profile?.certificate_url, icon: Download }].map(({ title, url, icon: Icon }) => <article key={title} className="rounded-[30px] border border-slate-100 bg-white p-7 shadow-sm"><Icon className="text-[#2095D3]" size={28} /><h2 className="mt-5 text-xl font-black">{title}</h2><p className="mt-2 text-sm text-slate-500">{url ? 'Your submitted document is available to view.' : 'No document was submitted for this item.'}</p>{url && <a href={url} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2095D3] px-5 py-3 text-sm font-bold text-white">Open document <ArrowRight size={16} /></a>}</article>)}</div></section>}
      </main>
      <ChatWidget user={{ ...user, ...profile, id: profile?.student_user_id || user?.id }} />
    </div>
  );
};

export default StudentPortal;

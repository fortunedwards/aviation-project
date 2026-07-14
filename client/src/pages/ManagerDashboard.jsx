import React, { useEffect, useState, useMemo } from 'react';
import api from '../lib/api';
import {
  Activity,
  CalendarDays,
  LineChart,
  RefreshCw,
  Shield,
  TrendingUp,
} from 'lucide-react';
import CalendarPage from './CalendarPage';
import StaffManagement from './StaffManagement';
import AdmissionsWorkspace from '../components/AdmissionsWorkspace';
import AuditTrailsPanel from './AuditTrailsPanel';
import ReviewModal from '../components/ReviewModal';
import SideNavBar from '../components/SideNavBar';
import TopNavBar from '../components/TopNavBar';

const registryGradient =
  'bg-[radial-gradient(circle_at_top_left,rgba(32,149,211,0.16),transparent_32%),linear-gradient(180deg,#f8fcff_0%,#eef7fd_100%)]';

const getUserDisplayName = (user) =>
  user?.name ||
  user?.full_name ||
  [user?.surname, user?.other_names].filter(Boolean).join(' ').trim() ||
  [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
  'Manager';

const formatActionType = (value) =>
  String(value || 'Unknown action')
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatTimestamp = (value) => {
  if (!value) return 'Unknown time';
  return new Date(value).toLocaleString();
};

const dateKeyFromValue = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const ManagerOverviewDashboard = ({ applications, logs, events }) => {
  const totalApplications = applications.length;
  const approvedCount = applications.filter((app) => ['Approved', 'Enrolled'].includes(app.admission_status)).length;
  const pendingCount = applications.filter((app) => app.admission_status === 'Pending').length;
  const rejectedCount = applications.filter((app) => app.admission_status === 'Rejected').length;
  const approvalRate = totalApplications > 0 ? Math.round((approvedCount / totalApplications) * 100) : 0;

  const upcomingEvents = useMemo(() => {
    const todayKey = dateKeyFromValue(new Date());
    return [...events]
      .filter((event) => (todayKey ? event.event_date >= todayKey : true))
      .sort((a, b) => new Date(`${a.event_date}T${a.start_time || '00:00'}`) - new Date(`${b.event_date}T${b.start_time || '00:00'}`))
      .slice(0, 5);
  }, [events]);

  const miniCalendarMeta = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const leading = firstDay.getDay();
    const days = lastDay.getDate();
    const cells = [];
    for (let i = 0; i < leading; i += 1) cells.push(null);
    for (let day = 1; day <= days; day += 1) cells.push(new Date(now.getFullYear(), now.getMonth(), day));
    while (cells.length % 7 !== 0) cells.push(null);
    return { cells, monthLabel: firstDay.toLocaleString('en-US', { month: 'long', year: 'numeric' }), todayKey: dateKeyFromValue(now) };
  }, []);

  const eventByDate = useMemo(() => {
    return events.reduce((acc, event) => {
      if (!acc[event.event_date]) acc[event.event_date] = [];
      acc[event.event_date].push(event);
      return acc;
    }, {});
  }, [events]);

  const monthlyIntake = Array.from({ length: 6 }, (_, index) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - index));
    const monthLabel = d.toLocaleString('en-US', { month: 'short' });
    const count = applications.filter((app) => {
      if (!app.created_at) return false;
      const created = new Date(app.created_at);
      return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth();
    }).length;
    return { monthLabel, count };
  });

  const maxIntake = Math.max(...monthlyIntake.map((item) => item.count), 1);
  const recentAudit = logs.slice(0, 5);

  const kpis = [
    { label: 'Total Applications', value: totalApplications, tone: 'text-[#2B2A4C]', icon: LineChart },
    { label: 'Approval Rate', value: `${approvalRate}%`, tone: 'text-emerald-600', icon: TrendingUp },
    { label: 'Pending Reviews', value: pendingCount, tone: 'text-amber-600', icon: Activity },
    { label: 'Rejected Cases', value: rejectedCount, tone: 'text-rose-600', icon: Shield },
  ];

  return (
    <div className={`w-full ${registryGradient} rounded-[36px] p-4 sm:p-6 lg:p-8`}>
      <div className="mx-auto max-w-[1500px] space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#45A1D6]">Accountable Manager Dashboard</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-[#191839] sm:text-5xl">Operations Overview</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Real-time admissions performance, approval health, and scheduling visibility.
            </p>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map(({ label, value, tone, icon: Icon }) => (
            <article key={label} className="rounded-[24px] border border-sky-100/90 bg-white p-5 shadow-[0_20px_40px_rgba(24,56,88,0.06)]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <span className="rounded-xl bg-sky-50 p-2 text-[#2095D3]"><Icon size={16} /></span>
              </div>
              <p className={`mt-4 text-4xl font-black tracking-tight ${tone}`}>{value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-[32px] border border-sky-100/90 bg-white p-6 shadow-[0_28px_70px_rgba(24,56,88,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#45A1D6]">Admission Intake (6 Months)</p>
            <div className="mt-6 grid grid-cols-6 items-end gap-3">
              {monthlyIntake.map((item) => (
                <div key={item.monthLabel} className="flex flex-col items-center gap-2">
                  <div className="flex h-44 w-full items-end rounded-2xl bg-slate-50 p-2">
                    <div
                      className="w-full rounded-xl bg-[#2095D3]"
                      style={{ height: `${Math.max(10, (item.count / maxIntake) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs font-bold text-slate-500">{item.monthLabel}</p>
                  <p className="text-xs font-semibold text-slate-800">{item.count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-sky-100/90 bg-white p-6 shadow-[0_28px_70px_rgba(24,56,88,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#45A1D6]">Upcoming Events</p>
            <div className="mt-5 space-y-4">
              {upcomingEvents.length === 0 && <p className="text-sm text-slate-500">No upcoming events yet.</p>}
              {upcomingEvents.map((event) => (
                <article key={event.id} className="rounded-2xl border border-sky-100 bg-slate-50/70 p-4">
                  <p className="text-sm font-bold text-slate-800">{event.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {event.start_time ? ` · ${event.start_time}` : ' · All day'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{event.location || 'Location not specified'}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-[32px] border border-sky-100/90 bg-white p-6 shadow-[0_28px_70px_rgba(24,56,88,0.08)]">
            <div className="flex items-center gap-3">
              <CalendarDays className="text-[#2095D3]" size={18} />
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#45A1D6]">Interactive Scheduling Wing</p>
            </div>
            <p className="mt-3 text-sm text-slate-500">Current month view with event markers from the calendar database.</p>
            <div className="mt-4 rounded-2xl border border-sky-100 bg-slate-50 p-3">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{miniCalendarMeta.monthLabel}</p>
              <div className="grid grid-cols-7 gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                  <p key={day} className="text-center text-[10px] font-bold text-slate-400">{day}</p>
                ))}
                {miniCalendarMeta.cells.map((dayDate, idx) => {
                  if (!dayDate) return <div key={`empty-${idx}`} className="h-10 rounded-lg bg-white/60" />;
                  const key = dateKeyFromValue(dayDate);
                  const hasEvent = key && eventByDate[key]?.length > 0;
                  const isToday = key === miniCalendarMeta.todayKey;
                  return (
                    <div key={key} className={`relative h-10 rounded-lg border text-center text-xs font-semibold leading-10 ${isToday ? 'border-[#2095D3] bg-sky-100 text-[#2095D3]' : 'border-slate-100 bg-white text-slate-700'}`}>
                      {dayDate.getDate()}
                      {hasEvent && <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#2095D3]" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-sky-100/90 bg-white p-6 shadow-[0_28px_70px_rgba(24,56,88,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#45A1D6]">Latest Audit Signals</p>
            <div className="mt-4 space-y-3">
              {recentAudit.length === 0 && <p className="text-sm text-slate-500">No audit events available.</p>}
              {recentAudit.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">{formatActionType(log.action_type)}</p>
                  <p className="mt-1 text-xs text-slate-500">{log.description || 'No description'}</p>
                  <p className="mt-2 text-[11px] font-semibold text-slate-400">{formatTimestamp(log.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const ManagerDashboard = ({ logout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const userString = localStorage.getItem('user');
  const managerUser = userString ? JSON.parse(userString) : null;
  const managerName = getUserDisplayName(managerUser);

  const fetchAllData = async () => {
    setApplicationsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [appRes, logRes, eventRes] = await Promise.allSettled([
        api.get('/api/applications/all', { headers }),
        api.get('/api/staff/audit-logs', { headers }),
        api.get('/api/calendar/events?upcomingOnly=true&limit=50', { headers })
      ]);

      if (appRes.status === 'fulfilled') setData(appRes.value.data.data || []);
      if (logRes.status === 'fulfilled') setLogs(logRes.value.data.data || []);
      if (eventRes.status === 'fulfilled') setEvents(eventRes.value.data.data || []);
      
    } catch (err) {
      console.error("Error fetching manager data", err);
    } finally {
      setApplicationsLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);


  return (
    <div className="flex min-h-screen bg-slate-50">
      <SideNavBar role="Manager" activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout} />
      <TopNavBar role="Manager" userName={managerName} />

      <div className="min-w-0 flex-1 px-6 pb-6 pt-24 md:px-8 md:pb-8 md:pt-28">
        <div className="w-full">
        {activeTab === 'dashboard' && <ManagerOverviewDashboard applications={data} logs={logs} events={events} />}

        {activeTab === 'applications' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={fetchAllData}
                disabled={applicationsLoading}
                className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:bg-sky-50 hover:text-[#2095D3] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={14} className={applicationsLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
            <AdmissionsWorkspace
              applications={data}
              title="Admissions"
              subtitle="Review applicant details, course selection, submission date, and progression status from one registry-style admissions workspace."
              showCourseFilter
              onReview={setSelectedApp}
              reviewLabel="Review"
              className={applicationsLoading ? 'opacity-70 pointer-events-none' : ''}
            />
          </div>
        )}

        {activeTab === 'logs' && <AuditTrailsPanel logs={logs} />}
        {activeTab === 'staff' && <StaffManagement />}
        {activeTab === 'calendar' && <CalendarPage />}
        </div>
      </div>

      {selectedApp && (
        <ReviewModal 
          app={selectedApp} 
          onClose={() => setSelectedApp(null)} 
          refresh={fetchAllData} 
        />
      )}
    </div>
  );
};

export default ManagerDashboard;



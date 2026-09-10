import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, MapPin } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import PublicSupportChat from '../components/PublicSupportChat';
import api from '../lib/api';

const CATEGORY_TONES = {
  Course: 'bg-sky-50 text-sky-700 ring-sky-100',
  Holiday: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  Meeting: 'bg-amber-50 text-amber-700 ring-amber-100',
  Exam: 'bg-rose-50 text-rose-700 ring-rose-100',
  Operations: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
};

const formatTime = (event) => {
  if (event.is_all_day) return 'All day';
  if (!event.start_time) return 'Time to be confirmed';
  return event.end_time ? `${event.start_time} – ${event.end_time}` : event.start_time;
};

export default function PublicTrainingCalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get('/api/calendar/public/events')
      .then((response) => setEvents(Array.isArray(response.data?.data) ? response.data.data : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const groupedEvents = useMemo(() => events.reduce((groups, event) => {
    const key = new Date(`${event.event_date}T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
    return groups;
  }, {}), [events]);

  return (
    <div className="min-h-screen bg-white text-[#2B2A4C]">
      <PublicHeader />
      <section className="relative overflow-hidden bg-[#2B2A4C] px-6 pb-16 pt-32 sm:pt-40 lg:px-12">
        <div className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#2095D3]/20 blur-3xl" />
        <div className="container-max relative z-10 mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#99D2F2]">Plan your training</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-6xl">Training Calendar</h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">Explore upcoming training programs, operational events, and important academy dates.</p>
        </div>
      </section>

      <main className="container-max px-6 py-14 lg:px-12">
        {loading && <p className="py-16 text-center text-slate-500">Loading upcoming events…</p>}
        {error && <p className="rounded-2xl bg-rose-50 p-5 text-center text-sm text-rose-700">The training calendar is temporarily unavailable. Please try again shortly.</p>}
        {!loading && !error && events.length === 0 && <p className="rounded-2xl bg-slate-50 p-12 text-center text-slate-500">No upcoming training events are scheduled at the moment.</p>}
        {!loading && !error && Object.entries(groupedEvents).map(([month, monthEvents]) => (
          <section key={month} className="mb-12 last:mb-0">
            <div className="mb-5 flex items-center gap-3"><CalendarDays className="text-[#2095D3]" size={22} /><h2 className="text-2xl font-black text-[#2B2A4C]">{month}</h2></div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {monthEvents.map((event) => (
                <article key={event.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3"><p className="text-lg font-black text-[#2B2A4C]">{event.title}</p><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${CATEGORY_TONES[event.category] || 'bg-slate-50 text-slate-600 ring-slate-100'}`}>{event.category || 'Other'}</span></div>
                  <p className="mt-4 text-sm font-bold text-[#2095D3]">{new Date(`${event.event_date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-600"><p className="flex items-center gap-2"><Clock3 size={15} />{formatTime(event)}</p>{event.location && <p className="flex items-center gap-2"><MapPin size={15} />{event.location}</p>}</div>
                  {event.description && <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-500">{event.description}</p>}
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
      <PublicFooter />
      <PublicSupportChat />
    </div>
  );
}

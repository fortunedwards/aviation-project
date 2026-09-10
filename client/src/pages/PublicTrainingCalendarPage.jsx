import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

const eventDateKey = (value) => String(value || '').slice(0, 10);
const formatEventDate = (value, options) => new Date(`${eventDateKey(value)}T00:00:00`).toLocaleDateString('en-US', options);

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
    const key = formatEventDate(event.event_date, { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
    return groups;
  }, {}), [events]);

  return (
    <div className="min-h-screen bg-white text-[#2B2A4C]">
      <PublicHeader />
      <section className="relative overflow-hidden bg-[#2B2A4C] px-6 pb-16 pt-28 sm:pb-20 sm:pt-36 lg:px-12">
        <div className="pointer-events-none absolute -left-20 top-14 h-72 w-72 rounded-full bg-[#2095D3]/20 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-20 h-56 w-56 rotate-12 rounded-[36px] border border-white/10 bg-white/5" />
        <div className="pointer-events-none absolute bottom-6 right-24 h-40 w-40 rounded-full border border-[#45A1D6]/25" />
        <CalendarDays className="pointer-events-none absolute left-[12%] top-28 h-12 w-12 -rotate-12 text-[#45A1D6]/30 sm:h-16 sm:w-16" />
        <CalendarDays className="pointer-events-none absolute bottom-10 right-[14%] h-10 w-10 rotate-12 text-white/20 sm:h-14 sm:w-14" />
        <CalendarDays className="pointer-events-none absolute right-[30%] top-16 h-7 w-7 text-[#99D2F2]/35" />
        <div className="container-max relative z-10 mx-auto text-center">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Training Calendar</h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-white/80 sm:mt-5 sm:text-base md:text-lg">Explore upcoming training programs, operational events, and important academy dates.</p>
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
              {monthEvents.map((event) => {
                const cardContent = <>
                  <div className="flex items-start justify-between gap-3"><p className="text-lg font-black text-[#2B2A4C]">{event.title}</p><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${CATEGORY_TONES[event.category] || 'bg-slate-50 text-slate-600 ring-slate-100'}`}>{event.category || 'Other'}</span></div>
                  <p className="mt-4 text-sm font-bold text-[#2095D3]">{formatEventDate(event.event_date, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-600"><p className="flex items-center gap-2"><Clock3 size={15} />{formatTime(event)}</p>{event.location && <p className="flex items-center gap-2"><MapPin size={15} />{event.location}</p>}</div>
                  {event.description && <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-500">{event.description}</p>}
                </>;
                const classes = 'block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md';
                return event.course_slug
                  ? <Link key={event.id} to={`/courses/${event.course_slug}`} className={classes}>{cardContent}</Link>
                  : <article key={event.id} className={classes}>{cardContent}</article>;
              })}
            </div>
          </section>
        ))}
      </main>
      <PublicFooter />
      <PublicSupportChat />
    </div>
  );
}

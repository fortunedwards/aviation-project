import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import {
  CalendarDays,
  Clock3,
  Filter,
  MapPin,
  Plus,
  Search,
} from 'lucide-react';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CATEGORY_COLORS = {
  Course: 'bg-blue-100 text-blue-700 border-blue-200',
  Holiday: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Meeting: 'bg-amber-100 text-amber-700 border-amber-200',
  Exam: 'bg-rose-100 text-rose-700 border-rose-200',
  Operations: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  Other: 'bg-slate-100 text-slate-700 border-slate-200',
};

const pad = (value) => String(value).padStart(2, '0');
const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const formatEventTime = (event) => {
  if (event.is_all_day) return 'All day';
  if (!event.start_time && !event.end_time) return 'Time not specified';
  if (!event.end_time) return event.start_time;
  return `${event.start_time} - ${event.end_time}`;
};

const getCurrentRole = () => {
  try {
    const raw = localStorage.getItem('user');
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.role || 'Student';
  } catch {
    return 'Student';
  }
};

const CalendarPage = ({ title = 'Manage Schedule', subtitle = 'Track classes, reviews, and operational timelines.' }) => {
  const [cursor, setCursor] = useState(() => new Date());
  const [viewMode, setViewMode] = useState('month');
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState(['Course', 'Holiday', 'Meeting', 'Exam', 'Operations', 'Other']);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Course',
    event_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    is_all_day: false,
    location: '',
    description: '',
  });

  const role = getCurrentRole();
  const canManageEvents = role === 'Admin' || role === 'Manager';

  const token = localStorage.getItem('token');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/calendar/events', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data.data || []);
    } catch (err) {
      console.error('Failed to load calendar events', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/calendar/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data.data) && res.data.data.length > 0) {
        setCategories(res.data.data);
      }
    } catch {
      setCategories(['Course', 'Holiday', 'Meeting', 'Exam', 'Operations', 'Other']);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  const normalizedEvents = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        category: event.category || 'Other',
      })),
    [events]
  );

  const filteredEvents = useMemo(() => {
    return normalizedEvents.filter((event) => {
      const matchesCategory = categoryFilter === 'ALL' ? true : event.category === categoryFilter;
      const q = searchTerm.trim().toLowerCase();
      const haystack = `${event.title || ''} ${event.location || ''} ${event.description || ''}`.toLowerCase();
      const matchesSearch = q ? haystack.includes(q) : true;
      return matchesCategory && matchesSearch;
    });
  }, [normalizedEvents, categoryFilter, searchTerm]);

  const eventMap = useMemo(() => {
    return filteredEvents.reduce((acc, event) => {
      if (!acc[event.event_date]) acc[event.event_date] = [];
      acc[event.event_date].push(event);
      return acc;
    }, {});
  }, [filteredEvents]);

  const monthMeta = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leading = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const cells = [];
    for (let i = 0; i < leading; i += 1) cells.push(null);
    for (let day = 1; day <= totalDays; day += 1) cells.push(new Date(year, month, day));
    while (cells.length % 7 !== 0) cells.push(null);

    return {
      label: firstDay.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      todayKey: toDateKey(new Date()),
      cells,
    };
  }, [cursor]);

  const weekDates = useMemo(() => {
    const start = new Date(cursor);
    start.setDate(cursor.getDate() - cursor.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const dayKey = toDateKey(cursor);

  const upcomingEvents = useMemo(() => {
    const today = toDateKey(new Date());
    return [...filteredEvents]
      .filter((event) => event.event_date >= today)
      .sort((a, b) => {
        const ad = `${a.event_date}T${a.start_time || '00:00'}`;
        const bd = `${b.event_date}T${b.start_time || '00:00'}`;
        return new Date(ad) - new Date(bd);
      })
      .slice(0, 8);
  }, [filteredEvents]);

  const navigatePeriod = (delta) => {
    if (viewMode === 'month') {
      setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
      return;
    }
    if (viewMode === 'week') {
      setCursor((current) => {
        const next = new Date(current);
        next.setDate(current.getDate() + delta * 7);
        return next;
      });
      return;
    }
    setCursor((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + delta);
      return next;
    });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/calendar/events', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowCreate(false);
      setForm({
        title: '',
        category: 'Course',
        event_date: '',
        end_date: '',
        start_time: '',
        end_time: '',
        is_all_day: false,
        location: '',
        description: '',
      });
      fetchEvents();
    } catch (err) {
      console.error('Failed to create event', err);
    } finally {
      setCreating(false);
    }
  };

  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-px bg-sky-50 p-1">
      {WEEK_DAYS.map((day) => (
        <div key={day} className="bg-slate-100 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{day}</div>
      ))}
      {monthMeta.cells.map((dateValue, index) => {
        if (!dateValue) return <div key={`blank-${index}`} className="min-h-[120px] bg-white" />;

        const key = toDateKey(dateValue);
        const isToday = key === monthMeta.todayKey;
        const dayEvents = eventMap[key] || [];

        return (
          <div key={key} className="min-h-[120px] bg-white p-2">
            <p className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${isToday ? 'bg-[#2095D3] text-white' : 'text-slate-600'}`}>
              {dateValue.getDate()}
            </p>
            <div className="mt-2 space-y-1">
              {dayEvents.slice(0, 2).map((event) => (
                <p key={event.id} className={`truncate rounded-md border px-2 py-1 text-[10px] font-semibold ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other}`}>
                  {event.title}
                </p>
              ))}
              {dayEvents.length > 2 && <p className="text-[10px] font-semibold text-slate-500">+{dayEvents.length - 2} more</p>}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWeekView = () => (
    <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {weekDates.map((dateValue) => {
        const key = toDateKey(dateValue);
        const dayEvents = eventMap[key] || [];
        const isToday = key === toDateKey(new Date());

        return (
          <div key={key} className="rounded-2xl border border-sky-100 bg-white p-3">
            <p className={`text-xs font-black uppercase tracking-[0.16em] ${isToday ? 'text-[#2095D3]' : 'text-slate-500'}`}>
              {dateValue.toLocaleDateString('en-US', { weekday: 'short' })}
            </p>
            <p className="mt-1 text-lg font-black text-slate-800">{dateValue.getDate()}</p>
            <div className="mt-3 space-y-2">
              {dayEvents.length === 0 && <p className="text-xs text-slate-400">No events</p>}
              {dayEvents.map((event) => (
                <div key={event.id} className={`rounded-xl border px-2 py-2 text-[10px] ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other}`}>
                  <p className="font-bold">{event.title}</p>
                  <p className="mt-1">{formatEventTime(event)}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDayView = () => {
    const dayEvents = eventMap[dayKey] || [];
    return (
      <div className="p-5">
        <h3 className="text-xl font-black text-slate-800">{cursor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
        <div className="mt-5 space-y-3">
          {dayEvents.length === 0 && <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">No events for this day.</p>}
          {dayEvents.map((event) => (
            <article key={event.id} className="rounded-2xl border border-sky-100 bg-slate-50/70 p-4">
              <p className="text-sm font-bold text-slate-800">{event.title}</p>
              <p className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other}`}>{event.category}</p>
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <p className="flex items-center gap-2"><Clock3 size={12} />{formatEventTime(event)}</p>
                <p className="flex items-center gap-2"><MapPin size={12} />{event.location || 'Location not specified'}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full rounded-[36px] bg-[radial-gradient(circle_at_top_left,rgba(32,149,211,0.14),transparent_34%),linear-gradient(180deg,#f8fcff_0%,#eef7fd_100%)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#45A1D6]">Calendar</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-[#191839] sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">{subtitle}</p>
          </div>
          <div className="rounded-[24px] border border-sky-100/90 bg-white px-5 py-4 shadow-[0_20px_40px_rgba(24,56,88,0.06)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#45A1D6]">Upcoming Events</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-[#2B2A4C]">{String(upcomingEvents.length).padStart(2, '0')}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="overflow-hidden rounded-[32px] border border-sky-100/90 bg-white shadow-[0_28px_70px_rgba(24,56,88,0.08)]">
            <div className="space-y-4 border-b border-sky-100 bg-slate-50/80 px-6 py-5 sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-black tracking-tight text-[#2B2A4C]">{monthMeta.label}</h2>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => navigatePeriod(-1)} className="rounded-xl border border-sky-100 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-sky-50">Prev</button>
                  <button type="button" onClick={() => setCursor(new Date())} className="rounded-xl border border-sky-100 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-sky-50">Today</button>
                  <button type="button" onClick={() => navigatePeriod(1)} className="rounded-xl border border-sky-100 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-sky-50">Next</button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {['month', 'week', 'day'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${viewMode === mode ? 'bg-[#2095D3] text-white' : 'bg-white text-slate-600 ring-1 ring-sky-100 hover:bg-sky-50'}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="px-8 py-16 text-center text-slate-500">Loading calendar...</div>
            ) : (
              <>
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
              </>
            )}
          </section>

          <section className="rounded-[32px] border border-sky-100/90 bg-white p-6 shadow-[0_28px_70px_rgba(24,56,88,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="text-[#2095D3]" size={20} />
                <h3 className="text-lg font-black text-[#2B2A4C]">Upcoming Feed</h3>
              </div>
              {canManageEvents && (
                <button onClick={() => setShowCreate((v) => !v)} type="button" className="inline-flex items-center gap-1 rounded-xl bg-[#2095D3] px-3 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#1785be]">
                  <Plus size={14} /> Create Event
                </button>
              )}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px]">
              <div className="group relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search events"
                  className="w-full rounded-xl border border-sky-100 bg-white py-2 pl-10 pr-3 text-sm text-slate-800 outline-none focus:border-[#2095D3]"
                />
              </div>
              <div className="relative">
                <Filter size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-xl border border-sky-100 bg-white py-2 pl-8 pr-2 text-sm text-slate-700 outline-none focus:border-[#2095D3]"
                >
                  <option value="ALL">All</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {showCreate && canManageEvents && (
              <form onSubmit={handleCreateEvent} className="mt-4 space-y-3 rounded-2xl border border-sky-100 bg-slate-50 p-4">
                <input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Event title" className="w-full rounded-xl border border-sky-100 px-3 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="rounded-xl border border-sky-100 px-3 py-2 text-sm">
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                  <input required type="date" value={form.event_date} onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))} className="rounded-xl border border-sky-100 px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} className="rounded-xl border border-sky-100 px-3 py-2 text-sm" />
                  <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="Location" className="rounded-xl border border-sky-100 px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="time" value={form.start_time} onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} className="rounded-xl border border-sky-100 px-3 py-2 text-sm" />
                  <input type="time" value={form.end_time} onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} className="rounded-xl border border-sky-100 px-3 py-2 text-sm" />
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={form.is_all_day} onChange={(e) => setForm((p) => ({ ...p, is_all_day: e.target.checked }))} />All-day event</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" className="w-full rounded-xl border border-sky-100 px-3 py-2 text-sm" rows={3} />
                <button disabled={creating} className="w-full rounded-xl bg-[#2095D3] py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#1785be] disabled:opacity-60">{creating ? 'Creating...' : 'Save Event'}</button>
              </form>
            )}

            <div className="mt-5 space-y-3">
              {upcomingEvents.length === 0 && <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No upcoming events found.</p>}
              {upcomingEvents.map((event) => (
                <article key={event.id} className="rounded-2xl border border-sky-100 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-800">{event.title}</p>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other}`}>{event.category}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-sky-700">{new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <p className="flex items-center gap-2"><Clock3 size={12} />{formatEventTime(event)}</p>
                    <p className="flex items-center gap-2"><MapPin size={12} />{event.location || 'Location not specified'}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;

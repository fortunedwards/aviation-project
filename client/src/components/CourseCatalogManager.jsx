import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import api from '../lib/api';

const asNumber = (value) => Number(value || 0);
const PAGE_SIZE = 10;

export default function CourseCatalogManager() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/courses');
      setCourses(Array.isArray(response.data) ? response.data : []);
      setPage(1);
    } catch {
      setMessage('Could not load the course catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCourses(); }, []);

  const changeCourse = (id, field, value) => {
    setCourses((current) => current.map((course) => (course.id === id ? { ...course, [field]: value } : course)));
  };

  const totalPages = Math.max(1, Math.ceil(courses.length / PAGE_SIZE));
  const visibleCourses = useMemo(
    () => courses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [courses, page]
  );

  const saveCourse = async (course) => {
    setSavingId(course.id);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await api.patch(`/api/courses/${course.id}`, {
        title: course.title,
        form_fee: asNumber(course.form_fee),
        course_fee: asNumber(course.course_fee),
        duration: course.duration,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setCourses((current) => current.map((item) => (item.id === course.id ? response.data : item)));
      setMessage(`Saved “${response.data.title}”.`);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Could not save this course.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className={`rounded-[36px] p-4 sm:p-6 lg:p-8 ${'bg-[radial-gradient(circle_at_top_left,rgba(32,149,211,0.16),transparent_32%),linear-gradient(180deg,#f8fcff_0%,#eef7fd_100%)]'}`}>
      <div className="mx-auto max-w-[1500px]">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#45A1D6]">Courses</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-[#191839] sm:text-5xl">Manage Courses</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500">Manage the public course title, registration form fee, course price, and duration. Changes are published through the course API immediately.</p>
        {message && <p className="mt-5 rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm font-semibold text-slate-600">{message}</p>}

        <div className="mt-8 overflow-x-auto rounded-[28px] border border-sky-100 bg-white shadow-[0_20px_40px_rgba(24,56,88,0.06)]">
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-16 text-slate-500"><LoaderCircle className="animate-spin" size={20} /> Loading courses…</div>
          ) : (
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-sky-100 bg-sky-50/70 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                <tr><th className="px-5 py-4">Title</th><th className="px-5 py-4">Form fee (₦)</th><th className="px-5 py-4">Course fee (₦)</th><th className="px-5 py-4">Duration</th><th className="px-5 py-4" /></tr>
              </thead>
              <tbody>
                {visibleCourses.map((course) => (
                  <tr key={course.id} className="border-b border-slate-100 last:border-0">
                    <td className="p-4"><input value={course.title || ''} onChange={(event) => changeCourse(course.id, 'title', event.target.value)} className="w-full min-w-64 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-[#2095D3]" /></td>
                    <td className="p-4"><input type="number" min="0" value={course.form_fee ?? 0} onChange={(event) => changeCourse(course.id, 'form_fee', event.target.value)} className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#2095D3]" /></td>
                    <td className="p-4"><input type="number" min="0" value={course.course_fee ?? 0} onChange={(event) => changeCourse(course.id, 'course_fee', event.target.value)} className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#2095D3]" /></td>
                    <td className="p-4"><input value={course.duration || ''} onChange={(event) => changeCourse(course.id, 'duration', event.target.value)} className="w-56 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#2095D3]" /></td>
                    <td className="p-4"><button type="button" onClick={() => saveCourse(course)} disabled={savingId === course.id} className="inline-flex items-center gap-2 rounded-lg bg-[#2095D3] px-4 py-2 text-sm font-bold text-white hover:bg-[#1A7BB1] disabled:opacity-60"><Save size={15} /> {savingId === course.id ? 'Saving…' : 'Save'}</button></td>
                  </tr>
                ))}
                {courses.length === 0 && <tr><td colSpan="5" className="p-12 text-center text-slate-500">No courses found.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
        {!loading && courses.length > 0 && (
          <div className="mt-5 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, courses.length)} of {courses.length} courses</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 transition hover:border-[#99D2F2] hover:text-[#2095D3] disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
              <span className="font-semibold text-slate-600">Page {page} of {totalPages}</span>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 transition hover:border-[#99D2F2] hover:text-[#2095D3] disabled:cursor-not-allowed disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

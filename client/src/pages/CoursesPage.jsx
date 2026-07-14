import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Clock3, Search, Star } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import PublicSupportChat from '../components/PublicSupportChat';
import coursesData from '../data/courses.json';

const COURSE_IMAGES = [
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1499678329028-101435549a4e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1529074963764-98f45c47344b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1544476915-ed1370594142?auto=format&fit=crop&w=1200&q=80',
];

const PAGE_SIZE = 9;

const normalizeCategory = (course) =>
  course.category || course.track || course.program_type || 'General';

const normalizeDuration = (course) =>
  course.duration || course.duration_text || (course.duration_months ? `${course.duration_months} months` : '6 months');

const normalizePrice = (course) => {
  if (typeof course.price === 'number') return course.price;
  const value = Number(course.price ?? 0);
  return Number.isNaN(value) ? 0 : value;
};

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [queryInput, setQueryInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All courses');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCourses(Array.isArray(coursesData?.courses) ? coursesData.courses : []);
  }, []);

  const categories = useMemo(() => {
    const values = Array.from(new Set(courses.map((course) => normalizeCategory(course)).filter(Boolean)));
    return ['All courses', ...values];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const category = normalizeCategory(course);
      const title = String(course.title || '').toLowerCase();
      const description = String(course.course_description || '').toLowerCase();
      const q = searchTerm.trim().toLowerCase();

      const categoryMatch = selectedCategory === 'All courses' ? true : category === selectedCategory;
      const searchMatch = q ? title.includes(q) || description.includes(q) : true;

      return categoryMatch && searchMatch;
    });
  }, [courses, searchTerm, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));

  const pagedCourses = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCourses.slice(start, start + PAGE_SIZE);
  }, [filteredCourses, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleSearch = () => {
    setSearchTerm(queryInput);
  };

  return (
    <div className="bg-white text-[#2B2A4C]">
      <PublicHeader />

      <section className="relative overflow-hidden bg-[#2B2A4C] px-6 pb-20 pt-36 lg:px-12">
        <div className="pointer-events-none absolute -left-20 top-14 h-72 w-72 rounded-full bg-[#2095D3]/20 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-20 h-56 w-56 rotate-12 rounded-[36px] border border-white/10 bg-white/5" />
        <div className="pointer-events-none absolute bottom-6 right-24 h-40 w-40 rounded-full border border-[#45A1D6]/25" />

        <div className="container-max relative z-10 mx-auto text-center">
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Explore Our Training Programs
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg text-white/80">
            Discover comprehensive  training courses designed to elevate your aviation skills.
          </p>

          <div className="mx-auto mt-10 flex w-full max-w-4xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm md:flex-row md:items-center">
            <div className="relative md:w-56">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/15 bg-white/10 px-4 py-3 pr-10 text-sm text-white outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="text-slate-900">
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/75" />
            </div>

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              <input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                type="text"
                placeholder="Search training programs"
                className="w-full rounded-xl border border-white/15 bg-white/10 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/60 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSearch}
              className="rounded-xl bg-[#2095D3] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1A7BB1]"
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16 lg:px-12">
        <div className="container-max mx-auto">
          {pagedCourses.length === 0 ? (
            <p className="text-center text-slate-500">No courses found.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                {pagedCourses.map((course, index) => {
                  const rating = Number(course.rating ?? 4.8);
                  const price = normalizePrice(course);
                  const duration = normalizeDuration(course);
                  const image = COURSE_IMAGES[(currentPage * 10 + index) % COURSE_IMAGES.length];

                  return (
                    <article key={course.slug || `${course.title}-${index}`} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                      <img
                        src={image}
                        alt={course.title || 'Course'}
                        className="h-52 w-full rounded-xl object-cover"
                      />

                      <div className="px-1 pb-2 pt-5">
                        <h3 className="line-clamp-2 text-xl font-bold text-[#2B2A4C]">{course.title || 'Untitled Course'}</h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-7 text-slate-600">
                          {course.course_description || 'Comprehensive aviation program tailored for practical industry readiness.'}
                        </p>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[#2095D3]">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < Math.round(rating) ? 'fill-current' : ''}`} />
                            ))}
                            <span className="ml-2 text-sm font-semibold text-slate-600">{rating.toFixed(1)}</span>
                          </div>

                          <div className="inline-flex items-center gap-1 text-sm text-slate-500">
                            <Clock3 className="h-4 w-4" />
                            {duration}
                          </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between">
                          <p className="text-lg font-black text-[#2B2A4C]">₦{price.toLocaleString()}</p>
                          <Link
                            to={`/courses/${course.slug}`}
                            className="rounded-lg bg-[#2B2A4C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f1e3c]"
                          >
                            View More
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="mt-12 flex items-center justify-center gap-3">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const active = page === currentPage;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`h-10 w-10 rounded-full text-sm font-semibold transition ${
                        active ? 'bg-[#2B2A4C] text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <PublicFooter />
      <PublicSupportChat />
    </div>
  );
}

export default CoursesPage;

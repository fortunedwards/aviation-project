import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, Clock3, Search, Star } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import PublicSupportChat from '../components/PublicSupportChat';
import coursesData from '../data/courses.json';
import { getCourseHeroImage } from '../data/images';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [queryInput, setQueryInput] = useState(() => searchParams.get('q') || '');
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'All courses');
  const [visibleCount, setVisibleCount] = useState(() => {
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    return Math.max(PAGE_SIZE, (Number.isNaN(page) ? 1 : page) * PAGE_SIZE);
  });

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

  const visibleCourses = useMemo(() => {
    return filteredCourses.slice(0, visibleCount);
  }, [filteredCourses, visibleCount]);

  const updateUrlState = (nextCategory, nextQuery, nextVisibleCount) => {
    const params = new URLSearchParams();

    if (nextCategory && nextCategory !== 'All courses') {
      params.set('category', nextCategory);
    }

    if (nextQuery) {
      params.set('q', nextQuery);
    }

    const page = Math.max(1, Math.ceil(nextVisibleCount / PAGE_SIZE));
    if (page > 1) {
      params.set('page', String(page));
    }

    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const nextVisibleCount = Math.max(PAGE_SIZE, (Number.isNaN(page) ? 1 : page) * PAGE_SIZE);
    const nextQuery = searchParams.get('q') || '';
    const nextCategory = searchParams.get('category') || 'All courses';

    setQueryInput(nextQuery);
    setSearchTerm(nextQuery);
    setSelectedCategory(nextCategory);
    setVisibleCount(nextVisibleCount);
  }, [searchParams]);

  const handleSearch = () => {
    const nextQuery = queryInput.trim();
    setSearchTerm(nextQuery);
    setVisibleCount(PAGE_SIZE);
    updateUrlState(selectedCategory, nextQuery, PAGE_SIZE);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setVisibleCount(PAGE_SIZE);
    updateUrlState(value, searchTerm.trim(), PAGE_SIZE);
  };

  const handleLoadMore = () => {
    const nextVisibleCount = Math.min(visibleCount + PAGE_SIZE, filteredCourses.length);
    setVisibleCount(nextVisibleCount);
    updateUrlState(selectedCategory, searchTerm.trim(), nextVisibleCount);
  };

  return (
    <div className="bg-white text-[#2B2A4C]">
      <PublicHeader />

      <section className="relative overflow-hidden bg-[#2B2A4C] px-6 pb-16 pt-28 sm:pb-20 sm:pt-36 lg:px-12">
        <div className="pointer-events-none absolute -left-20 top-14 h-72 w-72 rounded-full bg-[#2095D3]/20 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-20 h-56 w-56 rotate-12 rounded-[36px] border border-white/10 bg-white/5" />
        <div className="pointer-events-none absolute bottom-6 right-24 h-40 w-40 rounded-full border border-[#45A1D6]/25" />

        <div className="container-max relative z-10 mx-auto text-center">
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            Explore Our Training Programs
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-white/80 sm:mt-5 sm:text-base md:text-lg">
            Discover comprehensive training courses designed to elevate your aviation skills.
          </p>

          <div className="mx-auto mt-8 flex w-full max-w-4xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-2.5 backdrop-blur-sm md:mt-10 md:flex-row md:items-center sm:p-3">
            <div className="relative md:w-56">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 pr-10 text-sm text-white outline-none sm:px-4 sm:py-3"
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
                className="w-full rounded-xl border border-white/15 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/60 outline-none sm:py-3"
              />
            </div>

            <button
              type="button"
              onClick={handleSearch}
              className="rounded-xl bg-[#2095D3] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1A7BB1] sm:px-6 sm:py-3"
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16 lg:px-12">
        <div className="container-max mx-auto">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-600">
              {filteredCourses.length === 0
                ? 'Showing 0 courses'
                : `Showing 1–${Math.min(visibleCourses.length, filteredCourses.length)} of ${filteredCourses.length} courses`}
            </p>
            {searchTerm || selectedCategory !== 'All courses' ? (
              <p className="text-sm text-slate-500">Filters active</p>
            ) : null}
          </div>

          {visibleCourses.length === 0 ? (
            <p className="text-center text-slate-500">No courses found.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                {visibleCourses.map((course, index) => {
                  const rating = Number(course.rating ?? 4.8);
                  const price = normalizePrice(course);
                  const duration = normalizeDuration(course);
                  const courseIndex = courses.findIndex((item) => item.slug === course.slug);
                  const image = getCourseHeroImage(course, courseIndex >= 0 ? courseIndex : index);

                  return (
                    <Link
                      key={course.slug || `${course.title}-${index}`}
                      to={`/courses/${course.slug}`}
                      className="group block rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                      aria-label={`View details for ${course.title || 'course'}`}
                    >
                      <img
                        src={image}
                        alt={course.title || 'Course'}
                        className="h-52 w-full rounded-xl object-cover"
                      />

                      <div className="px-1 pb-2 pt-5">
                        <h3 className="line-clamp-2 text-xl font-bold text-[#2B2A4C] transition group-hover:text-[#2095D3]">
                          {course.title || 'Untitled Course'}
                        </h3>
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
                          <span className="rounded-lg bg-[#2B2A4C] px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-[#1f1e3c]">
                            View More
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {visibleCount < filteredCourses.length ? (
                <div className="mt-12 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="inline-flex items-center justify-center rounded-xl bg-[#2B2A4C] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1f1e3c]"
                  >
                    Load More
                  </button>
                </div>
              ) : null}
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

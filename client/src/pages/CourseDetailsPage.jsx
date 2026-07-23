import { Link, useParams } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Star,
  Users,
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import PublicSupportChat from '../components/PublicSupportChat';
import coursesData from '../data/courses.json';
import { COURSE_DETAILS_HERO_IMAGES, COURSE_DETAILS_SNEAK_PEEK_IMAGES } from '../data/images';

const normalizePrice = (price) => {
  if (typeof price === 'number') return `₦${price.toLocaleString()}`;
  if (typeof price === 'string') return `₦${price}`;
  return '₦0';
};

const PAID_REGISTRATION_SLUGS = new Set([
  'flight-dispatcher-flight-operations-officer-basic-fdb',
  'flight-dispatcher-flight-operations-officer-advanced-fda',
  'cabin-crew-initial-training-cci',
  'cabin-crew-conversion-refresher-training-b737-classic',
  'basic-aircraft-maintenance-technicians-course-batco',
  'aircraft-maintenance-licence-preparatory-course-amlpc-ap',
  'aircraft-maintenance-licence-preparatory-course-amlpc-avionics',
  'b737-200-type-training-maintenance-initial',
  'b737-classic-300-400-500-type-training-maintenance-initial',
  'b737ng-type-training-maintenance-initial',
  'b737-classic-ng-differences-course',
  'bombardier-crj-type-training-maintenance-initial',
  'dhc-8-q400-type-training-maintenance-initial',
  'erj-135-145-legacy-type-training-maintenance-initial',
]);

const isPaidRegistrationCourse = (course) => {
  return PAID_REGISTRATION_SLUGS.has(course?.slug);
};

function CourseDetailsPage() {
  const { slug } = useParams();
  const courses = Array.isArray(coursesData?.courses) ? coursesData.courses : [];
  const courseIndex = courses.findIndex((item) => item.slug === slug);
  const course = courseIndex >= 0 ? courses[courseIndex] : null;

  if (!course) {
    return (
      <div className="min-h-screen bg-white text-[#2B2A4C]">
        <PublicHeader />
        <main className="container-max px-6 pb-24 pt-40 lg:px-12">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
            <h1 className="text-3xl font-black text-[#2B2A4C]">Course Not Found</h1>
            <p className="mt-4 text-slate-600">The course you requested is not available.</p>
            <Link to="/courses" className="mt-8 inline-flex rounded-lg bg-[#2095D3] px-6 py-3 font-semibold text-white">
              Back to Courses
            </Link>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const heroImage = COURSE_DETAILS_HERO_IMAGES[courseIndex % COURSE_DETAILS_HERO_IMAGES.length];
  const enrolledCount = 120 + courseIndex * 17;
  const rating = Number(course.rating ?? 4.8);
  const keyPoints = (course.outline || []).slice(0, 6);
  const registrationFeeText = isPaidRegistrationCourse(course)
    ? 'Registration costs ₦5,000'
    : 'Registration is FREE';

  const openSupportChat = (event) => {
    event.preventDefault();
    window.dispatchEvent(new Event('open_support_chat'));
  };

  return (
    <div className="bg-white text-[#2B2A4C]">
      <PublicHeader />

      <section className="relative overflow-hidden bg-[#2B2A4C] px-6 pb-16 pt-36 lg:px-12">
        <div className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-[#2095D3]/20 blur-3xl" />
        <div className="container-max relative z-10 mx-auto">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl">{course.title}</h1>
            <Link
              to={`/register?courseSlug=${course.slug}`}
              className="inline-flex items-center justify-center rounded-xl bg-[#2095D3] px-8 py-4 text-base font-black text-white transition hover:bg-[#1A7BB1]"
            >
              Enroll Now
            </Link>
          </div>

          <p className="mt-5 max-w-4xl text-lg text-white/80">{course.course_description}</p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white">
              <FolderKanban className="h-4 w-4 text-[#99D2F2]" /> {course.category}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white">
              <Star className="h-4 w-4 fill-current text-[#45A1D6]" /> {rating.toFixed(1)} Reviews
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white">
              <Users className="h-4 w-4 text-[#99D2F2]" /> {enrolledCount.toLocaleString()} Students Enrolled
            </span>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
            <img src={heroImage} alt={course.title} className="h-[320px] w-full object-cover md:h-[420px]" />
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16 lg:px-12">
        <div className="container-max mx-auto grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <article>
              <h2 className="text-2xl font-black text-[#2B2A4C]">Description</h2>
              <p className="mt-4 leading-8 text-slate-600">
                {course.course_description} This program combines practical exposure, technical depth, and industry-focused guidance to help participants confidently apply their knowledge in real aviation operations.
              </p>
            </article>

            <article className="mt-12">
              <h3 className="text-2xl font-black text-[#2B2A4C]">Sneak Peak</h3>
              <div className="mt-5 grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((idx) => (
                  <img
                    key={`${course.slug}-preview-${idx}`}
                    src={COURSE_DETAILS_SNEAK_PEEK_IMAGES[(courseIndex + idx) % COURSE_DETAILS_SNEAK_PEEK_IMAGES.length]}
                    alt={`${course.title} preview ${idx + 1}`}
                    className="h-36 w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            </article>

            <article className="mt-12">
              <h3 className="text-2xl font-black text-[#2B2A4C]">Key Points</h3>
              <ul className="mt-5 space-y-3">
                {keyPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#2095D3]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <aside className="lg:col-span-2">
            <div className="sticky top-28 rounded-2xl border border-[#99D2F2] bg-white p-7 shadow-sm">
              <h3 className="text-xl font-black text-[#2B2A4C]">Course Details</h3>

              <div className="mt-5 space-y-4 text-sm text-slate-700">
                <p className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-[#2095D3]" /> <span className="font-semibold">Duration:</span> {course.duration}
                </p>
                <div>
                  <p className="inline-flex items-center gap-2 font-semibold text-[#2B2A4C]">
                    <BookOpen className="h-4 w-4 text-[#2095D3]" /> Course Outline
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                    {(course.outline || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <p className="text-3xl font-black text-[#2B2A4C]">{normalizePrice(course.price)}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">{registrationFeeText}</p>
                <Link
                  to={`/register?courseSlug=${course.slug}`}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#2095D3] px-6 py-5 text-base font-black text-white transition hover:bg-[#1A7BB1]"
                >
                  Enroll Now
                </Link>
                <p className="mt-4 text-sm text-slate-600">
                  For more information, feel free to{' '}
                  <a href="#" onClick={openSupportChat} className="font-semibold text-[#2095D3] hover:underline">
                    contact support
                  </a>
                  .
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <PublicFooter />
      <PublicSupportChat />
    </div>
  );
}

export default CourseDetailsPage;

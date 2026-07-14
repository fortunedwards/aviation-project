import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  Mouse,
  Rocket,
  ShieldCheck,
  Star,
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import PublicSupportChat from '../components/PublicSupportChat';

const HERO_SLIDES = [
  'https://images.unsplash.com/photo-1544476915-ed1370594142?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1529074963764-98f45c47344b?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?auto=format&fit=crop&w=1600&q=80',
];

const UPCOMING_TRAININGS = [
  {
    title: 'Flight Dispatcher/Flight Operations Officer (Basic) (FDB)',
    slug: 'flight-dispatcher-flight-operations-officer-basic-fdb',
    date: 'Next Batch',
    badge: 'Enrollment Open',
    badgeTone: 'bg-[#2095D3]',
    description:
      'Foundational training preparing participants for a career as Flight Dispatchers/Flight Operations Officers, covering core technical and operational subjects.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuArF-3_t9TNzrIATQMxlv7cz0V3qvD1jnJC0s2_eBNytx6jpk0PTJlm92jui4uTWOC84hff9uj3K6ZaIoP-DagBrqrPibRrQVKoFVha5-5feia7eIIb_X2XVgQD_H0im_5Bjz9QJCemVtOGGHumQHCyIfCe6a-EajMB9apuZuDnoGl28FLTNJgR-OASDhaptXIUb0qf8aq6hh8fJfJOtAcWajZbPxkIBXlXmrrz2M4DB50ypHg3-sKPrsHZ-AnVeWwMIyBmu2uG0evM',
  },
  {
    title: 'Cabin Crew (Initial) Training (CCI)',
    slug: 'cabin-crew-initial-training-cci',
    date: 'Next Batch',
    badge: 'NCAA Approved',
    badgeTone: 'bg-[#2B2A4C]',
    description:
      'Comprehensive initial training for aspiring cabin crew members, covering safety, emergency procedures, customer service, and aircraft-specific knowledge.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCD-q1gygpZVGEVU22F3cmEQak9b_h4apPW9hA9XPgyKYrbe0a3n-jS1L32yUcdXkHrwD8VFNLqrNPSNE5INXJ7f5gkVXmGJxcWVzyQ7R9mgS0N-TQvsQcKgArds-DzC70fhuo-sS9g522NXH7evDRn50sjN8qsIdPXvqKAkMqSztrXDRMqoZ0Qn-jZEgMYyERqcZkR6hls2zdibvUMiL38nZqm3RbcWMJArU6Q_ULKspJOVMsNd26KyJjt_IB3XXuQfJe9nlwyoYcB',
  },
  {
    title: 'Aircraft Maintenance Licence Preparatory Course (AMLPC) (A&P)',
    slug: 'aircraft-maintenance-licence-preparatory-course-amlpc-ap',
    date: 'Next Batch',
    badge: 'Safety Module',
    badgeTone: 'bg-[#45A1D6]',
    description:
      'Extensive preparatory course for Aircraft Maintenance Licence (Airframe & Powerplant) covering all required EASA/NCAA modules.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB06V2eQJdYATqvCRvb0eyDw1FPMDsgY7qAd0H3EZ51buDEr2pnaJyN3l-rh_Wbnl9znfN6wsnq0Hx2EuSrXSPB-3f3dC7OC7EwGoPrd5CVdozy4Qx1d9RqRs0EzHTghr_0RfmaLw8JChCIzYYBEl3McbFdYiT93jj1qOam7CKrfxn3Xyo822qsms3S-X_KL1DwWKtLolzfY_HxajeT0e0GxmPrq4eiJ25CPRkB7c9qOpcr7eZQjdaOWuf4TWdfZVTixky2giDcbEn5',
  },
];

const REVIEWS = [
  {
    quote:
      'The depth of technical knowledge provided during the engineering workshop was unparalleled. Aeroconsult sets the bar for aviation training in West Africa.',
    name: 'John O.',
    role: 'Maintenance Engineer',
  },
  {
    quote:
      'Professionalism at its peak. The instructors are real-world experts who bring practical scenarios into the classroom. Highly recommended for any professional.',
    name: 'Sarah A.',
    role: 'Operations Manager',
  },
  {
    quote:
      'Getting my SMS certification here was a career-defining move. The facilities and the curriculum are perfectly aligned with NCAA and ICAO standards.',
    name: 'Ibrahim K.',
    role: 'Safety Officer',
  },
];

function RevealSection({ className = '', children }) {
  const [isVisible, setIsVisible] = useState(false);
  const [node, setNode] = useState(null);

  useEffect(() => {
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return (
    <div
      ref={setNode}
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}

function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const durationMs = 7000;
    const tickMs = 70;
    const progressStep = (100 * tickMs) / durationMs;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveSlide((slide) => (slide + 1) % HERO_SLIDES.length);
          return 1;
        }
        return Math.min(100, prev + progressStep);
      });
    }, tickMs);

    return () => clearInterval(timer);
  }, []);

  const heroStyle = useMemo(
    () => ({ backgroundImage: `url(${HERO_SLIDES[activeSlide]})` }),
    [activeSlide]
  );

  return (
    <div className="bg-white text-[#2B2A4C]">
      <PublicHeader />

      <section className="relative min-h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={heroStyle}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#2B2A4C]/70 via-[#2B2A4C]/55 to-[#2B2A4C]/80"
          aria-hidden="true"
        />

        <div className="container-max relative z-10 flex min-h-screen items-center justify-center px-6 pt-28 pb-24 lg:px-12">
          <div className="relative z-20 mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 text-center">
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-white drop-shadow-lg md:text-7xl">
              Welcome to
              <br />
              <span
                className="text-[#2095D3]"
                style={{ WebkitTextStroke: '0.4px rgba(255, 255, 255, 0.75)', textShadow: '0 0 0.8px rgba(255, 255, 255, 0.25)' }}
              >
                Aeroconsult Ltd.
              </span>
            </h1>
            <p className="max-w-2xl text-xl font-light tracking-wide text-white/90 md:text-2xl">
              Pioneering Excellence in Aviation Technical Consultancy & Professional Training.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="bg-[#2095D3] px-10 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:scale-105 hover:bg-[#1A7BB1]"
              >
                Register Now
              </Link>
              <Link
                to="/courses"
                className="border-2 border-white px-10 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:scale-105 hover:bg-white hover:text-[#2B2A4C]"
              >
                View Courses
              </Link>
            </div>
          </div>

          <div className="absolute bottom-14 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/75">
            <Mouse className="animate-scroll-bounce h-8 w-8" />
            <span className="text-xs font-semibold tracking-[0.35em]">SCROLL</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 w-full bg-white/20">
          <div
            className="h-full bg-[#2095D3] transition-[width] duration-75"
            style={{ width: `${progress}%` }}
            aria-label="Hero slide progress"
          />
        </div>
      </section>

      <section className="bg-white py-32 px-container-padding">
        <RevealSection className="mx-auto grid max-w-7xl items-center gap-20 md:grid-cols-2">
          <div className="space-y-8">
            <div className="inline-block border-l-4 border-brand-primary bg-brand-accent/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-brand-primary">
              Our Authority
            </div>
            <h2 className="font-display text-4xl font-black leading-tight text-brand-deep md:text-5xl">
              Welcome to <br /> Aeroconsult Ltd.
            </h2>
            <p className="text-lg font-light leading-relaxed text-slate-600">
              We are a leading specialist aviation technical consultancy firm in Nigeria offering services in operations, engineering and management consulting to aviation and allied industries.
            </p>
            <div className="border-l-8 border-brand-primary bg-slate-50 p-8 shadow-sm">
              <p className="text-xl font-semibold italic text-brand-deep">
                "Approved by the Nigerian Civil Aviation Authority (NCAA) as an Approved Training Organisation (ATO) with Approval No: ATO/AA/002."
              </p>
            </div>
          </div>
          <div className="group relative">
            <div className="absolute -inset-4 rounded-xl bg-brand-accent/20 transition-colors group-hover:bg-brand-accent/30" />
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRNWrpb-xKo_-ynboDCjXmRwym7_4egU0z6L32Yn__6JpGhtyNvCuhWSKgnsKIXcW1WxWOZuZHKJxjVbKNQE2upj4rZwIK6LKfpmvi-55JpCX1UwUvwznYOeRtTiEPYNQ6rQTUW7YMIgWzMXkAsJs0pkMqJxo7BpaPf-Nix_igcl0dIuC5LmdUP-d9l4dMNf_Di1KnWVEKDwk74zK4jmPDfpUFcr6jxgAZkMkS_KM7g0VOs565-7pndDd6IOQBhEAZnTVIJTayxodu"
              alt="Aviation professionals in a modern training hangar"
              className="relative h-[500px] w-full rounded-lg object-cover grayscale transition-all duration-700 hover:grayscale-0 shadow-2xl"
            />
          </div>
        </RevealSection>
      </section>

      <section className="bg-brand-deep py-24 text-white">
        <RevealSection className="mx-auto grid max-w-7xl gap-px bg-white/10 px-8 md:grid-cols-2">
          <article className="group bg-brand-deep p-16 transition-colors hover:bg-slate-900">
            <Eye className="mb-6 h-12 w-12 text-brand-accent" />
            <h3 className="mb-6 text-3xl font-bold tracking-tight">Our Vision</h3>
            <p className="text-lg leading-relaxed text-white/70 transition-colors group-hover:text-white">
              To be a world-class aviation service provider and training organization, being one of the best in Africa.
            </p>
          </article>
          <article className="group border-l border-white/10 bg-brand-deep p-16 transition-colors hover:bg-slate-900">
            <Rocket className="mb-6 h-12 w-12 text-brand-accent" />
            <h3 className="mb-6 text-3xl font-bold tracking-tight">Our Mission</h3>
            <p className="text-lg leading-relaxed text-white/70 transition-colors group-hover:text-white">
              Pulling together the highest level of Aviation resources to sustain professional standards and professionalism in the entire Aviation Industry through training, promoting safety and quality for excellent services and global best practices.
            </p>
          </article>
        </RevealSection>
      </section>

      <section className="bg-slate-50 py-32 px-8">
        <RevealSection className="mx-auto max-w-7xl">
          <div className="mb-16 flex items-end justify-between">
            <div>
              <h2 className="mb-4 text-4xl font-black text-brand-deep">Upcoming Training</h2>
              <div className="h-1 w-24 bg-brand-primary" />
            </div>
            <Link
              to="/courses"
              className="flex items-center gap-2 font-bold text-brand-primary transition-all hover:gap-4"
            >
              View All Courses <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {UPCOMING_TRAININGS.map((course) => (
              <Link
                key={course.title}
                to={`/courses/${course.slug}`}
                className="group block overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-2xl"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className={`absolute top-4 left-4 ${course.badgeTone} px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white`}>
                    {course.badge}
                  </div>
                </div>
                <div className="p-8">
                  <h4 className="mb-4 line-clamp-2 text-xl font-bold text-brand-deep">{course.title}</h4>
                  <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-slate-500">{course.description}</p>
                  <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                    <span className="text-sm font-bold text-brand-primary">{course.date}</span>
                    <ArrowRight className="h-5 w-5 text-slate-300 transition-colors group-hover:text-brand-primary" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </RevealSection>
      </section>

      <section className="relative overflow-hidden py-32">
        <div className="absolute inset-0 origin-right translate-y-20 skew-y-3 bg-brand-primary opacity-5" />
        <RevealSection className="relative z-10 mx-auto max-w-4xl px-8 text-center">
          <ShieldCheck className="mx-auto mb-8 h-16 w-16 text-brand-primary" />
          <h2 className="mb-10 text-4xl font-black uppercase tracking-tight text-brand-deep">Quality Policy</h2>
          <p className="text-2xl font-light italic leading-relaxed text-slate-700">
            "Aeroconsult Limited is committed to the delivery of high-quality products in its air transport consultancy, aviation training and our related business endeavours, that meet the needs and expectations of our customers by leveraging on relevant regulations and standards. We will continually strive to improve the quality of our delivered products as well as processes we use to fulfill those obligations."
          </p>
          <div className="mt-12 flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-brand-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-brand-deep">Certified Standards</span>
            <div className="h-px w-12 bg-brand-primary" />
          </div>
        </RevealSection>
      </section>

      <section className="px-8 py-24">
        <RevealSection className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 overflow-hidden rounded-3xl bg-brand-deep p-12 md:flex-row md:p-20">
          <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-brand-primary/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-brand-accent/10 blur-2xl" />

          <div className="relative z-10 max-w-xl">
            <h2 className="mb-8 text-4xl font-black text-white md:text-5xl">Ready to Elevate Your Career?</h2>
            <ul className="mb-10 space-y-4">
              <li className="flex items-center gap-4 text-white/80">
                <CheckCircle2 className="h-5 w-5 text-brand-accent" /> NCAA Accredited Training Modules
              </li>
              <li className="flex items-center gap-4 text-white/80">
                <CheckCircle2 className="h-5 w-5 text-brand-accent" /> Expert Industry Consultant Instructors
              </li>
              <li className="flex items-center gap-4 text-white/80">
                <CheckCircle2 className="h-5 w-5 text-brand-accent" /> State-of-the-art Learning Facilities
              </li>
            </ul>
            <Link
              to="/register"
              className="inline-flex rounded-full bg-brand-primary px-12 py-5 font-bold text-white shadow-xl transition-all hover:scale-105 hover:bg-[#1A7BB1]"
            >
              Register For Courses
            </Link>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4">
            {[
              ['500+', 'Graduates'],
              ['20+', 'Experts'],
              ['15+', 'Courses'],
              ['ATO', 'Certified'],
            ].map(([value, label], idx) => (
              <div
                key={label}
                className={`rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md ${
                  idx % 2 ? 'mt-8' : ''
                }`}
              >
                <div className="mb-1 text-3xl font-black text-brand-accent">{value}</div>
                <div className="text-xs font-bold uppercase tracking-tighter text-white/60">{label}</div>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      <section className="px-8 py-32">
        <RevealSection className="mx-auto max-w-7xl">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-4xl font-black text-brand-deep">Student Testimonials</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Voices of Success</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {REVIEWS.map((review) => (
              <article
                key={review.name}
                className="relative rounded-3xl border border-slate-100 bg-white p-10 italic text-slate-600 shadow-sm"
              >
                <span className="absolute -top-6 left-10 text-6xl text-brand-accent/30">"</span>
                <p>{review.quote}</p>
                <div className="mt-8 flex items-center gap-4 not-italic">
                  <div className="h-12 w-12 rounded-full bg-brand-accent/20" />
                  <div>
                    <p className="font-bold text-brand-deep">{review.name}</p>
                    <p className="text-xs text-slate-400">{review.role}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-brand-primary not-italic">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
              </article>
            ))}
          </div>
        </RevealSection>
      </section>

      <PublicFooter />
      <PublicSupportChat />
    </div>
  );
}

export default HomePage;

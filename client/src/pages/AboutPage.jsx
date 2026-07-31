import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Compass,
  GraduationCap,
  Lightbulb,
  Medal,
  Mouse,
  ShieldCheck,
  Target,
  Wrench,
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import PublicSupportChat from '../components/PublicSupportChat';
import { ABOUT_HERO_SLIDES, ABOUT_IMAGE } from '../data/images';

const CORE_IDENTITY = [
  {
    title: 'Our Vision',
    icon: Target,
    text: 'To be a world-class aviation service provider and training organization, recognized as one of the best in Africa.',
  },
  {
    title: 'Our Mission',
    icon: Compass,
    text: 'To pull together the highest level of aviation resources to sustain professional standards and professionalism throughout the industry. We promote safety, quality, and global best practices to ensure excellent service delivery.',
  },
  {
    title: 'Quality Focus',
    icon: ShieldCheck,
    text: 'We are committed to delivering high-quality products in air transport consultancy and training that meet customer expectations by leveraging relevant regulations and standards. We prioritize continual improvement of both our products and the processes used to fulfill our obligations.',
  },
];

const OFFERINGS = [
  {
    title: 'NCAA Approved Training',
    icon: GraduationCap,
    text: 'We offer certified training for Flight Dispatchers/Flight Operations Officers, Cabin Crew, and Aircraft Maintenance License Preparatory courses.',
  },
  {
    title: 'Technical Type Training',
    icon: Wrench,
    text: 'Specializing in maintenance initial and refresher courses for various aircraft, including the B737 (Classic & NG), Bombardier CRJ-700/900/1000, DHC 8 (Q-400), and ERJ-135/145/Legacy 600/650.',
  },
  {
    title: 'Professional Development',
    icon: Medal,
    text: 'A vast catalog of courses covering Quality Management Systems (QMS), Safety Management Systems (SMS), Airworthiness, Airline Management, and Human Factors.',
  },
  {
    title: 'Consultancy Services',
    icon: Briefcase,
    text: 'Expert engineering and management consulting tailored to aviation business needs.',
  },
  {
    title: 'Bespoke Solutions',
    icon: Lightbulb,
    text: 'We develop unscheduled and tailored courses on demand to meet the specific requirements of individual organizations.',
  },
];

const TEAM_MEMBERS = [
  {
    name: 'Engr. B.A. Obadofin',
    role: 'Chief Executive Officer',
    image: `${import.meta.env.BASE_URL}obadofin.png`,
  },
  {
    name: 'Capt. Dele Ore',
    role: 'Director, Business & Strategy',
    image: `${import.meta.env.BASE_URL}delores.png`,
  },
  {
    name: 'Engr. C.O. Ayo-Ariyo',
    role: 'Accountable Manager',
    image: `${import.meta.env.BASE_URL}ariyo.png`,
  },
  {
    name: 'Engr. Ameh Joseph Alhaji',
    role: 'Quality Manager',
    image: `${import.meta.env.BASE_URL}ameh.png`,
  },
  {
    name: 'Mr. Adebanji M. Oladimeji',
    role: 'Head of Accounting',
    image: `${import.meta.env.BASE_URL}oladimeji.png`,
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

function AboutPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const durationMs = 7000;
    const tickMs = 70;
    const progressStep = (100 * tickMs) / durationMs;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveSlide((slide) => (slide + 1) % ABOUT_HERO_SLIDES.length);
          return 1;
        }
        return Math.min(100, prev + progressStep);
      });
    }, tickMs);

    return () => clearInterval(timer);
  }, []);

  const heroStyle = useMemo(
    () => ({ backgroundImage: `url(${ABOUT_HERO_SLIDES[activeSlide]})` }),
    [activeSlide]
  );

  return (
    <div className="bg-white text-[#2B2A4C]">
      <PublicHeader />

      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000" style={heroStyle} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2B2A4C]/70 via-[#2B2A4C]/55 to-[#2B2A4C]/80" />

        <div className="container-max relative z-10 flex min-h-screen items-center justify-center px-6 pt-28 pb-24 lg:px-12">
          <div className="relative z-20 mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 text-center">
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-white drop-shadow-lg md:text-7xl">
              About
              <br />
              <span
                className="text-[#2095D3]"
                style={{ WebkitTextStroke: '0.4px rgba(255, 255, 255, 0.75)', textShadow: '0 0 0.8px rgba(255, 255, 255, 0.25)' }}
              >
                Aeroconsult Ltd.
              </span>
            </h1>
            <p className="max-w-2xl text-base font-light leading-relaxed tracking-wide text-white/90 sm:text-lg md:text-xl lg:text-2xl">
              Explore our story, our core identity, what we offer and the amazing team that makes us who we are
            </p>
          </div>

          <div className="absolute bottom-14 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/75">
            <Mouse className="animate-scroll-bounce h-8 w-8" />
            <span className="text-xs font-semibold tracking-[0.35em]">SCROLL</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 w-full bg-white/20">
          <div className="h-full bg-[#2095D3] transition-[width] duration-75" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="bg-white py-32 px-container-padding">
        <RevealSection className="mx-auto grid max-w-7xl items-center gap-20 lg:grid-cols-2">
          <div className="space-y-8">
            <h2 className="font-display text-4xl font-black leading-tight text-brand-deep md:text-5xl">
              Built on Aviation Excellence Since 1993
            </h2>
            <p className="text-lg font-light leading-relaxed text-slate-600">
              Incorporated on October 21, 1993, Aeroconsult Ltd. is a premier specialist aviation technical consultancy and training firm based in Nigeria. As a Company Limited by Shares, we have established ourselves as a leader in providing comprehensive solutions to the aviation and allied industries, including specialized services for Oil & Gas organizations.
            </p>
            <div className="border-l-8 border-brand-primary bg-slate-50 p-5 shadow-sm sm:p-8">
              <p className="text-base font-semibold italic text-brand-deep sm:text-xl">
                We operate as an Approved Training Organisation (ATO), holding NCAA Approval No: ATO/AA/002, and we are proud to be ISO 9001:2015 Certified (Certification No: QSCIPL-NIG/ARL-Q11102).
              </p>
            </div>
          </div>
          <div className="group relative hidden lg:block">
            <div className="absolute -inset-4 bg-brand-accent/20 transition-colors group-hover:bg-brand-accent/30" />
            <img
              src={ABOUT_IMAGE}
              alt="Aeroconsult professionals"
              className="relative h-[500px] w-full object-cover grayscale transition-all duration-700 hover:grayscale-0 shadow-2xl"
            />
          </div>
        </RevealSection>
      </section>

      <section className="bg-[#99D2F2]/15 px-4 py-14 sm:px-8 sm:py-24">
        <RevealSection className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-3 sm:gap-8">
            {CORE_IDENTITY.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl bg-white p-6 text-slate-600 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-10"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2095D3] to-[#45A1D6] text-white sm:mb-8 sm:h-16 sm:w-16">
                  <item.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                <h3 className="mb-3 text-lg font-black text-brand-deep sm:mb-4 sm:text-2xl">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600 sm:text-base sm:leading-8">{item.text}</p>
              </article>
            ))}
          </div>
        </RevealSection>
      </section>

      <section className="bg-white px-4 py-16 sm:px-container-padding sm:py-32">
        <RevealSection className="mx-auto max-w-7xl">
          <div className="mb-10 sm:mb-14">
            <h2 className="mb-4 text-2xl font-black text-brand-deep sm:text-4xl">What We Offer</h2>
            <div className="h-1 w-24 bg-brand-primary" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 sm:gap-6">
            {OFFERINGS.map((item, index) => (
              <article
                key={item.title}
                className={`rounded-2xl border border-slate-100 bg-slate-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8 ${
                  index === OFFERINGS.length - 1 ? 'md:col-span-2 md:mx-auto md:max-w-2xl' : ''
                }`}
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-brand-primary shadow-sm sm:mb-4 sm:h-11 sm:w-11">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-brand-deep sm:text-xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:mt-3 sm:text-base sm:leading-8">{item.text}</p>
              </article>
            ))}
          </div>
        </RevealSection>
      </section>

      <section className="border-t border-[#99D2F2]/20 bg-white px-4 py-16 sm:px-8 sm:py-24">
        <RevealSection className="mx-auto max-w-7xl">
          <div className="mb-12 text-center sm:mb-20">
            <h2 className="mb-4 text-2xl font-black text-brand-deep sm:text-4xl">Our Amazing Team</h2>
            <p className="text-slate-500">Meet the professionals driving our standards and impact.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 sm:gap-8">
            {TEAM_MEMBERS.map((member) => (
              <article key={member.role} className="group text-center">
                <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-[#2095D3]/10 transition-colors group-hover:bg-[#2095D3]/20 sm:mb-6 sm:h-32 sm:w-32">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h5 className="text-sm font-bold text-[#2B2A4C] sm:text-lg">{member.name}</h5>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#2095D3]">{member.role}</p>
              </article>
            ))}
          </div>
        </RevealSection>
      </section>

      <section className="px-8 py-24">
        <RevealSection className="mx-auto max-w-5xl rounded-3xl bg-brand-deep p-12 text-center md:p-16">
          <h2 className="text-4xl font-black text-white">Want to Learn More?</h2>
          <p className="mt-5 text-lg text-white/80">
            We'd love to connect with you and answer any questions you might have
          </p>
          <Link
            to="/contact-support"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-primary px-8 py-3 font-bold text-white transition-all hover:scale-105 hover:bg-[#1A7BB1]"
          >
            Contact Support <ArrowRight className="h-4 w-4" />
          </Link>
        </RevealSection>
      </section>

      <PublicFooter />
      <PublicSupportChat />
    </div>
  );
}

export default AboutPage;

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
  UserCircle2,
  Wrench,
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import PublicSupportChat from '../components/PublicSupportChat';

const HERO_SLIDES = [
  'https://images.unsplash.com/photo-1544476915-ed1370594142?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1499678329028-101435549a4e?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80',
];

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
  },
  {
    name: 'Capt. Dele Ore',
    role: 'Director, Business & Strategy',
  },
  {
    name: 'Engr. C.O. Ayo-Ariyo',
    role: 'Accountable Manager',
  },
  {
    name: 'Engr. Teku Silvanus',
    role: 'Director, Quality',
  },
  {
    name: 'ABC XYZ',
    role: 'Chief Ground Instructor',
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
            <p className="max-w-3xl text-xl font-light tracking-wide text-white/90 md:text-2xl">
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
        <RevealSection className="mx-auto grid max-w-7xl items-center gap-20 md:grid-cols-2">
          <div className="space-y-8">
            <div className="inline-block border-l-4 border-brand-primary bg-brand-accent/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-brand-primary">
              Our Story
            </div>
            <h2 className="font-display text-4xl font-black leading-tight text-brand-deep md:text-5xl">
              Built on Aviation Excellence Since 1993
            </h2>
            <p className="text-lg font-light leading-relaxed text-slate-600">
              Incorporated on October 21, 1993, Aeroconsult Ltd. is a premier specialist aviation technical consultancy and training firm based in Nigeria. As a Company Limited by Shares, we have established ourselves as a leader in providing comprehensive solutions to the aviation and allied industries, including specialized services for Oil & Gas organizations.
            </p>
            <div className="border-l-8 border-brand-primary bg-slate-50 p-8 shadow-sm">
              <p className="text-xl font-semibold italic text-brand-deep">
                We operate as an Approved Training Organisation (ATO), holding NCAA Approval No: ATO/AA/002, and we are proud to be ISO 9001:2015 Certified (Certification No: QSCIPL-NIG/ARL-Q11102).
              </p>
            </div>
          </div>
          <div className="group relative">
            <div className="absolute -inset-4 rounded-xl bg-brand-accent/20 transition-colors group-hover:bg-brand-accent/30" />
            <img
              src="https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=1200&q=80"
              alt="Aeroconsult professionals"
              className="relative h-[520px] w-full rounded-lg object-cover grayscale transition-all duration-700 hover:grayscale-0 shadow-2xl"
            />
          </div>
        </RevealSection>
      </section>

      <section className="bg-[#99D2F2]/15 px-8 py-24">
        <RevealSection className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            {CORE_IDENTITY.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl bg-white p-10 text-slate-600 shadow-sm transition-shadow duration-300 hover:shadow-md"
              >
                <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2095D3] to-[#45A1D6] text-white">
                  <item.icon className="h-8 w-8" />
                </div>
                <h3 className="mb-4 text-2xl font-black text-brand-deep">{item.title}</h3>
                <p className="text-base leading-8 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </RevealSection>
      </section>

      <section className="bg-white py-32 px-container-padding">
        <RevealSection className="mx-auto max-w-7xl">
          <div className="mb-14">
            <h2 className="mb-4 text-4xl font-black text-brand-deep">What We Offer</h2>
            <div className="h-1 w-24 bg-brand-primary" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {OFFERINGS.map((item, index) => (
              <article
                key={item.title}
                className={`rounded-2xl border border-slate-100 bg-slate-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  index === OFFERINGS.length - 1 ? 'md:col-span-2 md:mx-auto md:max-w-2xl' : ''
                }`}
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white text-brand-primary shadow-sm">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-brand-deep">{item.title}</h3>
                <p className="mt-3 leading-8 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </RevealSection>
      </section>

      <section className="border-t border-[#99D2F2]/20 bg-white px-8 py-24">
        <RevealSection className="mx-auto max-w-7xl">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-4xl font-black text-brand-deep">Our Amazing Team</h2>
            <p className="text-slate-500">Meet the professionals driving our standards and impact.</p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
            {TEAM_MEMBERS.map((member) => (
              <article key={member.role} className="group text-center">
                <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-[#2095D3]/10 text-[#2095D3] transition-colors group-hover:bg-[#2095D3]/20">
                  <UserCircle2 className="h-14 w-14" />
                </div>
                <h5 className="text-lg font-bold text-[#2B2A4C]">{member.name}</h5>
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

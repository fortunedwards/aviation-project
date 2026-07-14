import { Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const quickLinks = [
  { label: 'About', to: '/about' },
  { label: 'Calendar', to: '/training-calendar' },
  { label: 'Courses', to: '/courses' },
  { label: 'Gallery', to: '/gallery' },
];

const programLinks = [
  {
    label: 'Flight Dispatcher/Flight Operations Officer (Basic) (FDB)',
    to: '/courses/flight-dispatcher-flight-operations-officer-basic-fdb',
  },
  {
    label: 'Cabin Crew (Initial) Training (CCI)',
    to: '/courses/cabin-crew-initial-training-cci',
  },
  {
    label: 'Aircraft Maintenance Licence Preparatory Course (AMLPC) (A&P)',
    to: '/courses/aircraft-maintenance-licence-preparatory-course-amlpc-ap',
  },
  { label: 'Other Courses', to: '/courses' },
];

const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com' },
  { label: 'Instagram', href: 'https://www.instagram.com' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com' },
  { label: 'X (Twitter)', href: 'https://x.com' },
];

function PublicFooter() {
  return (
    <footer className="w-full border-t border-[#99D2F2] bg-slate-50 px-8 py-12">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src="/aeroconsult_logo.jpg"
              alt="Aeroconsult"
              className="h-10 w-10 rounded-full border border-[#99D2F2] object-cover shadow-sm"
            />
            <p className="text-xl font-black tracking-tight text-slate-900">AEROCONSULT LTD.</p>
          </div>

          <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#2095D3]" />
            29 Adeniyi Jones Avenue, <br /> Off Oba Akran Avenue, <br /> Ikeja, Lagos.
          </p>

          <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#2095D3]" />
            +234 803 345 7500 <br /> +234 803 462 5878 <br /> +234 812 095 1018
          </p>

          <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#2095D3]" />
            info@aeroconsultonline.com
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-deep">Quck Links</h4>
          {quickLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-light text-slate-500 opacity-80 transition-all hover:text-[#2095D3] hover:opacity-100"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-deep">Programs</h4>
          {programLinks.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="text-sm font-light text-slate-500 opacity-80 transition-all hover:text-[#2095D3] hover:opacity-100"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-deep">Socials</h4>
          {socialLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-light text-slate-500 opacity-80 transition-all hover:text-[#2095D3] hover:opacity-100"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl border-t border-slate-200 pt-8 text-center">
        <p className="text-sm font-light uppercase tracking-tighter text-slate-500">© 2026 Aeroconsult Ltd</p>
      </div>
    </footer>
  );
}

export default PublicFooter;

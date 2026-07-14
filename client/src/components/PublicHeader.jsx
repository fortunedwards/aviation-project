import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Calendar', to: '/training-calendar' },
  { label: 'Courses', to: '/courses' },
  { label: 'Gallery', to: '/gallery' },
];

function PublicHeader() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const desktopLinkClass = ({ isActive }) =>
    isActive
      ? 'border-b-2 border-[#2095D3] pb-1 font-medium text-[#2095D3] transition-colors duration-200 hover:text-[#1A7BB1]'
      : 'font-medium text-slate-600 transition-colors duration-200 hover:text-[#1A7BB1]';

  const mobileLinkClass = ({ isActive }) =>
    isActive
      ? 'text-[#2095D3] text-lg font-semibold'
      : 'text-slate-700 text-lg font-medium';

  return (
    <header className="fixed top-0 z-50 h-20 w-full border-b border-[#99D2F2] bg-white/90 backdrop-blur-md">
      <div className="container-max flex h-full w-full items-center justify-between px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-3" aria-label="Aeroconsult Home">
          <img
            src="/aeroconsult_logo.jpg"
            alt="Aeroconsult"
            className="h-10 w-10 rounded-full border border-[#99D2F2] object-cover shadow-sm"
          />
          <span className="text-xl font-black tracking-tight text-slate-900">AEROCONSULT LTD.</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((item) => (
            <NavLink key={item.to} to={item.to} className={desktopLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            to="/register"
            className="rounded-full bg-[#2095D3] px-6 py-2 font-medium text-white transition-transform hover:bg-[#1A7BB1] active:scale-90"
          >
            Register
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-[#2095D3] px-6 py-2 font-medium text-[#2095D3] transition-colors hover:bg-[#2095D3] hover:text-white"
          >
            Login
          </Link>
        </div>

        <button
          type="button"
          aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="text-slate-700 md:hidden"
        >
          {isMobileOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      {isMobileOpen && (
        <div className="border-t border-[#99D2F2] bg-white px-6 py-6 md:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((item) => (
              <NavLink key={item.to} to={item.to} className={mobileLinkClass} onClick={() => setIsMobileOpen(false)}>
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/register"
              onClick={() => setIsMobileOpen(false)}
              className="mt-2 inline-flex w-fit rounded-full bg-[#2095D3] px-6 py-2 font-medium text-white"
            >
              Register
            </Link>
            <Link
              to="/login"
              onClick={() => setIsMobileOpen(false)}
              className="inline-flex w-fit rounded-full border border-[#2095D3] px-6 py-2 font-medium text-[#2095D3]"
            >
              Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export default PublicHeader;

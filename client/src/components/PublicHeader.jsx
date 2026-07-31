import { useEffect, useState } from 'react';
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
  const [isScrolled, setIsScrolled] = useState(false);

  const desktopLinkClass = ({ isActive }) =>
    isScrolled
      ? isActive
        ? 'border-b-2 border-[#2095D3] pb-1 font-medium text-[#2095D3] transition-colors duration-200 hover:text-[#1A7BB1]'
        : 'font-medium text-slate-600 transition-colors duration-200 hover:text-[#1A7BB1]'
      : isActive
        ? 'border-b-2 border-white pb-1 font-medium text-white transition-colors duration-200 hover:text-white/80'
        : 'font-medium text-white/90 transition-colors duration-200 hover:text-white';

  const mobileLinkClass = ({ isActive }) =>
    isActive
      ? 'text-[#2095D3] text-lg font-semibold'
      : 'text-slate-700 text-lg font-medium';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 z-50 h-16 w-full border-b backdrop-blur-md transition-all duration-300 md:h-20 ${
          isScrolled
            ? 'border-[#99D2F2] bg-white/90 shadow-sm'
            : 'border-transparent bg-transparent'
        }`}
      >
        <div className="container-max flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 sm:gap-3"
            aria-label="Aeroconsult Home"
          >
            <img
              src="/aeroconsult_logo.jpg"
              alt="Aeroconsult"
              className={`h-10 w-10 rounded-full object-cover shadow-sm transition-colors duration-300 ${
                isScrolled ? 'border border-[#99D2F2]' : 'border border-white/40'
              }`}
            />
            <span
              className={`hidden whitespace-nowrap text-lg font-black tracking-tight transition-colors duration-300 2xl:inline 2xl:text-xl ${
                isScrolled ? 'text-slate-900' : 'text-white'
              }`}
            >
              AEROCONSULT LTD.
            </span>
          </Link>

          <div className="ml-auto hidden items-center gap-10 md:flex">
            <nav className="flex items-center gap-8">
              {NAV_LINKS.map((item) => (
                <NavLink key={item.to} to={item.to} className={desktopLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <Link
                to="/register"
                className={`rounded-full px-6 py-2 font-medium transition-transform active:scale-90 ${
                  isScrolled
                    ? 'bg-[#2095D3] text-white hover:bg-[#1A7BB1]'
                    : 'border border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20'
                }`}
              >
                Register
              </Link>
              <Link
                to="/login"
                className={`rounded-full px-6 py-2 font-medium transition-colors ${
                  isScrolled
                    ? 'border border-[#2095D3] text-[#2095D3] hover:bg-[#2095D3] hover:text-white'
                    : 'border border-white/30 text-white hover:bg-white/15'
                }`}
              >
                Login
              </Link>
            </div>
          </div>

          <button
            type="button"
            aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsMobileOpen((prev) => !prev)}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full border bg-transparent shadow-none transition-colors duration-200 md:hidden ${
              isScrolled
                ? 'border-transparent text-slate-700 hover:bg-slate-100'
                : 'border-white/30 text-white hover:bg-white/10'
            }`}
          >
            {isMobileOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
      </header>

      {isMobileOpen && (
        <div
          className={`fixed right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-[#99D2F2] bg-white p-6 shadow-2xl md:hidden ${
            isScrolled ? 'top-20' : 'top-16'
          }`}
        >
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
    </>
  );
}

export default PublicHeader;

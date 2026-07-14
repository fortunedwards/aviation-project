import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

function PublicPlaceholderPage({ title, description }) {
  return (
    <div className="min-h-screen bg-white text-[#2B2A4C]">
      <PublicHeader />
      <main className="container-max px-6 pt-40 pb-24 lg:px-12">
        <div className="rounded-xl border border-[#99D2F2]/50 bg-[#99D2F2]/10 p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2095D3]">Coming Soon</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[#2B2A4C]/75">{description}</p>
          <Link
            to="/"
            className="mt-8 inline-flex rounded-lg bg-[#2095D3] px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#1b85bd]"
          >
            Back to Home
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

export default PublicPlaceholderPage;

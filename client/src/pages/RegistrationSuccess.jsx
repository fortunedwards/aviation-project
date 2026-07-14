import React from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, FileCheck2, PlaneTakeoff, UserRoundSearch } from 'lucide-react';
import AviationSidePanel from '../components/AviationSidePanel';

const dossierCardClass =
  'flex items-center gap-4 rounded-[24px] border border-[#BDE3F6] bg-white p-4 shadow-[0_12px_35px_rgba(29,53,87,0.06)] transition-colors duration-300 hover:border-[#2095D3]';

const DossierCard = ({ icon: Icon, label, value }) => (
  <div className={dossierCardClass}>
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D9F0FF] text-[#2095D3]">
      <Icon size={20} strokeWidth={2.2} />
    </div>
    <div className="min-w-0">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </p>
      <p className="text-sm font-medium leading-6 text-[#1D3557]">{value || 'Not available'}</p>
    </div>
  </div>
);

const RoadmapStep = ({ number, title, description, active = false }) => (
  <div className="relative flex items-start gap-4">
    <div
      className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold uppercase tracking-[0.16em] ${
        active
          ? 'bg-[#2095D3] text-white'
          : 'border-2 border-[#BDE3F6] bg-[#F7FBFF] text-[#2095D3]'
      }`}
    >
      {number}
    </div>
    <div className={`pt-1 ${active ? '' : 'opacity-70'}`}>
      <p className="text-sm font-medium text-[#1D3557]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  </div>
);

const RegistrationSuccess = () => {
  const [searchParams] = useSearchParams();

  const applicationId = searchParams.get('applicationId');
  const email = searchParams.get('email');
  const courseTitle = searchParams.get('courseTitle');
  const fullName = searchParams.get('fullName');
  const paymentStatus = searchParams.get('paymentStatus');
  const paymentReference = searchParams.get('paymentReference');

  if (!applicationId || !email) {
    return <Navigate to="/register" replace />;
  }

  const applicantName = fullName || 'Applicant name pending';
  const programName = courseTitle || 'Selected program pending';
  const referenceLine = [applicationId, paymentStatus === 'Paid' ? 'PMT-OK' : 'PMT-PENDING']
    .filter(Boolean)
    .join(' • ');

  return (
    <div className="min-h-screen bg-[#F4FAFF] text-[#1D3557]">
      <div className="flex min-h-screen">
        <AviationSidePanel
          asideClassName="md:block md:w-[40%]"
          contentClassName="relative flex h-full flex-col justify-start p-10 xl:p-14"
        >
          <div className="space-y-5 text-white">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/12 px-4 py-3 backdrop-blur-sm">
              <img
                src="/aeroconsult_logo.jpg"
                alt="Aeroconsult logo"
                className="h-10 w-10 rounded-full border border-white/30 object-cover shadow-sm"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                  Aeroconsult Ltd.
                </p>
                <p className="text-sm font-bold tracking-tight text-white">Admissions Portal</p>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/15 bg-white/10 p-7 text-white backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                Admissions Queue
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Pending review</h2>
              <p className="mt-4 text-sm leading-7 text-white/80">
                Your application has been submitted successfully and is being reviewed by Aeroconsult Ltd. After the review, you will be contacted via email address or phone on the next steps.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                    Application ID
                  </p>
                  <p className="mt-2 text-lg font-semibold">{applicationId}</p>
                </div>
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                    Payment Status
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {paymentStatus === 'Paid' ? 'Registration fee received' : 'Awaiting confirmation'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AviationSidePanel>

        <main className="relative z-10 flex w-full flex-col items-center justify-center bg-[#FCFEFF] px-6 py-10 md:w-[60%] md:px-10 lg:px-14">
          <div className="w-full max-w-[480px]">
            <header className="mb-10 animate-in fade-in duration-500">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#BDE3F6] bg-[#EAF7FF] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2095D3]">
                <BadgeCheck size={16} strokeWidth={2.2} />
                Application received
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#1D3557] sm:text-[2.7rem]">
                Application received. What&apos;s next?
              </h1>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#45A1D6]">
                Reference Details
              </p>
            </header>

            <section className="mb-10 flex flex-col gap-3 animate-in fade-in duration-500">
              <DossierCard icon={UserRoundSearch} label="Full Name" value={applicantName} />
              <DossierCard icon={PlaneTakeoff} label="Course Of Study" value={programName} />
              <DossierCard icon={FileCheck2} label="Application Reference" value={referenceLine} />
            </section>

            <section className="mb-10 pl-2 animate-in fade-in duration-500">
              <div className="relative flex flex-col gap-6">
                <div className="absolute bottom-8 left-4 top-4 w-[2px] bg-[#BDE3F6]" />

                <RoadmapStep
                  number="1"
                  title="Queue for Admissions Review"
                  description="Your submission is now under evaluation by the admissions panel."
                  active
                />
                <RoadmapStep
                  number="2"
                  title="Finalize Enrollment"
                  description={
                    paymentStatus === 'Paid'
                      ? 'Payment has been logged. Final remarks will follow after approval.'
                      : 'Tuition fee confirmation and staff remarks will follow after approval.'
                  }
                />
                <RoadmapStep
                  number="3"
                  title="Access Student Portal"
                  description="Portal credentials will be shared after your clearance is complete."
                />
              </div>
            </section>

           
            <div className="mt-auto flex flex-col gap-4 animate-in fade-in duration-500">
              <Link
                to="/status-tracker"
                className="inline-flex w-full items-center justify-center rounded-full bg-[#2095D3] px-6 py-4 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#167CB3]"
              >
                Track Application Status
              </Link>

              <Link
                to="/"
                className="inline-flex w-full items-center justify-center gap-2 border-b-2 border-transparent py-3 text-sm font-semibold text-[#1A7BB1] transition-colors duration-300 hover:border-[#1A7BB1]"
              >
                <ArrowLeft size={16} strokeWidth={2.2} />
                Return Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RegistrationSuccess;

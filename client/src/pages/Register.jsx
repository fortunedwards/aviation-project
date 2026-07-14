import React, { useEffect, useRef, useState } from 'react';
import { createSearchParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { usePaystackPayment } from 'react-paystack';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  CheckCircle2,
  FileText,
  IdCard,
  PencilLine,
  UserSquare2,
  X,
  XCircle,
} from 'lucide-react';
import PassportCropper from '../components/PassportCropper';
import AviationSidePanel from '../components/AviationSidePanel';
import PublicSupportChat from '../components/PublicSupportChat';
import { usePopup } from '../components/context/PopupProvider';
import SelectField from '../components/context/SelectField';

const JOURNEY_STEPS = [
  {
    id: 1,
    title: 'Identity & Course',
    eyebrow: 'Step 1',
    description: 'Begin with your course selection and core personal details.',
    shortLabel: 'Identity',
  },
  {
    id: 2,
    title: 'Contact & Emergency',
    eyebrow: 'Step 2',
    description: 'Share your contact channels and next-of-kin information.',
    shortLabel: 'Contact',
  },
  {
    id: 3,
    title: 'Education & Background',
    eyebrow: 'Step 3',
    description: 'Add your academic history, aviation training, and documents.',
    shortLabel: 'Background',
  },
  {
    id: 4,
    title: 'Review & Payment',
    eyebrow: 'Final Review',
    description: 'Confirm your application details before payment and submission.',
    shortLabel: 'Review',
  },
];

const inputClass =
  'w-full bg-transparent border-0 border-b border-[#99D2F2] px-0 pb-3 pt-2 text-[15px] text-on-surface outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-b-2 focus:border-[#2095D3] focus:ring-0';
const textareaClass = `${inputClass} min-h-[108px] resize-none`;
const pillButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#2095D3] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#1A7BB1] disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full border border-[#45A1D6] px-6 py-3 text-sm font-semibold text-[#2095D3] transition-all duration-200 hover:bg-[#2095D3]/5';

const UploadIcon = ({ icon: Icon, className = '', size = 20 }) => (
  <Icon size={size} className={className} strokeWidth={2.2} />
);

const Label = ({ children, htmlFor, optional = false }) => (
  <label
    htmlFor={htmlFor}
    className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#45A1D6]"
  >
    {children}
    {optional && <span className="ml-2 normal-case tracking-normal text-slate-400">Optional</span>}
  </label>
);

const StepIndicator = ({ currentStep, onStepClick, canJumpToStep }) => (
  <nav aria-label="Progress" className="mb-10">
    <ol className="grid grid-cols-4 gap-3" role="list">
      {JOURNEY_STEPS.map((item, index) => {
        const isDone = item.id < currentStep;
        const isActive = item.id === currentStep;
        const isLast = index === JOURNEY_STEPS.length - 1;

        return (
          <li key={item.id} className="relative">
            {!isLast && (
              <div aria-hidden="true" className="absolute left-1/2 right-[-50%] top-5 z-0 hidden sm:block">
                <div className={`h-[2px] w-full ${isDone ? 'bg-[#2095D3]' : 'bg-[#99D2F2]'}`} />
              </div>
            )}

            <button
              type="button"
              onClick={() => onStepClick(item.id)}
              disabled={!canJumpToStep(item.id)}
              aria-current={isActive ? 'step' : undefined}
              className={`relative z-10 flex w-full flex-col items-center gap-3 text-center transition-all duration-200 ${
                !canJumpToStep(item.id) ? 'cursor-not-allowed opacity-50' : ''
              }`}
            >
              <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#F7FBFF]">
                <span
                  className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-200 ${
                    isDone
                      ? 'border-[#2095D3] bg-[#2095D3] text-white'
                      : isActive
                        ? 'border-[#2095D3] bg-[#2095D3] text-white shadow-[0_0_0_6px_rgba(32,149,211,0.12)]'
                        : 'border-[#99D2F2] bg-white text-[#45A1D6]'
                  }`}
                >
                  {isDone ? (
                    <Check size={18} strokeWidth={2.6} />
                  ) : (
                    item.id
                  )}
                </span>
              </span>
              <span className={`text-xs font-medium ${
                isActive ? 'text-[#1A7BB1]' : isDone ? 'text-[#2095D3]' : 'text-slate-500'
              }`}>
                {item.shortLabel}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);

const UploadCard = ({
  title,
  subtitle,
  icon: Icon,
  fileName,
  preview,
  onClick,
  onClear,
  variant = 'default',
}) => (
  <div>
    <Label>{title}</Label>
    <button
      type="button"
      onClick={onClick}
      className={`group w-full text-left transition-all duration-200 ${
        variant === 'passport'
          ? 'relative inline-flex w-[148px] shrink-0 rounded-[24px] border border-[#BFE2F5] bg-[#F7FCFF] p-2 shadow-[0_18px_40px_rgba(32,149,211,0.08)] hover:border-[#2095D3] hover:bg-[#EFF8FF]'
          : 'flex items-center gap-4 rounded-[28px] border border-dashed border-[#99D2F2] bg-[#F5FBFF] px-5 py-5 hover:border-[#2095D3] hover:bg-[#EAF7FF]'
      }`}
    >
      {variant === 'passport' ? (
        <div className="relative flex w-full items-center justify-center rounded-[20px] border border-dashed border-[#99D2F2] bg-white p-2">
          {fileName && (
            <span
              onClick={(event) => {
                event.stopPropagation();
                onClear();
              }}
              className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1 text-slate-400 shadow-sm transition-colors hover:text-red-500"
            >
              <X size={18} strokeWidth={2.2} />
            </span>
          )}
          <div className="flex aspect-[35/45] w-full items-center justify-center rounded-[18px] bg-[#EAF6FD]">
            {preview ? (
              <img src={preview} alt={title} className="h-full w-full rounded-[18px] object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#F8FDFF_0%,#DDEFFA_100%)]">
                <UploadIcon icon={Icon} size={20} className="mt-4 text-[#45A1D6]" />
                <p className="mt-4 px-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4D97C1]">
                  Upload Passport Photograph
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-[#2095D3] shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
            {preview ? (
              <img src={preview} alt={title} className="h-full w-full rounded-full object-cover" />
            ) : (
              <UploadIcon icon={Icon} size={24} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#1D3557]">
              {fileName || `Upload ${title}`}
            </p>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          {fileName && (
            <span
              onClick={(event) => {
                event.stopPropagation();
                onClear();
              }}
              className="text-slate-400 transition-colors hover:text-red-500"
            >
              <X size={20} strokeWidth={2.2} />
            </span>
          )}
        </>
      )}
    </button>
  </div>
);

const SummaryItem = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#45A1D6]">{label}</p>
    <p className="text-sm leading-6 text-[#1D3557]">{value || 'Not provided'}</p>
  </div>
);

const SummarySection = ({ title, onEdit, children }) => (
  <section className="rounded-[28px] border border-[#D6EAF7] bg-white p-6 shadow-[0_18px_50px_rgba(29,53,87,0.06)]">
    <div className="mb-5 flex items-center justify-between gap-4 border-b border-[#D6EAF7] pb-4">
      <h2 className="text-xl font-semibold text-[#1D3557]">{title}</h2>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1 text-sm font-medium text-[#2095D3] transition-colors hover:text-[#1A7BB1]"
      >
        <PencilLine size={18} strokeWidth={2.2} />
        Edit
      </button>
    </div>
    {children}
  </section>
);

const Register = () => {
  const popup = usePopup();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseIdFromURL = searchParams.get('courseId');
  const courseSlugFromURL = searchParams.get('courseSlug');

  const [step, setStep] = useState(1);
  const [acceptedDeclaration, setAcceptedDeclaration] = useState(false);

  const [passportFile, setPassportFile] = useState(null);
  const [passportPreview, setPassportPreview] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [certFile, setCertFile] = useState(null);

  const passportInputRef = useRef();
  const certInputRef = useRef();

  const [availableCourses, setAvailableCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [emailValid, setEmailValid] = useState(null);
  const courses = Array.isArray(availableCourses)
    ? availableCourses
    : Array.isArray(availableCourses?.data)
      ? availableCourses.data
      : [];
  const safeSteps = Array.isArray(JOURNEY_STEPS) ? JOURNEY_STEPS : [];

  const [formData, setFormData] = useState({
    surname: '',
    other_names: '',
    email: '',
    password: '',
    dob: '',
    place_of_birth: '',
    sex: '',
    state_of_origin: '',
    nationality: 'Nigerian',
    org_pos: '',
    address: '',
    phone: '',
    nok_name: '',
    nok_phone: '',
    nok_relation: '',
    education: '',
    technical: '',
    qualifications: '',
    experience: '',
    selectedCourse: courseIdFromURL || '',
  });

  useEffect(() => {
    api
      .get('/api/courses')
      .then((res) => setAvailableCourses(Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => {})
      .finally(() => setCoursesLoading(false));
  }, []);

  useEffect(() => {
    if (!courseSlugFromURL || formData.selectedCourse || courses.length === 0) return;
    const matched = courses.find(
      (course) => String(course.slug || '').toLowerCase() === String(courseSlugFromURL).toLowerCase()
    );
    if (matched?.id) {
      setFormData((current) => ({ ...current, selectedCourse: String(matched.id) }));
    }
  }, [courseSlugFromURL, formData.selectedCourse, courses]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));

    if (name === 'email') {
      setEmailValid(value ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) : null);
    }
  };

  const handlePassportSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    event.target.value = '';
  };

  const handleCropConfirm = (croppedFile) => {
    setPassportFile(croppedFile);
    setPassportPreview(URL.createObjectURL(croppedFile));
    setCropSrc(null);
  };

  const clearPassport = () => {
    setPassportFile(null);
    setPassportPreview(null);
    if (passportInputRef.current) passportInputRef.current.value = '';
  };

  const clearCertificate = () => {
    setCertFile(null);
    if (certInputRef.current) certInputRef.current.value = '';
  };

  const selectedCourseDetails = courses.find(
    (course) => String(course.id) === String(formData.selectedCourse)
  );
  const amount = selectedCourseDetails ? parseFloat(selectedCourseDetails.form_fee || 0) * 100 : 0;
  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount / 100 || 0);

  const config = {
    reference: new Date().getTime().toString(),
    email: formData.email,
    amount,
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_your_actual_key_here',
  };

  const initializePayment = usePaystackPayment(config);

  const stepValidation = {
    1:
      !!formData.selectedCourse &&
      !!formData.surname &&
      !!formData.other_names &&
      !!formData.dob &&
      !!formData.sex &&
      !!formData.place_of_birth &&
      !!formData.nationality &&
      !!formData.state_of_origin &&
      !!passportFile,
    2:
      !!formData.address &&
      !!formData.email &&
      emailValid === true &&
      !!formData.phone &&
      !!formData.nok_name &&
      !!formData.nok_phone &&
      !!formData.nok_relation,
    3:
      !!formData.education &&
      !!formData.technical &&
      !!formData.qualifications &&
      !!formData.experience &&
      !!certFile,
  };

  const canJumpToStep = (targetStep) => {
    if (targetStep <= step) return true;
    for (let current = 1; current < targetStep; current += 1) {
      if (!stepValidation[current]) return false;
    }
    return true;
  };

  const goToStep = (targetStep) => {
    if (!canJumpToStep(targetStep)) return;
    setStep(targetStep);
  };

  const handleNext = () => {
    if (!stepValidation[step]) return;
    setStep((current) => Math.min(current + 1, 4));
  };

  const handleFinalSubmit = async (paymentReference = 'FREE_REG') => {
    if (!passportFile) {
      return popup.warning('Please upload and crop your passport photograph.', {
        title: 'Passport Photo Required',
      });
    }
    if (!acceptedDeclaration) {
      return popup.warning('Please confirm the declaration before submitting.', {
        title: 'Declaration Required',
      });
    }

    const data = new FormData();
    data.append('passport', passportFile);
    if (certFile) data.append('certificates', certFile);

    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== undefined) {
        data.append(key, formData[key]);
      }
    });

    data.append('payment_ref', paymentReference);

    try {
      const response = await api.post('/api/auth/register-student', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        const query = createSearchParams({
          applicationId: String(response.data.applicationId || ''),
          email: formData.email || '',
          courseTitle: selectedCourseDetails?.title || 'Selected course',
          fullName: [formData.surname, formData.other_names].filter(Boolean).join(' '),
          paymentReference: paymentReference || 'FREE_REG',
          paymentStatus: paymentReference && paymentReference !== 'FREE_REG' ? 'Paid' : 'Pending',
        });

        navigate({
          pathname: '/registration-success',
          search: `?${query.toString()}`,
        }, { replace: true });
      }
    } catch (err) {
      if (err.response?.status === 409) {
        popup.error('An application with this email already exists.', {
          title: 'Duplicate Application',
        });
      } else if (err.response?.data?.errors) {
        popup.error('Please correct the highlighted validation issues and try again.', {
          title: 'Validation Issues',
          details: err.response.data.errors.map((e) => e.message),
        });
      } else {
        popup.error(err.response?.data?.error || 'Error submitting application.', {
          title: 'Submission Failed',
        });
      }
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();

    if (amount > 0) {
      initializePayment(
        (response) => handleFinalSubmit(response.reference),
        () => popup.info('Your payment was cancelled before completion.', {
          title: 'Payment Cancelled',
        })
      );
    } else {
      handleFinalSubmit();
    }
  };

  const currentStepMeta = safeSteps.find((item) => item.id === step) || safeSteps[0] || null;
  const fullName = [formData.surname, formData.other_names].filter(Boolean).join(' ');

  return (
    <div className="min-h-screen bg-[#F7FBFF] text-on-surface">
      {cropSrc && (
        <PassportCropper
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => {
            setCropSrc(null);
            if (passportInputRef.current) passportInputRef.current.value = '';
          }}
        />
      )}

      <div className="flex min-h-screen">
        <AviationSidePanel
          asideClassName="lg:block lg:w-[40%]"
          contentClassName="relative flex h-full flex-col justify-between p-10 xl:p-14"
        >
          {({ activeSlide, setActiveSlide, slides }) => (
            <div className="w-full space-y-5">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/12 px-4 py-3 text-white backdrop-blur-sm">
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

              <div className="rounded-[28px] border border-white/20 bg-black/15 p-6 text-white backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                  {currentStepMeta.eyebrow}
                </p>
                <div className="mt-3 space-y-3">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {currentStepMeta.title}
                    </h2>
                    <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
                      {currentStepMeta.description}
                    </p>
                  </div>

                  {selectedCourseDetails && (
                    <div className="inline-flex rounded-full bg-white/14 px-4 py-2 text-sm text-white/90">
                      <span className="font-medium">{selectedCourseDetails.title}</span>
                      <span className="mx-2 text-white/45">&bull;</span>
                      <span>{formattedAmount}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {slides.map((slide, index) => (
                  <button
                    key={slide.alt}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      index === activeSlide ? 'w-10 bg-white' : 'w-2.5 bg-white/45'
                    }`}
                    aria-label={slide.alt}
                  />
                ))}
              </div>
            </div>
          )}
        </AviationSidePanel>

        <main className="w-full overflow-y-auto lg:w-[60%]">
          <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-8 sm:px-8 lg:px-12 xl:px-16">
            <Link
              to="/"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-[#2095D3]"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#45A1D6]">
                  Aeroconsult Ltd.
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1D3557]">
                  Student Enrollment
                </h1>
              </div>

              <div className="rounded-full border border-[#BDE3F6] bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
                {currentStepMeta.eyebrow} of {JOURNEY_STEPS.length}
              </div>
            </header>

            <StepIndicator
              currentStep={step}
              onStepClick={goToStep}
              canJumpToStep={canJumpToStep}
            />

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.section
                  key="step-1"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-[32px] border border-[#D6EAF7] bg-white p-6 shadow-[0_24px_70px_rgba(29,53,87,0.06)] sm:p-8"
                >
                  <div className="grid gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <div className="min-w-0 space-y-8">
                      <div className="min-w-0 w-full">
                        <Label htmlFor="course">Select Course</Label>
                        {coursesLoading ? (
                          <div className="h-12 animate-pulse rounded-xl bg-[#EAF7FF]" />
                        ) : (
                          <SelectField
                              id="course"
                              name="selectedCourse"
                              value={formData.selectedCourse}
                              onChange={onChange}
                              required
                              searchable
                              placeholder="Select a program..."
                            >
                            <option value="">Select a program...</option>
                            {availableCourses.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.title} (Reg Fee: ₦{course.form_fee || 0})
                              </option>
                            ))}
                          </SelectField>
                        )}
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <Label htmlFor="surname">Surname</Label>
                          <input
                            id="surname"
                            name="surname"
                            type="text"
                            value={formData.surname}
                            onChange={onChange}
                            className={inputClass}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="other_names">Other Names</Label>
                          <input
                            id="other_names"
                            name="other_names"
                            type="text"
                            value={formData.other_names}
                            onChange={onChange}
                            className={inputClass}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="dob">Date of Birth</Label>
                          <input
                            id="dob"
                            name="dob"
                            type="date"
                            value={formData.dob}
                            onChange={onChange}
                            className={inputClass}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="sex">Sex</Label>
                          <SelectField
                              id="sex"
                              name="sex"
                              value={formData.sex}
                              onChange={onChange}
                              required
                              placeholder="Select sex"
                            >
                            <option value="">Select sex</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </SelectField>
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="place_of_birth">Place of Birth</Label>
                          <input
                            id="place_of_birth"
                            name="place_of_birth"
                            type="text"
                            value={formData.place_of_birth}
                            onChange={onChange}
                            className={inputClass}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="nationality">Nationality</Label>
                          <input
                            id="nationality"
                            name="nationality"
                            type="text"
                            value={formData.nationality}
                            onChange={onChange}
                            className={inputClass}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="state_of_origin">State of Origin</Label>
                          <input
                            id="state_of_origin"
                            name="state_of_origin"
                            type="text"
                            value={formData.state_of_origin}
                            onChange={onChange}
                            className={inputClass}
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="org_pos" optional>
                            Current Organization / Position
                          </Label>
                          <input
                            id="org_pos"
                            name="org_pos"
                            type="text"
                            value={formData.org_pos}
                            onChange={onChange}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 space-y-6">
                      <UploadCard
                        title="Passport Photograph"
                        icon={Camera}
                        fileName={passportFile?.name}
                        preview={passportPreview}
                        onClick={() => passportInputRef.current?.click()}
                        onClear={clearPassport}
                        variant="passport"
                      />

                      <input
                        ref={passportInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePassportSelect}
                        className="hidden"
                      />

                      <div className="flex h-[240px] flex-col rounded-[28px] bg-[#0F4C75] p-6 text-white">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                          Enrollment Checklist
                        </p>
                        <ul className="mt-4 flex-1 space-y-4 text-sm text-white/90">
                          <li className="flex gap-3">
                            <CheckCircle2 size={18} className="text-[#8ED8FF]" strokeWidth={2.2} />
                            Choose the course you want to begin with.
                          </li>
                          <li className="flex gap-3">
                            <IdCard size={18} className="text-[#8ED8FF]" strokeWidth={2.2} />
                            Match your legal names to your identity documents.
                          </li>
                          <li className="flex gap-3">
                            <UserSquare2 size={18} className="text-[#8ED8FF]" strokeWidth={2.2} />
                            Upload a clear passport photo before proceeding.
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!stepValidation[1]}
                      className={pillButtonClass}
                    >
                      Next
                      <ArrowRight size={18} strokeWidth={2.4} />
                    </button>
                  </div>
                </motion.section>
              )}

              {step === 2 && (
                <motion.section
                  key="step-2"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-[32px] border border-[#D6EAF7] bg-white p-6 shadow-[0_24px_70px_rgba(29,53,87,0.06)] sm:p-8"
                >
                  <div className="space-y-10">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Residential / Mailing Address</Label>
                        <textarea
                          id="address"
                          name="address"
                          rows={4}
                          value={formData.address}
                          onChange={onChange}
                          placeholder="Enter your full address"
                          className={textareaClass}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                          <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={onChange}
                            className={`${inputClass} pr-10`}
                            required
                          />
                          {emailValid === true && (
                            <CheckCircle2
                              size={18}
                              className="absolute right-0 top-1/2 -translate-y-1/2 text-emerald-500"
                              strokeWidth={2.4}
                            />
                          )}
                          {emailValid === false && (
                            <XCircle
                              size={18}
                              className="absolute right-0 top-1/2 -translate-y-1/2 text-error"
                              strokeWidth={2.4}
                            />
                          )}
                        </div>
                        {emailValid === false && (
                          <p className="mt-2 text-xs text-error">Enter a valid email address.</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={onChange}
                          className={inputClass}
                          required
                        />
                      </div>
                    </div>

                    <div className="rounded-[28px] bg-[#F8FCFF] p-6">
                      <div className="mb-6">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#45A1D6]">
                          Emergency Contact
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-[#1D3557]">
                          Next of kin details
                        </h3>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <Label htmlFor="nok_name">Full Name</Label>
                          <input
                            id="nok_name"
                            name="nok_name"
                            type="text"
                            value={formData.nok_name}
                            onChange={onChange}
                            placeholder="Next of kin full name"
                            className={inputClass}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="nok_phone">Phone Number</Label>
                          <input
                            id="nok_phone"
                            name="nok_phone"
                            type="tel"
                            value={formData.nok_phone}
                            onChange={onChange}
                            className={inputClass}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="nok_relation">Relationship</Label>
                          <input
                            id="nok_relation"
                            name="nok_relation"
                            type="text"
                            value={formData.nok_relation}
                            onChange={onChange}
                            placeholder="Parent, sibling, spouse..."
                            className={inputClass}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <button type="button" onClick={() => setStep(1)} className={secondaryButtonClass}>
                      <ArrowLeft size={18} strokeWidth={2.4} />
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!stepValidation[2]}
                      className={pillButtonClass}
                    >
                      Next
                      <ArrowRight size={18} strokeWidth={2.4} />
                    </button>
                  </div>
                </motion.section>
              )}

              {step === 3 && (
                <motion.section
                  key="step-3"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-[32px] border border-[#D6EAF7] bg-white p-6 shadow-[0_24px_70px_rgba(29,53,87,0.06)] sm:p-8"
                >
                  <div className="grid gap-6">
                    <div>
                      <Label htmlFor="education">Secondary / Tertiary Education</Label>
                      <textarea
                        id="education"
                        name="education"
                        rows={3}
                        value={formData.education}
                        onChange={onChange}
                        placeholder="Institution names, dates attend and qualifications gained"
                        className={textareaClass}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="technical">Technical / Professional Training</Label>
                      <textarea
                        id="technical"
                        name="technical"
                        rows={3}
                        value={formData.technical}
                        onChange={onChange}
                        placeholder="Aviation courses, technical programs, and certifications"
                        className={textareaClass}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="qualifications">Qualifications</Label>
                      <textarea
                        id="qualifications"
                        name="qualifications"
                        rows={3}
                        value={formData.qualifications}
                        onChange={onChange}
                        placeholder="Academic and professional qualifications"
                        className={textareaClass}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="experience">Aviation / Professional Experience</Label>
                      <textarea
                        id="experience"
                        name="experience"
                        rows={3}
                        value={formData.experience}
                        onChange={onChange}
                        placeholder="Briefly describe relevant roles and experience"
                        className={textareaClass}
                        required
                      />
                    </div>

                    <UploadCard
                      title="PDF Certificate"
                      subtitle="Upload one compiled PDF of your certificates and supporting documents."
                      icon={FileText}
                      fileName={certFile?.name}
                      preview={null}
                      onClick={() => certInputRef.current?.click()}
                      onClear={clearCertificate}
                    />

                    <input
                      ref={certInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={(event) => setCertFile(event.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </div>

                  <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <button type="button" onClick={() => setStep(2)} className={secondaryButtonClass}>
                      <ArrowLeft size={18} strokeWidth={2.4} />
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!stepValidation[3]}
                      className={pillButtonClass}
                    >
                      Review Application
                      <ArrowRight size={18} strokeWidth={2.4} />
                    </button>
                  </div>
                </motion.section>
              )}

              {step === 4 && (
                <motion.form
                  key="step-4"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={onSubmit}
                  className="space-y-6"
                >
                  <SummarySection title="Personal Details" onEdit={() => setStep(1)}>
                    <div className="grid gap-6 md:grid-cols-2">
                      <SummaryItem label="Full Name" value={fullName} />
                      <SummaryItem label="Date of Birth" value={formData.dob} />
                      <SummaryItem label="Place of Birth" value={formData.place_of_birth} />
                      <SummaryItem label="Sex" value={formData.sex} />
                      <SummaryItem label="Nationality" value={formData.nationality} />
                      <SummaryItem label="State of Origin" value={formData.state_of_origin} />
                      <SummaryItem label="Organization / Position" value={formData.org_pos} />
                      <SummaryItem
                        label="Passport Photo"
                        value={passportFile ? passportFile.name : 'Uploaded'}
                      />
                    </div>
                  </SummarySection>

                  <SummarySection title="Course & Contact" onEdit={() => setStep(2)}>
                    <div className="grid gap-6 md:grid-cols-2">
                      <SummaryItem label="Selected Course" value={selectedCourseDetails?.title} />
                      <SummaryItem label="Registration Fee" value={formattedAmount} />
                      <SummaryItem label="Email Address" value={formData.email} />
                      <SummaryItem label="Phone Number" value={formData.phone} />
                      <SummaryItem label="Residential Address" value={formData.address} />
                      <SummaryItem label="Next of Kin" value={formData.nok_name} />
                      <SummaryItem label="NOK Phone" value={formData.nok_phone} />
                      <SummaryItem label="Relationship" value={formData.nok_relation} />
                    </div>
                  </SummarySection>

                  <SummarySection title="Education & Background" onEdit={() => setStep(3)}>
                    <div className="grid gap-6">
                      <SummaryItem label="Education" value={formData.education} />
                      <SummaryItem label="Technical Training" value={formData.technical} />
                      <SummaryItem label="Qualifications" value={formData.qualifications} />
                      <SummaryItem label="Experience" value={formData.experience} />
                      <SummaryItem label="Supporting PDF" value={certFile?.name} />
                    </div>
                  </SummarySection>

                  <section className="rounded-[28px] border border-[#D6EAF7] bg-white p-6 shadow-[0_18px_50px_rgba(29,53,87,0.06)]">
                    <label className="flex cursor-pointer items-start gap-4">
                      <div className="relative mt-1 flex h-5 w-5 shrink-0 items-center justify-center">
                        <input
                          type="checkbox"
                          checked={acceptedDeclaration}
                          onChange={(event) => setAcceptedDeclaration(event.target.checked)}
                          className="peer h-5 w-5 appearance-none rounded-[4px] border border-[#45A1D6] bg-white transition-colors checked:border-[#2095D3] checked:bg-[#2095D3]"
                        />
                        <Check
                          size={14}
                          strokeWidth={3}
                          className="pointer-events-none absolute text-white opacity-0 transition-opacity peer-checked:opacity-100"
                        />
                      </div>
                      <span className="text-sm leading-6 text-slate-600">
                        I declare that all information provided is true and accurate to the best
                        of my knowledge. I understand that false information may lead to
                        disqualification.
                      </span>
                    </label>
                  </section>

                  <div className="flex flex-col gap-3 rounded-[28px] border border-[#D6EAF7] bg-white p-6 shadow-[0_18px_50px_rgba(29,53,87,0.06)] sm:flex-row sm:items-center sm:justify-between">
                    <button type="button" onClick={() => setStep(3)} className={secondaryButtonClass}>
                      <ArrowLeft size={18} strokeWidth={2.4} />
                      Back
                    </button>

                    <button
                      type="submit"
                      disabled={!acceptedDeclaration}
                      className={`${pillButtonClass} sm:min-w-[240px]`}
                    >
                      {amount > 0 ? `Pay ${formattedAmount} & Submit` : 'Submit Application'}
                      <BadgeCheck size={18} strokeWidth={2.4} />
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
      <PublicSupportChat />
    </div>
  );
};

export default Register;

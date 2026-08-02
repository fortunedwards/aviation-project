export const HOME_HERO_SLIDES = [
  'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1519666336592-e225a99dcd2f?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1524592714635-d77511a4834d?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1725653387938-0003bc52ccf5?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
];

export const HOME_UPCOMING_TRAINING_IMAGES = [
  `${import.meta.env.BASE_URL}fdb.png`,
  `${import.meta.env.BASE_URL}cabin.png`,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCD-q1gygpZVGEVU22F3cmEQak9b_h4apPW9hA9XPgyKYrbe0a3n-jS1L32yUcdXkHrwD8VFNLqrNPSNE5INXJ7f5gkVXmGJxcWVzyQ7R9mgS0N-TQvsQcKgArds-DzC70fhuo-sS9g522NXH7evDRn50sjN8qsIdPXvqKAkMqSztrXDRMqoZ0Qn-jZEgMYyERqcZkR6hls2zdibvUMiL38nZqm3RbcWMJArU6Q_ULKspJOVMsNd26KyJjt_IB3XXuQfJe9nlwyoYcB',
];

export const HOME_FEATURE_IMAGE = `${import.meta.env.BASE_URL}home1.png`;

export const ABOUT_HERO_SLIDES = [
  `${import.meta.env.BASE_URL}home1.png`,
  `${import.meta.env.BASE_URL}cabin.png`,
  `${import.meta.env.BASE_URL}fdb.png`,
];

export const ABOUT_IMAGE = HOME_FEATURE_IMAGE;

export const COURSE_CARD_IMAGES = [
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1499678329028-101435549a4e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1529074963764-98f45c47344b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1544476915-ed1370594142?auto=format&fit=crop&w=1200&q=80',
];

export const COURSE_DETAILS_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1499678329028-101435549a4e?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1529074963764-98f45c47344b?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1544476915-ed1370594142?auto=format&fit=crop&w=1400&q=80',
];

const normalizeTitle = (value) =>
  String(value ?? '')
    .normalize('NFKD')
    .replace(/[’'`]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const COURSE_IMAGE_OVERRIDES = new Map([
  ['airworthiness course awc', `${import.meta.env.BASE_URL}awc.png`],
  ['aircraft maintenance planning and control ampc', `${import.meta.env.BASE_URL}ampc.png`],
  ['aviation stores management asm', `${import.meta.env.BASE_URL}asm.png`],
  ['airline management am', `${import.meta.env.BASE_URL}am.png`],
  ['quality management systems for airlines qms', `${import.meta.env.BASE_URL}qms.png`],
  ['aircraft maintenance management amm', `${import.meta.env.BASE_URL}amm.png`],
]);

export const getCourseHeroImage = (course, fallbackIndex = 0) => {
  const override = COURSE_IMAGE_OVERRIDES.get(normalizeTitle(course?.title));
  if (override) return override;

  return COURSE_DETAILS_HERO_IMAGES[fallbackIndex % COURSE_DETAILS_HERO_IMAGES.length];
};

export const COURSE_DETAILS_SNEAK_PEEK_IMAGES = [
  'https://images.unsplash.com/photo-1494412685616-a5d310fbb07d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
];

export const AVIATION_SIDE_PANEL_SLIDES = [
  {
    image:
      'https://images.unsplash.com/photo-1503468120394-03d29a34a0bf?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
    alt: 'Airline cockpit with pilots during flight',
  },
  {
    image:
      'https://images.unsplash.com/photo-1752579664702-e6609516e21a?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
    alt: 'Professional aviation training classroom',
  },
  {
    image:
      'https://images.unsplash.com/photo-1775029324059-04bd762eba0d?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
    alt: 'Flight attendants working inside an aircraft cabin',
  },
  {
    image:
      'https://images.unsplash.com/photo-1757030689792-3fccb8813f8f?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
    alt: 'Workers repairing airport tarmac near an airplane at night',
  },
  {
    image:
      'https://images.unsplash.com/photo-1748362686556-3255add83eac?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
    alt: 'Ground crew directing a plane on the tarmac',
  },
];

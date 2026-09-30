export const HOME_HERO_SLIDES = [
  'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1519666336592-e225a99dcd2f?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1524592714635-d77511a4834d?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
  'https://images.unsplash.com/photo-1725653387938-0003bc52ccf5?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000',
];

export const HOME_FEATURE_IMAGE = `${import.meta.env.BASE_URL}home1.png`;

export const ABOUT_HERO_SLIDES = [
  `${import.meta.env.BASE_URL}home1.png`,
  `${import.meta.env.BASE_URL}cabin.png`,
  `${import.meta.env.BASE_URL}fdb.jpg`,
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

// All public course views call getCourseHeroImage, so course artwork is
// maintained here rather than independently on the home, catalog, and detail pages.
const COURSE_IMAGE_BY_SLUG = new Map([
  ['flight-dispatcher-flight-operations-officer-basic-fdb', `${import.meta.env.BASE_URL}fdb.jpg`],
  ['flight-dispatcher-flight-operations-officer-advanced-fda', `${import.meta.env.BASE_URL}fda.png`],
  ['erj-135-145-legacy-type-training-maintenance-initial', `${import.meta.env.BASE_URL}erj.jpg`],
  ['erj-135-145-legacy-type-training-maintenance-refresher', `${import.meta.env.BASE_URL}erj.jpg`],
  ['cabin-crew-initial-training-cci', `${import.meta.env.BASE_URL}cci.jpg`],
  ['cabin-crew-conversion-refresher-training-b737-classic', `${import.meta.env.BASE_URL}cci.jpg`],
  ['cabin-crew-conversion-refresher-training-hs125-800', `${import.meta.env.BASE_URL}cci.jpg`],
  ['basic-aircraft-maintenance-technicians-course-batco', `${import.meta.env.BASE_URL}batco.jpg`],
]);

const COURSE_IMAGE_BY_TITLE = new Map([
  ['airworthiness course awc', `${import.meta.env.BASE_URL}awc.png`],
  ['aircraft maintenance planning and control ampc', `${import.meta.env.BASE_URL}ampc.png`],
  ['aviation stores management asm', `${import.meta.env.BASE_URL}asm.png`],
  ['airline management am', `${import.meta.env.BASE_URL}am.png`],
  ['quality management systems for airlines qms', `${import.meta.env.BASE_URL}qms.png`],
  ['aircraft maintenance management amm', `${import.meta.env.BASE_URL}amm.png`],
]);

export const getCourseHeroImage = (course, fallbackIndex = 0) => {
  const override =
    COURSE_IMAGE_BY_SLUG.get(String(course?.slug || '')) ||
    COURSE_IMAGE_BY_TITLE.get(normalizeTitle(course?.title));
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

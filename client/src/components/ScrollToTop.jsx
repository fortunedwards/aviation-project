import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import coursesData from '../data/courses.json';

const SITE_NAME = 'Aeroconsult Ltd.';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://www.aeroconsultaviation.com';
const DEFAULT_IMAGE = `${SITE_URL}/aeroconsult_logo.jpg`;
const courses = Array.isArray(coursesData?.courses) ? coursesData.courses : [];

const routeMeta = {
  '/': {
    title: 'Aeroconsult Aviation School & Consultancy | Aeroconsult Ltd.',
    description:
      'Aeroconsult Ltd. is an aviation training school and consultancy in Nigeria offering expert courses in airworthiness, maintenance, flight operations, safety, quality management, and more.',
    keywords:
      'Aeroconsult, Aerconsult Aviation, aviation school, aviation training, aviation consultancy, Nigeria aviation training',
  },
  '/about': {
    title: 'About Aeroconsult | Aviation School & Consultancy',
    description:
      'Learn about Aeroconsult Ltd., a specialist aviation training school and technical consultancy in Nigeria with approved training and quality-focused aviation services.',
    keywords: 'About Aeroconsult, aviation school, aviation consultancy, Nigeria',
  },
  '/courses': {
    title: 'Aviation Training Courses | Aeroconsult Ltd.',
    description:
      'Browse Aeroconsult Ltd. aviation training courses and professional consultancy programs covering airworthiness, maintenance, safety, operations, quality management, and more.',
    keywords: 'aviation training, aviation school, courses, Aeroconsult',
  },
  '/register': {
    title: 'Register for Aviation Training | Aeroconsult Ltd.',
    description:
      'Register for Aeroconsult Ltd. aviation training courses and professional programs in Nigeria.',
    keywords: 'register aviation training, Aeroconsult courses',
  },
  '/registration-success': {
    title: 'Registration Success | Aeroconsult Ltd.',
    description: 'Your registration has been received by Aeroconsult Ltd.',
  },
  '/status-tracker': {
    title: 'Status Tracker | Aeroconsult Ltd.',
    description: 'Track your Aeroconsult application or registration status.',
  },
  '/training-calendar': {
    title: 'Training Calendar | Aeroconsult Ltd.',
    description: 'View upcoming Aeroconsult training dates, programs, and enrollment pathways.',
  },
  '/gallery': {
    title: 'Gallery | Aeroconsult Ltd.',
    description: 'Explore Aeroconsult training highlights, events, and aviation visuals.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Aeroconsult Ltd.',
    description: 'Read Aeroconsult Ltd. privacy terms and how participant data is handled.',
  },
  '/terms-of-service': {
    title: 'Terms of Service | Aeroconsult Ltd.',
    description: 'Review Aeroconsult Ltd. service terms, eligibility, responsibilities, and policy conditions.',
  },
  '/login': {
    title: 'Login | Aeroconsult Ltd.',
    description: 'Login to your Aeroconsult account.',
  },
  '/student-portal': {
    title: 'Student Portal | Aeroconsult Ltd.',
    description: 'Access your Aeroconsult student portal.',
  },
  '/dashboard': {
    title: 'Dashboard | Aeroconsult Ltd.',
    description: 'Access the Aeroconsult staff dashboard.',
  },
  '/payment-success': {
    title: 'Payment Success | Aeroconsult Ltd.',
    description: 'Your payment was successful on Aeroconsult Ltd.',
  },
};

const toAbsoluteUrl = (pathname) => new URL(pathname, SITE_URL).toString();

const getCourseMeta = (pathname) => {
  const courseMatch = pathname.match(/^\/courses\/([^/]+)$/);
  if (!courseMatch) return null;

  const slug = courseMatch[1];
  const course = courses.find((item) => item.slug === slug);
  if (!course) {
    return {
      title: `Course Details | ${SITE_NAME}`,
      description: 'Explore Aeroconsult Ltd. aviation training course details.',
    };
  }

  return {
    title: `${course.title} | ${SITE_NAME}`,
    description: `${course.course_description} Learn more about this Aeroconsult aviation training course in Nigeria.`,
    keywords: `${course.title}, aviation training, aviation school, Aeroconsult`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: course.title,
      description: course.course_description,
      provider: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: DEFAULT_IMAGE,
      },
      url: toAbsoluteUrl(pathname),
      image: DEFAULT_IMAGE,
    },
  };
};

const setMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    element.setAttribute(key, value);
  });

  return element;
};

const setLink = (selector, attributes) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    element.setAttribute(key, value);
  });

  return element;
};

const setStructuredData = (data) => {
  const existing = document.getElementById('page-structured-data');
  if (existing) {
    existing.remove();
  }

  if (!data) return;

  const script = document.createElement('script');
  script.id = 'page-structured-data';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

const getPageMeta = (pathname) => {
  const courseMeta = getCourseMeta(pathname);
  if (courseMeta) return courseMeta;

  const meta = routeMeta[pathname];
  if (meta) return meta;

  const readable = pathname
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()))
    .join(' / ');

  return {
    title: readable ? `${readable} | ${SITE_NAME}` : SITE_NAME,
    description:
      'Aeroconsult Ltd. is an aviation training school and consultancy in Nigeria offering expert aviation programs and technical services.',
  };
};

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  useEffect(() => {
    const meta = getPageMeta(pathname);
    const pageUrl = toAbsoluteUrl(pathname);

    document.title = meta.title;
    document.documentElement.lang = 'en';

    setMeta('meta[name="description"]', { name: 'description', content: meta.description });
    setMeta('meta[name="keywords"]', {
      name: 'keywords',
      content:
        meta.keywords ||
        'Aeroconsult, Aerconsult Aviation, aviation school, aviation training, aviation consultancy, Nigeria aviation training',
    });
    setMeta('meta[name="robots"]', { name: 'robots', content: 'index,follow' });
    setMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: meta.title });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: meta.description });
    setMeta('meta[property="og:type"]', {
      property: 'og:type',
      content: pathname.startsWith('/courses/') ? 'article' : 'website',
    });
    setMeta('meta[property="og:url"]', { property: 'og:url', content: pageUrl });
    setMeta('meta[property="og:image"]', { property: 'og:image', content: DEFAULT_IMAGE });
    setMeta('meta[property="og:image:alt"]', {
      property: 'og:image:alt',
      content: 'Aeroconsult Ltd. logo',
    });
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: meta.title });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: meta.description });
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: DEFAULT_IMAGE });
    setLink('link[rel="canonical"]', { rel: 'canonical', href: pageUrl });
    setLink('link[rel="icon"]', { rel: 'icon', type: 'image/jpeg', href: '/aeroconsult_logo.jpg' });
    setLink('link[rel="shortcut icon"]', { rel: 'shortcut icon', href: '/aeroconsult_logo.jpg' });
    setLink('link[rel="apple-touch-icon"]', { rel: 'apple-touch-icon', href: '/aeroconsult_logo.jpg' });

    const structuredData = pathname === '/'
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
            logo: DEFAULT_IMAGE,
            description: meta.description,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: SITE_NAME,
            url: SITE_URL,
            description: meta.description,
          },
        ]
      : pathname.startsWith('/courses/')
        ? meta.structuredData
        : {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
            logo: DEFAULT_IMAGE,
            description: meta.description,
          };

    setStructuredData(structuredData);
  }, [pathname]);

  return null;
}

export default ScrollToTop;

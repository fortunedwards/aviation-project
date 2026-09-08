import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import coursesData from '../data/courses.json';

const SITE_NAME = 'Aeroconsult Ltd.';
const courses = Array.isArray(coursesData?.courses) ? coursesData.courses : [];

const titleMap = {
  '/': 'Home',
  '/about': 'About',
  '/courses': 'Courses',
  '/register': 'Register',
  '/registration-success': 'Registration Success',
  '/status-tracker': 'Status Tracker',
  '/training-calendar': 'Training Calendar',
  '/gallery': 'Gallery',
  '/privacy-policy': 'Privacy Policy',
  '/terms-of-service': 'Terms of Service',
  '/login': 'Login',
  '/student-portal': 'Student Portal',
  '/dashboard': 'Dashboard',
  '/payment-success': 'Payment Success',
};

const getPageTitle = (pathname) => {
  const courseMatch = pathname.match(/^\/courses\/([^/]+)$/);
  if (courseMatch) {
    const slug = courseMatch[1];
    const course = courses.find((item) => item.slug === slug);
    return `${course?.title || 'Course Details'} | ${SITE_NAME}`;
  }

  const label = titleMap[pathname];
  if (label) {
    return `${label} | ${SITE_NAME}`;
  }

  const readable = pathname
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()))
    .join(' / ');

  return readable ? `${readable} | ${SITE_NAME}` : SITE_NAME;
};

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  useEffect(() => {
    document.title = getPageTitle(pathname);

    const iconHref = '/aeroconsult_logo.jpg';
    const selectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
    ];

    selectors.forEach((selector) => {
      let link = document.head.querySelector(selector);
      if (!link) {
        link = document.createElement('link');
        document.head.appendChild(link);
      }

      if (selector === 'link[rel="icon"]') {
        link.rel = 'icon';
        link.type = 'image/jpeg';
        link.href = iconHref;
      } else if (selector === 'link[rel="shortcut icon"]') {
        link.rel = 'shortcut icon';
        link.href = iconHref;
      } else {
        link.rel = 'apple-touch-icon';
        link.href = iconHref;
      }
    });
  }, [pathname]);

  return null;
}

export default ScrollToTop;

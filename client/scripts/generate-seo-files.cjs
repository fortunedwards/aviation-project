const fs = require('fs');
const path = require('path');

const siteUrl = (process.env.VITE_SITE_URL || 'https://www.aeroconsultaviation.com').replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);
const publicDir = path.resolve(__dirname, '..', 'public');
const coursesPath = path.resolve(__dirname, '..', 'src', 'data', 'courses.json');

const staticRoutes = [
  '/',
  '/about',
  '/courses',
  '/register',
  '/registration-success',
  '/status-tracker',
  '/training-calendar',
  '/gallery',
  '/privacy-policy',
  '/terms-of-service',
];

const readCourses = () => {
  const raw = fs.readFileSync(coursesPath, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.courses) ? parsed.courses : [];
};

const buildSitemap = (routes) => {
  const entries = routes
    .map(
      (route) => `  <url>
    <loc>${siteUrl}${route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.startsWith('/courses/') ? 'monthly' : 'weekly'}</changefreq>
    <priority>${route === '/' ? '1.0' : route.startsWith('/courses/') ? '0.8' : '0.7'}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
};

const buildRobots = () => `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const main = () => {
  const courses = readCourses();
  const courseRoutes = courses
    .filter((course) => course && course.slug)
    .map((course) => `/courses/${course.slug}`);

  const routes = [...staticRoutes, ...courseRoutes];

  ensureDir(publicDir);
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), buildSitemap(routes), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), buildRobots(), 'utf8');

  console.log(`Generated sitemap with ${routes.length} URLs and robots.txt`);
};

main();

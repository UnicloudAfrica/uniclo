import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.resolve(rootDir, "dist");
const ssrEntry = path.resolve(rootDir, "dist-ssr", "entry-server.js");

const staticRoutes = [
  "/",
  "/about",
  "/management",
  "/advisory-board",
  "/faq",
  "/partnership",
  "/contact",
  "/terms",
  "/resources",
  "/services",
  "/solutions",
  "/events",
  "/blog",
  "/press",
  "/career",
  "/tenant-home",
  "/Africa-Data-Centres-and-Onix-Data-Centre-announce-partnership",
  "/Benue-State-to-build-modern-data-center-and-cloud-system-with-UniCloud-Africa",
];

const baseUrl = process.env.SEO_BASE_URL || "https://www.unicloudafrica.com";

const readJson = async (fileName) => {
  try {
    const filePath = path.join(rootDir, "content", fileName);
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`Prerender: failed to read ${fileName}`, error?.message || error);
    return [];
  }
};

const slugify = (value) => encodeURIComponent(String(value || "")).replaceAll("%20", "-");

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const resolveOutputPath = (route) => {
  if (route === "/") {
    return { dir: distDir, file: path.join(distDir, "index.html") };
  }

  const safeRoute = route.replace(/^\//, "");
  const outDir = path.join(distDir, safeRoute);
  return { dir: outDir, file: path.join(outDir, "index.html") };
};

const buildSitemap = (paths) => {
  const urls = paths
    .map((route) => {
      const loc = route === "/" ? baseUrl : `${baseUrl}${route}`;
      return `  <url><loc>${loc}</loc></url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n</urlset>\n`;
};

const main = async () => {
  const templatePath = path.join(distDir, "index.html");
  const template = await fs.readFile(templatePath, "utf-8");

  const { render } = await import(pathToFileURL(ssrEntry).href);

  const [blogs, resources, solutions, cases, careers, board, manage] = await Promise.all([
    readJson("blog.json"),
    readJson("resources.json"),
    readJson("solutions.json"),
    readJson("cases.json"),
    readJson("career.json"),
    readJson("board.json"),
    readJson("manage.json"),
  ]);

  const dynamicRoutes = [
    ...blogs.map((item) => `/blogs/${slugify(item?.title)}`),
    ...resources.map((item) => `/resources/${item?.id}`),
    ...solutions.map((item) => `/solutions/${item?.id}`),
    ...cases.map((item) => `/use-cases/${item?.id}`),
    ...careers.map((item) => `/careers/${item?.id}`),
    ...board.map((item) => `/management/${slugify(item?.name)}`),
    ...manage.map((item) => `/advisory-board/${slugify(item?.name)}`),
  ].filter(Boolean);

  const routes = Array.from(new Set([...staticRoutes, ...dynamicRoutes]));

  for (const route of routes) {
    const { html, head } = await render(route);
    const withRoot = template.replace(
      '<div id="root"></div>',
      `<div id="root">${html}</div>`
    );
    const withHead = withRoot.replace("</head>", `${head}\n</head>`);

    const output = resolveOutputPath(route);
    await ensureDir(output.dir);
    await fs.writeFile(output.file, withHead, "utf-8");
  }

  const sitemap = buildSitemap(routes);
  await fs.writeFile(path.join(distDir, "sitemap.xml"), sitemap, "utf-8");
};

main().catch((error) => {
  console.error("Prerender failed:", error);
  process.exit(1);
});

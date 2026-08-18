/**
 * Next emits the opengraph-image route as an extensionless file (out/…/opengraph-image).
 * Static hosts derive Content-Type from the file extension, so that file is served
 * with no type and social crawlers reject it. Rename to .png and rewrite the
 * references in the emitted HTML.
 */
import { readdir, rename, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT = "out";

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p)));
    else files.push(p);
  }
  return files;
}

const files = await walk(OUT);

const images = files.filter((f) => f.endsWith("/opengraph-image"));
for (const f of images) {
  await rename(f, `${f}.png`);
  console.log(`renamed ${f} -> ${f}.png`);
}

if (images.length === 0) {
  console.warn("fix-og: no opengraph-image files found — did the route change?");
}

let patched = 0;
for (const f of files.filter((f) => f.endsWith(".html") || f.endsWith(".txt"))) {
  const before = await readFile(f, "utf8");
  const after = before.replaceAll(/opengraph-image(?!\.png)/g, "opengraph-image.png");
  if (after !== before) {
    await writeFile(f, after);
    patched++;
  }
}
console.log(`fix-og: ${images.length} image(s) renamed, ${patched} file(s) patched`);

// Warn loudly when the operator identity is still unset: a privacy policy that
// names nobody, and a contact page with no address, will fail AdSense review.
const missing = [
  ["NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL],
  ["NEXT_PUBLIC_CONTACT_EMAIL", process.env.NEXT_PUBLIC_CONTACT_EMAIL],
  ["NEXT_PUBLIC_OPERATOR_NAME", process.env.NEXT_PUBLIC_OPERATOR_NAME],
]
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length) {
  console.warn(
    `\n  ⚠ not ready to publish — unset: ${missing.join(", ")}\n` +
      "    Canonical URLs fall back to localhost, and the privacy/contact\n" +
      "    pages name no operator. Set these before deploying.\n",
  );
}

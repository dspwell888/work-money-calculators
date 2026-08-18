import type { MetadataRoute } from "next";

import { SITE_URL, TOOLS, toolPath } from "@/lib/site";

export const dynamic = "force-static";

/** Text pages that belong in the index but are not tools. */
const INFO_PAGES = ["/about/", "/contact/", "/privacy-policy/", "/terms/"];

export default function sitemap(): MetadataRoute.Sitemap {
  const live = TOOLS.filter((t) => !t.comingSoon);
  return [
    { url: `${SITE_URL}/`, priority: 1 },
    ...live.map((t) => ({
      url: `${SITE_URL}${toolPath(t.slug)}`,
      priority: 0.9,
    })),
    ...INFO_PAGES.map((p) => ({ url: `${SITE_URL}${p}`, priority: 0.3 })),
  ];
}

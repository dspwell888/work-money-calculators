import { ImageResponse } from "next/og";

import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og-image";

// Required under output: "export" — the PNG is rendered once at build time.
export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Pro Rata Calculator";

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        kicker="Part-time pay"
        title="Pro Rata Calculator"
        note="Scale a full-time salary by contracted hours or by time served."
      />
    ),
    size,
  );
}

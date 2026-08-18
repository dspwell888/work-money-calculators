import { ImageResponse } from "next/og";

import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og-image";

// Required under output: "export" — the PNG is rendered once at build time.
export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Salary Percentile Calculator";

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        kicker="Compensation"
        title="Salary Percentile Calculator"
        note="Percentile and compa-ratio against data you supply. Nothing assumed."
      />
    ),
    size,
  );
}

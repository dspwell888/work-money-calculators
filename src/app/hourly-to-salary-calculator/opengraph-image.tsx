import { ImageResponse } from "next/og";

import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og-image";

// Required under output: "export" — the PNG is rendered once at build time.
export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Hourly to Salary Calculator";

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        kicker="Pay conversion"
        title="Hourly to Salary Calculator"
        note="Hourly to yearly and back, with overtime and unpaid time."
      />
    ),
    size,
  );
}

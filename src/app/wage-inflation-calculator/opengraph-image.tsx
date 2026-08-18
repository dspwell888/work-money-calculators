import { ImageResponse } from "next/og";

import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og-image";

// Required under output: "export" — the PNG is rendered once at build time.
export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Wage Inflation Calculator";

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        kicker="Real pay"
        title="Wage Inflation Calculator"
        note="What a raise was worth once prices are taken out of it."
      />
    ),
    size,
  );
}

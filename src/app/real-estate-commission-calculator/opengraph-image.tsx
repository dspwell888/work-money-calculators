import { ImageResponse } from "next/og";

import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og-image";

// Required under output: "export" — the PNG is rendered once at build time.
export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Real Estate Commission Calculator";

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        kicker="Property"
        title="Real Estate Commission Calculator"
        note="Total commission, side split, and each agent's share after the brokerage."
      />
    ),
    size,
  );
}

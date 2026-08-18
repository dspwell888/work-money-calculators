import { ImageResponse } from "next/og";

import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og-image";

// Required under output: "export" — the PNG is rendered once at build time.
export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Time and a Half Calculator";

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        kicker="Overtime"
        title="Time and a Half Calculator"
        note="Overtime at 1.5x, 2x, or any multiplier — including split weeks."
      />
    ),
    size,
  );
}

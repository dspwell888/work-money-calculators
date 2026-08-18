import { ImageResponse } from "next/og";

import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og-image";

// Required under output: "export" — the PNG is rendered once at build time.
export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Hours and Minutes Calculator";

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        kicker="Time arithmetic"
        title="Hours and Minutes Calculator"
        note="Add and subtract h:mm, or measure the gap between two clocks."
      />
    ),
    size,
  );
}

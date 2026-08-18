import { ImageResponse } from "next/og";

import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og-image";

// Required under output: "export" — the PNG is rendered once at build time.
export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Work & Money Calculators";

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        kicker="Free · No sign-up"
        title="Calculators for pay and working time"
        note="Everything runs in your browser."
      />
    ),
    size,
  );
}

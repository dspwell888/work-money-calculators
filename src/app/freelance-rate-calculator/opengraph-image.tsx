import { ImageResponse } from "next/og";

import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og-image";

// Required under output: "export" — the PNG is rendered once at build time.
export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Freelance Rate Calculator";

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        kicker="Self-employment"
        title="Freelance Rate Calculator"
        note="Target income and real utilisation worked back into a day rate."
      />
    ),
    size,
  );
}

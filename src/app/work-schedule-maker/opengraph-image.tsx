import { ImageResponse } from "next/og";

import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og-image";

// Required under output: "export" — the PNG is rendered once at build time.
export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Work Schedule Maker";

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        kicker="Rostering"
        title="Work Schedule Maker"
        note="Shift rota with hours, overtime and wage cost per person. Exports to CSV."
      />
    ),
    size,
  );
}

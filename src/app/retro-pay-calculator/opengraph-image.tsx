import { ImageResponse } from "next/og";

import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og-image";

// Required under output: "export" — the PNG is rendered once at build time.
export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Retro Pay Calculator";

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        kicker="Back pay"
        title="Retro Pay Calculator"
        note="What is owed when a raise is applied late — hourly or salaried."
      />
    ),
    size,
  );
}

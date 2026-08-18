import { ImageResponse } from "next/og";

import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og-image";

// Required under output: "export" — the PNG is rendered once at build time.
export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Salary Increase Calculator";

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        kicker="Pay & compensation"
        title="Salary Increase Calculator"
        note="A raise by percentage, by flat increase, or by target salary — compared side by side."
      />
    ),
    size,
  );
}

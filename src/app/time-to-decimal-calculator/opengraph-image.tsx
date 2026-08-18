import { ImageResponse } from "next/og";

import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og-image";

// Required under output: "export" — the PNG is rendered once at build time.
export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Time to Decimal Calculator";

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        kicker="Timesheets"
        title="Time to Decimal Calculator"
        note="Hours and minutes to decimal hours, with payroll rounding and a timesheet total."
      />
    ),
    size,
  );
}

import { ImageResponse } from "next/og";

import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/components/og-image";

// Required under output: "export" — the PNG is rendered once at build time.
export const dynamic = "force-static";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "PTO Calculator";

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        kicker="Time off"
        title="PTO Calculator"
        note="Accrual, projected balance, caps and carryover, and payout value."
      />
    ),
    size,
  );
}

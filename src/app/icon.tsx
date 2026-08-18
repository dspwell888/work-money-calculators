import { ImageResponse } from "next/og";

// Rendered once at build time into a real PNG, so the static export ships it.
export const dynamic = "force-static";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Ink-on-paper "W&M" mark, matching the site's palette. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#26221c",
          color: "#f7f4ed",
          fontSize: 34,
          letterSpacing: -1,
        }}
      >
        W&amp;M
      </div>
    ),
    size,
  );
}

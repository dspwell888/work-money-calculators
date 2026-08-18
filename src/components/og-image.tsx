/**
 * Shared Open Graph card. Rendered to a static PNG at build time by
 * next/og, so it ships with the static export and costs nothing at runtime.
 *
 * Kept to plain colours and the default font stack on purpose: ImageResponse
 * would have to fetch a webfont over the network during the build, and a
 * flaky build is worse than a plain card.
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const PAPER = "#f7f4ed";
const INK = "#26221c";
const MUTED = "#787063";
const RULE = "#d8d1c4";
const GAIN = "#2f6b45";

export function OgCard({
  kicker,
  title,
  note,
}: {
  kicker: string;
  title: string;
  note: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: PAPER,
        color: INK,
        padding: "72px 80px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: MUTED,
          }}
        >
          {kicker}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 92,
            lineHeight: 1.02,
            letterSpacing: -2,
            maxWidth: 900,
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          borderTop: `2px solid ${RULE}`,
          paddingTop: 28,
        }}
      >
        <div style={{ fontSize: 30, color: MUTED, maxWidth: 720 }}>{note}</div>
        <div style={{ fontSize: 30, color: GAIN }}>Work &amp; Money</div>
      </div>
    </div>
  );
}

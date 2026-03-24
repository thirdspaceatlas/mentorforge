import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "MentorForge — CFA study planning and pacing";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0f172a 0%, #020617 55%, #0b1220 100%)",
          color: "#f8fafc"
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 650,
            letterSpacing: "-0.03em",
            fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
          }}
        >
          MentorForge
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 32,
            fontWeight: 500,
            color: "#94a3b8",
            fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
          }}
        >
          CFA study planning & pacing
        </div>
      </div>
    ),
    { ...size }
  );
}

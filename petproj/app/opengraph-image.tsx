import { ImageResponse } from "next/og";

export const alt = "Paltuu — Pakistan's First Pet Adoption Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(135deg, #A03048 0%, #6E1F32 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 120 }}>🐾</div>
        <div
          style={{
            display: "flex",
            fontSize: 104,
            fontWeight: 700,
            color: "#FFFFFF",
            marginTop: 8,
          }}
        >
          Paltuu
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            color: "#F3D2DB",
            marginTop: 16,
          }}
        >
          Pakistan's First Pet Adoption Platform
        </div>
      </div>
    ),
    { ...size }
  );
}

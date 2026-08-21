import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Paltuu — Pakistan's First Pet Adoption Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), "public/og-full-logo.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

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
        <img src={logoSrc} width={640} height={170} style={{ display: "flex" }} />
        <div
          style={{
            display: "flex",
            fontSize: 36,
            color: "#F3D2DB",
            marginTop: 32,
          }}
        >
          Pakistan's First Pet Adoption Platform
        </div>
      </div>
    ),
    { ...size }
  );
}

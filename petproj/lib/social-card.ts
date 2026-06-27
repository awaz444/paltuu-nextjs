import fs from "fs";
import path from "path";
import sharp from "sharp";

const CARD_W = 1080;
const CARD_H = 1350;
const PAD = 48;
const ROSE = "#a03048";
const DARK = "#1a1a1a";
const WHITE = "#ffffff";

const LOGO_PATH = path.join(process.cwd(), "public/post-template-assets/paltuu.png");
const FONT_PATH = path.join(
    process.cwd(),
    "public/post-template-assets/Montserrat/static/Montserrat-Bold.ttf"
);

let _fontB64: string | null = null;
function getFontB64(): string {
    if (!_fontB64) _fontB64 = fs.readFileSync(FONT_PATH).toString("base64");
    return _fontB64;
}

function makeSvg(width: number, height: number, body: string): Buffer {
    const fontB64 = getFontB64();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <style>
      @font-face {
        font-family: 'Montserrat';
        src: url('data:font/truetype;base64,${fontB64}');
        font-weight: bold;
      }
    </style>
  </defs>
  ${body}
</svg>`;
    return Buffer.from(svg);
}

function cityPillSvg(city: string): Buffer {
    const label = city.toUpperCase();
    const charW = 22;
    const pillH = 56;
    const pillW = Math.max(label.length * charW + 40, 120);
    const x = CARD_W - PAD - pillW;
    const y = PAD;

    const body = `
    <rect x="${x}" y="${y}" width="${pillW}" height="${pillH}" rx="28" fill="${WHITE}" opacity="0.92"/>
    <text
      x="${x + pillW / 2}" y="${y + pillH / 2 + 9}"
      font-family="Montserrat" font-weight="bold" font-size="26"
      fill="${DARK}" text-anchor="middle" letter-spacing="2">${label}</text>`;

    return makeSvg(CARD_W, CARD_H, body);
}

function adoptionBadgeSvg(): Buffer {
    const label = "UP FOR ADOPTION";
    const pillW = 680;
    const pillH = 80;
    const x = (CARD_W - pillW) / 2;
    const y = CARD_H - PAD - pillH;

    const body = `
    <rect x="${x}" y="${y}" width="${pillW}" height="${pillH}" rx="40" fill="${WHITE}" opacity="0.93"/>
    <text
      x="${CARD_W / 2}" y="${y + pillH / 2 + 13}"
      font-family="Montserrat" font-weight="bold" font-size="40"
      fill="${ROSE}" text-anchor="middle" letter-spacing="3">${label}</text>`;

    return makeSvg(CARD_W, CARD_H, body);
}

function rescueBadgeSvg(): Buffer {
    const mainLabel = "UP FOR ADOPTION";
    const tagLabel = "RESCUE";
    const mainPillW = 680;
    const mainPillH = 80;
    const tagPillW = 220;
    const tagPillH = 52;
    const gap = 14;

    const mainX = (CARD_W - mainPillW) / 2;
    const mainY = CARD_H - PAD - mainPillH;
    const tagX = (CARD_W - tagPillW) / 2;
    const tagY = mainY - gap - tagPillH;

    const body = `
    <rect x="${tagX}" y="${tagY}" width="${tagPillW}" height="${tagPillH}" rx="26" fill="${ROSE}"/>
    <text
      x="${CARD_W / 2}" y="${tagY + tagPillH / 2 + 9}"
      font-family="Montserrat" font-weight="bold" font-size="26"
      fill="${WHITE}" text-anchor="middle" letter-spacing="3">${tagLabel}</text>
    <rect x="${mainX}" y="${mainY}" width="${mainPillW}" height="${mainPillH}" rx="40" fill="${WHITE}" opacity="0.93"/>
    <text
      x="${CARD_W / 2}" y="${mainY + mainPillH / 2 + 13}"
      font-family="Montserrat" font-weight="bold" font-size="40"
      fill="${ROSE}" text-anchor="middle" letter-spacing="3">${mainLabel}</text>`;

    return makeSvg(CARD_W, CARD_H, body);
}

function logoBadgeSvg(logoW: number, logoH: number): Buffer {
    const body = `<image href="data:image/png;base64,LOGO_PLACEHOLDER" x="${PAD}" y="${PAD}" width="${logoW}" height="${logoH}"/>`;
    // Logo is composited separately as a PNG — this layer is not used for the logo.
    // Returned as empty transparent layer; logo is handled via sharp composite.
    return makeSvg(CARD_W, CARD_H, "");
}

export async function generateSocialCard(params: {
    imageUrl: string;
    city: string;
    listing_type: string;
}): Promise<Buffer> {
    const { imageUrl, city, listing_type } = params;

    // 1. Fetch pet photo
    const photoRes = await fetch(imageUrl);
    if (!photoRes.ok) throw new Error(`Failed to fetch pet image: ${photoRes.status}`);
    const photoBuffer = Buffer.from(await photoRes.arrayBuffer());

    // 2. Crop/resize to 4:5 (1080×1350), centre-anchored cover
    const base = await sharp(photoBuffer)
        .resize(CARD_W, CARD_H, { fit: "cover", position: "centre" })
        .jpeg({ quality: 92 })
        .toBuffer();

    // 3. Prepare logo — resize to 180px wide preserving aspect ratio
    const logoBuffer = fs.readFileSync(LOGO_PATH);
    const logoMeta = await sharp(logoBuffer).metadata();
    const logoW = 180;
    const logoH = logoMeta.height && logoMeta.width
        ? Math.round((logoMeta.height / logoMeta.width) * logoW)
        : logoW;
    const resizedLogo = await sharp(logoBuffer)
        .resize(logoW, logoH)
        .png()
        .toBuffer();

    // 4. Build SVG overlay layers
    const citySvg = cityPillSvg(city);
    const badgeSvg = listing_type === "rescue" ? rescueBadgeSvg() : adoptionBadgeSvg();

    // 5. Composite: base image + logo + city pill + badge
    const result = await sharp(base)
        .composite([
            { input: citySvg, top: 0, left: 0 },
            { input: badgeSvg, top: 0, left: 0 },
            { input: resizedLogo, top: PAD, left: PAD },
        ])
        .jpeg({ quality: 92 })
        .toBuffer();

    return result;
}

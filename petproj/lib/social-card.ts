import fs from "fs";
import path from "path";
import sharp from "sharp";
import * as opentype from "opentype.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const CARD_W = 1080;
const CARD_H = 1350;
const MARGIN = 32; // consistent margin from all four edges
const ROSE = "#a03048";
const WHITE = "#ffffff";

const LOGO_PATH = path.join(process.cwd(), "public/post-template-assets/main.png");
const FONT_PATH = path.join(
    process.cwd(),
    "public/post-template-assets/Montserrat/static/Montserrat-Bold.ttf"
);

// ─── Font loader (cached) ─────────────────────────────────────────────────────

let _font: opentype.Font | null = null;
function getFont(): opentype.Font {
    if (!_font) {
        const buf = fs.readFileSync(FONT_PATH);
        _font = opentype.parse(buf.buffer as ArrayBuffer);
    }
    return _font;
}

// ─── Text-to-path helpers ─────────────────────────────────────────────────────

type BBox = { x1: number; y1: number; x2: number; y2: number };

function measureText(text: string, fontSize: number): BBox {
    const font = getFont();
    const p = font.getPath(text, 0, 0, fontSize);
    return p.getBoundingBox() as BBox;
}

/** Returns an SVG <path> string for `text` centred at (centerX, baselineY). */
function centeredTextPath(
    text: string,
    centerX: number,
    baselineY: number,
    fontSize: number,
    fill: string
): string {
    const font = getFont();
    const bb = measureText(text, fontSize);
    const textW = bb.x2 - bb.x1;
    const startX = centerX - textW / 2 - bb.x1;
    const p = font.getPath(text, startX, baselineY, fontSize);
    p.fill = fill;
    p.stroke = null;
    return p.toSVG(2);
}

/** Returns an SVG <path> string for `text` anchored at (x, baselineY). */
function anchoredTextPath(
    text: string,
    x: number,
    baselineY: number,
    fontSize: number,
    fill: string
): string {
    const font = getFont();
    const p = font.getPath(text, x, baselineY, fontSize);
    p.fill = fill;
    p.stroke = null;
    return p.toSVG(2);
}

// ─── SVG layer builders ───────────────────────────────────────────────────────

function makeSvgLayer(body: string): Buffer {
    return Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}">${body}</svg>`
    );
}

/** White rounded-rect pill, centred horizontally at pilCentreX, top edge at y. */
function pillRect(
    pillCentreX: number,
    pillTopY: number,
    pillW: number,
    pillH: number,
    rx: number
): string {
    const x = pillCentreX - pillW / 2;
    return `<rect x="${x.toFixed(1)}" y="${pillTopY.toFixed(1)}" width="${pillW}" height="${pillH}" rx="${rx}" fill="${WHITE}" opacity="0.93"/>`;
}

// ─── Layer: city pill (top-right) ────────────────────────────────────────────

function buildCityLayer(city: string): Buffer {
    const label = city.toUpperCase();
    const fontSize = 44;
    const bb = measureText(label, fontSize);
    const textW = bb.x2 - bb.x1;
    const hPad = 44;
    const pillW = textW + hPad * 2;
    const pillH = 76;
    const rx = 38;

    // Right-align pill: right edge at CARD_W - MARGIN
    const pillLeft = CARD_W - MARGIN - pillW;
    const pillCentreX = pillLeft + pillW / 2;
    const pillTopY = MARGIN;

    // Baseline: vertically centred in pill
    const baselineY = pillTopY + pillH / 2 + (bb.y2 - bb.y1) / 2 - bb.y2;

    const rect = `<rect x="${pillLeft.toFixed(1)}" y="${pillTopY}" width="${pillW.toFixed(1)}" height="${pillH}" rx="${rx}" fill="${WHITE}" opacity="0.93"/>`;
    const textPath = centeredTextPath(label, pillCentreX, baselineY, fontSize, ROSE);

    return makeSvgLayer(rect + textPath);
}

// ─── Layer: bottom badge ──────────────────────────────────────────────────────

function buildAdoptionBadge(): Buffer {
    const label = "UP FOR ADOPTION";
    const fontSize = 46;
    const bb = measureText(label, fontSize);
    const textH = bb.y2 - bb.y1;
    const pillW = 730;
    const pillH = 88;
    const rx = 44;
    const bottomPad = MARGIN;

    const pillCentreX = CARD_W / 2;
    const pillTopY = CARD_H - bottomPad - pillH;
    const baselineY = pillTopY + (pillH - textH) / 2 - bb.y1;

    const body =
        pillRect(pillCentreX, pillTopY, pillW, pillH, rx) +
        centeredTextPath(label, pillCentreX, baselineY, fontSize, ROSE);

    return makeSvgLayer(body);
}

function buildRescueBadge(healthIssue?: string | null): Buffer {
    const mainLabel = "RESCUE ADOPTION";
    const mainFontSize = 46;
    const mainBb = measureText(mainLabel, mainFontSize);
    const mainTextH = mainBb.y2 - mainBb.y1;
    const mainPillW = 730;
    const mainPillH = 88;
    const mainRx = 44;
    const bottomPad = MARGIN;

    const mainPillCentreX = CARD_W / 2;
    const mainPillTopY = CARD_H - bottomPad - mainPillH;
    const mainBaselineY = mainPillTopY + (mainPillH - mainTextH) / 2 - mainBb.y1;

    let body =
        pillRect(mainPillCentreX, mainPillTopY, mainPillW, mainPillH, mainRx) +
        centeredTextPath(mainLabel, mainPillCentreX, mainBaselineY, mainFontSize, ROSE);

    // Optional health-condition tag above the main badge
    if (healthIssue) {
        const tagLabel = ("+ " + healthIssue).toUpperCase();
        const tagFontSize = 30;
        const tagBb = measureText(tagLabel, tagFontSize);
        const tagTextH = tagBb.y2 - tagBb.y1;
        const tagHPad = 40;
        const tagPillW = Math.min((tagBb.x2 - tagBb.x1) + tagHPad * 2, CARD_W - 80);
        const tagPillH = 60;
        const tagRx = 30;
        const tagGap = 18;

        const tagPillCentreX = CARD_W / 2;
        const tagPillTopY = mainPillTopY - tagGap - tagPillH;
        const tagBaselineY = tagPillTopY + (tagPillH - tagTextH) / 2 - tagBb.y1;

        body =
            pillRect(tagPillCentreX, tagPillTopY, tagPillW, tagPillH, tagRx) +
            centeredTextPath(tagLabel, tagPillCentreX, tagBaselineY, tagFontSize, ROSE) +
            body;
    }

    return makeSvgLayer(body);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateSocialCard(params: {
    imageUrl: string;
    city: string;
    listing_type: string;
    healthIssue?: string | null;
}): Promise<Buffer> {
    const { imageUrl, city, listing_type, healthIssue } = params;

    // 1. Fetch pet photo
    const photoRes = await fetch(imageUrl);
    if (!photoRes.ok) throw new Error(`Failed to fetch pet image: ${photoRes.status}`);
    const photoBuffer = Buffer.from(await photoRes.arrayBuffer());

    // 2. Crop/resize to 4:5 (1080×1350), centre-anchored cover
    const base = await sharp(photoBuffer)
        .resize(CARD_W, CARD_H, { fit: "cover", position: "centre" })
        .jpeg({ quality: 92 })
        .toBuffer();

    // 3. Prepare logo — 240px wide, at tight corner
    const logoBuffer = fs.readFileSync(LOGO_PATH);
    const logoMeta = await sharp(logoBuffer).metadata();
    const logoW = 240;
    const logoH =
        logoMeta.height && logoMeta.width
            ? Math.round((logoMeta.height / logoMeta.width) * logoW)
            : logoW;
    const resizedLogo = await sharp(logoBuffer).resize(logoW, logoH).png().toBuffer();

    // 4. Build SVG text layers (paths only — no font embedding needed)
    const cityLayer = buildCityLayer(city);
    const badgeLayer =
        listing_type === "rescue"
            ? buildRescueBadge(healthIssue)
            : buildAdoptionBadge();

    // 5. Composite: base → city overlay → badge overlay → logo PNG
    const result = await sharp(base)
        .composite([
            { input: cityLayer, top: 0, left: 0 },
            { input: badgeLayer, top: 0, left: 0 },
            { input: resizedLogo, top: MARGIN, left: MARGIN },  // same margin as city pill & badge
        ])
        .jpeg({ quality: 92 })
        .toBuffer();

    return result;
}

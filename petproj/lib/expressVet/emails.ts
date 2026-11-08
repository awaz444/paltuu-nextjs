import { db } from "@/db/index";
import { sendEmailViaBrevo } from "@/utils/mailjet";
import { EXPRESS_VET_CATEGORY_LABELS, parseGroomingCart } from "@/lib/expressVet/catalog";
import { payablePkr } from "@/lib/expressVet/coupons";

// Vets at Home emails to the pet owner (PALTU-132): an estimate when they book, and the
// bill when the dispatcher marks the visit completed. Both show the PALTU-131 coupon line
// when a code was applied. Fire-and-forget by design: callers `void` these, every error is
// caught and logged here, and a user without an email is simply skipped.

type BillKind = "booking" | "bill";

const BRAND = "#8B1538";

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const rs = (n: number) => `Rs ${Number(n).toLocaleString("en-US")}`;

function formatPkt(date: string | Date | null | undefined): string | null {
  if (!date) return null;
  return new Date(date).toLocaleString("en-US", {
    timeZone: "Asia/Karachi",
    weekday: "short",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function serviceLabel(r: any): string {
  const category = EXPRESS_VET_CATEGORY_LABELS[r.category] ?? r.category;
  const species = r.species ? String(r.species).charAt(0).toUpperCase() + String(r.species).slice(1) : "";
  const groomingItems =
    r.category === "grooming"
      ? parseGroomingCart(r.sub_service)
          .map((k: string) => k.replace(/_/g, " "))
          .join(", ")
      : "";
  return [category, species, groomingItems].filter(Boolean).join(" · ");
}

function row(label: string, value: string, opts: { bold?: boolean; color?: string } = {}) {
  return `
    <tr>
      <td style="padding:10px 0;color:#666;font-size:14px;">${label}</td>
      <td style="padding:10px 0;text-align:right;font-size:${opts.bold ? 18 : 14}px;font-weight:${opts.bold ? 700 : 500};color:${opts.color ?? "#333"};">${value}</td>
    </tr>`;
}

function buildHtml(kind: BillKind, r: any): { subject: string; html: string; text: string } {
  const isBill = kind === "bill";
  const discount = Number(r.discount_pkr ?? 0);
  const price = Number(isBill ? r.final_price_pkr ?? r.starting_price_pkr : r.starting_price_pkr);
  const payable = isBill ? payablePkr(r) : Math.max(price - discount, 0);
  const id = esc(r.request_id);
  const firstName = esc(String(r.client_name ?? "").split(" ")[0] || "there");

  const subject = isBill ? `Your Vets at Home bill #${r.request_id}` : `Your Vets at Home booking #${r.request_id}`;
  const heading = isBill ? "Your visit bill" : "Booking received";
  const intro = isBill
    ? `Hi ${firstName}, thanks for using Paltuu Vets at Home. Here's the bill for your visit.`
    : `Hi ${firstName}, we've got your Vets at Home request. Our team will call you shortly to confirm the details and the final price.`;

  const when = formatPkt(isBill ? r.completed_at : r.scheduled_at);
  const detailRows = [
    row("Booking", `#${id}`),
    row("Service", esc(serviceLabel(r))),
    row("Address", esc(r.address_line)),
    isBill && r.provider_name ? row("Provider", esc(r.provider_name)) : "",
    when ? row(isBill ? "Completed" : "Visit", esc(when)) : "",
  ].join("");

  const priceRows = [
    row(isBill ? "Visit price" : "Estimated price", isBill ? rs(price) : `From ${rs(price)}`),
    discount > 0 ? row(`Coupon${r.coupon_code ? ` (${esc(r.coupon_code)})` : ""}`, `− ${rs(discount)}`, { color: "#15803D" }) : "",
    row(isBill ? "Total payable" : "Estimated payable", rs(payable), { bold: true, color: BRAND }),
  ].join("");

  const footnote = isBill
    ? "Pay your provider directly. Any extra treatment or medicine added during the visit is charged on top of this amount."
    : "This is a starting estimate. Your final price is confirmed on a quick call before your appointment" +
      (discount > 0 ? `, and your ${rs(discount)} coupon comes off that price.` : ".");

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;line-height:1.6;">
  <div style="max-width:600px;margin:20px auto;background-color:#ffffff;box-shadow:0 0 10px rgba(0,0,0,0.1);">
    <div style="background-color:${BRAND};padding:30px 40px;text-align:center;">
      <img src="https://www.paltuu.pk/paltu_logo.svg" alt="Paltuu" style="height:40px;display:block;margin:0 auto 20px auto;" />
      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">${heading}</h1>
      <p style="color:#ffffff;margin:10px 0 0 0;font-size:15px;opacity:0.9;">Vets at Home · #${id}</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="margin:0 0 24px 0;color:#333;font-size:15px;">${intro}</p>
      <table role="presentation" style="width:100%;border-collapse:collapse;border-bottom:1px solid #eee;margin-bottom:16px;">${detailRows}</table>
      <table role="presentation" style="width:100%;border-collapse:collapse;">${priceRows}</table>
      <p style="margin:24px 0 0 0;padding:14px 16px;background:#f8f8f8;border-radius:6px;color:#666;font-size:13px;">${footnote}</p>
    </div>
    <div style="padding:20px 40px;background:#fafafa;text-align:center;color:#999;font-size:12px;">
      Questions? Reply to this email or open the booking in the Paltuu app.
    </div>
  </div>
</body></html>`;

  const text = [
    `${heading} — Vets at Home #${r.request_id}`,
    `Service: ${serviceLabel(r)}`,
    `${isBill ? "Visit price" : "Estimated price"}: ${rs(price)}`,
    discount > 0 ? `Coupon${r.coupon_code ? ` (${r.coupon_code})` : ""}: -${rs(discount)}` : "",
    `${isBill ? "Total payable" : "Estimated payable"}: ${rs(payable)}`,
    footnote,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

async function send(kind: BillKind, requestId: string | number) {
  try {
    // Re-read with the joins the email needs, so callers can pass whatever row they have.
    const res = await db.query(
      `SELECT r.*, u.name AS client_name, u.email AS client_email,
              c.code AS coupon_code, p.name AS provider_name
       FROM express_vet_requests r
       JOIN users u ON u.user_id = r.client_user_id
       LEFT JOIN express_vet_coupons c ON c.coupon_id = r.coupon_id
       LEFT JOIN express_vet_providers p ON p.provider_id = r.assigned_provider_id
       WHERE r.request_id = $1`,
      [requestId]
    );
    const r = res.rows[0];
    if (!r?.client_email) return; // phone-only accounts have nothing to send to

    const { subject, html, text } = buildHtml(kind, r);
    await sendEmailViaBrevo(r.client_email, r.client_name || "Paltuu user", subject, html, text);
  } catch (err) {
    console.error(`express-vet ${kind} email for request ${requestId} failed (non-blocking):`, err);
  }
}

/** Estimate + coupon line, sent when the request is created. */
export function sendExpressVetBookingEmail(request: { request_id: string | number }) {
  return send("booking", request.request_id);
}

/** Final bill (dispatcher-agreed price) + coupon line, sent when the visit is marked completed. */
export function sendExpressVetBillEmail(request: { request_id: string | number }) {
  return send("bill", request.request_id);
}

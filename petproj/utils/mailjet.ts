import Mailjet from "node-mailjet";

// Initialize Mailjet client - using notification credentials for admin emails
const mailjetClient = Mailjet.apiConnect(
  process.env.MAILJET_NOTIFICATION_API_KEY!,
  process.env.MAILJET_NOTIFICATION_SECRET_KEY!
);

const ADMIN_EMAIL = "notifypaltuu@gmail.com";
const FROM_EMAIL = process.env.MAILJET_NOTIFICATION_FROM_EMAIL || process.env.MAILJET_FROM_EMAIL || "noreply@paltuu.pk";
const FROM_NAME = "Paltuu Marketplace";

// Brevo API configuration (fallback if Mailjet fails with Gmail)
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;

/**
 * Send email using Brevo API (supports Gmail sender addresses)
 */
export async function sendEmailViaBrevo(to: string, toName: string, subject: string, htmlContent: string, textContent?: string) {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY not configured');
  }

  const payload = {
    sender: {
      email: BREVO_SENDER_EMAIL || FROM_EMAIL,
      name: FROM_NAME
    },
    to: [{ email: to, name: toName }],
    subject,
    htmlContent,
    textContent: textContent || subject
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo send failed: ${res.status} ${text}`);
  }

  return res.json();
}

interface OrderEmailData {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: any;
  payment_method: string;
  payment_status: string;
  status: string;
  subtotal: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  created_at: string;
  items: Array<{
    product_title: string;
    variant_title?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_sku?: string;
    variant_sku?: string;
  }>;
}

/**
 * Generate HTML email template for order details
 */
function generateOrderEmailHtml(order: OrderEmailData, isAdmin: boolean = false): string {
  const itemsHtml = order.items
    .map((item) => {
      const variantDetails = item.variant_title
        ? `<div style="font-size:13px;color:#777;margin-top:3px;">${item.variant_title}</div>`
        : "";
      const skuInfo =
        item.variant_sku || item.product_sku
          ? `<div style="font-size:12px;color:#999;margin-top:2px;">SKU: ${item.variant_sku || item.product_sku
          }</div>`
          : "";

      return `
        <tr>
          <td style="padding:15px 20px;border-bottom:1px solid #eee;">
            <div style="font-weight:500;color:#333;font-size:15px;">${item.product_title || "Product"
        }</div>
            ${variantDetails}
            ${skuInfo}
          </td>
          <td style="padding:15px 10px;text-align:center;border-bottom:1px solid #eee;color:#666;">
            ${item.quantity}
          </td>
          <td style="padding:15px 10px;text-align:center;border-bottom:1px solid #eee;color:#666;">
            Rs ${Number(item.unit_price || 0).toLocaleString()}
          </td>
          <td style="padding:15px 20px;text-align:right;border-bottom:1px solid #eee;font-weight:600;color:#8B1538;">
            Rs ${Number(item.total_price || 0).toLocaleString()}
          </td>
        </tr>
      `;
    })
    .join("");

  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const shippingAddr =
    typeof order.shipping_address === "string"
      ? JSON.parse(order.shipping_address)
      : order.shipping_address;

  const addressHtml = shippingAddr
    ? `
    <div style="margin-bottom:20px;padding:15px;background-color:#f8f8f8;border-radius:5px;">
      <h3 style="color:#8B1538;font-size:16px;margin:0 0 10px 0;">Shipping Address</h3>
      <p style="margin:0;color:#333;font-size:14px;line-height:1.6;">
        ${shippingAddr.address || ""}<br/>
        ${shippingAddr.city || ""}, ${shippingAddr.postalCode || ""}<br/>
      </p>
    </div>
  `
    : "";

  const headerTitle = isAdmin ? "New Order Received! 🎉" : "Order Confirmation";
  const headerText = isAdmin
    ? "You have a new order from a customer"
    : `Thank you for your order, ${order.customer_name || "valued customer"}!`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${headerTitle} - ${order.order_number}</title>
    </head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;line-height:1.6;">
      <div style="max-width:600px;margin:20px auto;background-color:#ffffff;box-shadow:0 0 10px rgba(0,0,0,0.1);">

        <!-- Header -->
        <div style="background-color:#8B1538;padding:30px 40px;text-align:center;">
          <div style="margin-bottom:20px;">
            <img src="https://www.paltuu.pk/paltu_logo.svg" alt="Paltuu" style="height:40px;display:block;margin:0 auto;" />
          </div>
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">
            ${headerTitle}
          </h1>
          <p style="color:#ffffff;margin:10px 0 0 0;font-size:16px;opacity:0.9;">
            ${headerText}
          </p>
        </div>

        <!-- Content -->
        <div style="padding:40px;">

          <!-- Order Info -->
          <div style="margin-bottom:30px;">
            <h2 style="color:#8B1538;font-size:18px;margin:0 0 15px 0;font-weight:600;">Order Information</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;color:#666;font-size:14px;width:40%;">Order Number:</td>
                <td style="padding:8px 0;color:#333;font-size:14px;font-weight:600;">${order.order_number
    }</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;font-size:14px;">Order Date:</td>
                <td style="padding:8px 0;color:#333;font-size:14px;">${orderDate}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;font-size:14px;">Payment Method:</td>
                <td style="padding:8px 0;color:#333;font-size:14px;text-transform:uppercase;">${order.payment_method || "COD"
    }</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;font-size:14px;">Payment Status:</td>
                <td style="padding:8px 0;color:#333;font-size:14px;">
                  <span style="background-color:${order.payment_status === "paid" ? "#d4edda" : "#fff3cd"
    };color:${order.payment_status === "paid" ? "#155724" : "#856404"
    };padding:4px 8px;border-radius:3px;font-size:12px;font-weight:600;text-transform:uppercase;">
                    ${order.payment_status || "PENDING"}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;font-size:14px;">Order Status:</td>
                <td style="padding:8px 0;color:#333;font-size:14px;">
                  <span style="background-color:#e7f3ff;color:#004085;padding:4px 8px;border-radius:3px;font-size:12px;font-weight:600;text-transform:uppercase;">
                    ${order.status || "PENDING"}
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Customer Info (Only for Admin) -->
          ${isAdmin
      ? `
          <div style="margin-bottom:30px;padding:20px;background-color:#fff9e6;border-left:4px solid #ffc107;border-radius:5px;">
            <h2 style="color:#8B1538;font-size:18px;margin:0 0 15px 0;font-weight:600;">Customer Information</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;color:#666;font-size:14px;width:40%;">Name:</td>
                <td style="padding:8px 0;color:#333;font-size:14px;font-weight:600;">${order.customer_name || "N/A"
      }</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;font-size:14px;">Email:</td>
                <td style="padding:8px 0;color:#333;font-size:14px;">
                  <a href="mailto:${order.customer_email}" style="color:#8B1538;text-decoration:none;">${order.customer_email
      }</a>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;font-size:14px;">Phone:</td>
                <td style="padding:8px 0;color:#333;font-size:14px;">
                  <a href="tel:${order.customer_phone}" style="color:#8B1538;text-decoration:none;">${order.customer_phone
      }</a>
                </td>
              </tr>
            </table>
          </div>
          `
      : ""
    }

          ${isAdmin ? addressHtml : ""}

          <!-- Items -->
          <div style="margin-bottom:30px;">
            <h2 style="color:#8B1538;font-size:18px;margin:0 0 15px 0;font-weight:600;">Order Items</h2>
            <table style="width:100%;border-collapse:collapse;border:1px solid #eee;">
              <thead>
                <tr style="background-color:#f8f8f8;">
                  <th style="padding:15px 20px;text-align:left;font-weight:600;color:#333;font-size:14px;border-bottom:2px solid #8B1538;">Product</th>
                  <th style="padding:15px 10px;text-align:center;font-weight:600;color:#333;font-size:14px;border-bottom:2px solid #8B1538;">Qty</th>
                  <th style="padding:15px 10px;text-align:center;font-weight:600;color:#333;font-size:14px;border-bottom:2px solid #8B1538;">Price</th>
                  <th style="padding:15px 20px;text-align:right;font-weight:600;color:#333;font-size:14px;border-bottom:2px solid #8B1538;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Order Total -->
          <div style="background-color:#f8f8f8;padding:25px;border-left:4px solid #8B1538;margin-bottom:30px;">
            <div style="text-align:right;">
              <div style="margin-bottom:8px;">
                <span style="color:#666;font-size:14px;">Subtotal: </span>
                <span style="color:#333;font-size:14px;font-weight:500;">Rs ${Number(
      order.subtotal || 0
    ).toLocaleString()}</span>
              </div>
              ${order.shipping_amount > 0
      ? `
              <div style="margin-bottom:8px;">
                <span style="color:#666;font-size:14px;">Shipping: </span>
                <span style="color:#333;font-size:14px;font-weight:500;">Rs ${Number(
        order.shipping_amount
      ).toLocaleString()}</span>
              </div>`
      : ""
    }
              ${order.discount_amount > 0
      ? `
              <div style="margin-bottom:8px;">
                <span style="color:#666;font-size:14px;">Discount: </span>
                <span style="color:#27AE60;font-size:14px;font-weight:500;">-Rs ${Number(
        order.discount_amount
      ).toLocaleString()}</span>
              </div>`
      : ""
    }
              <div style="border-top:1px solid #ddd;padding-top:15px;margin-top:15px;">
                <span style="color:#8B1538;font-size:18px;font-weight:700;">Total: Rs ${Number(
      order.total_amount || 0
    ).toLocaleString()}</span>
              </div>
            </div>
          </div>

          ${!isAdmin
      ? `
          <!-- Action Buttons -->
          <div style="text-align:center;margin:30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://www.paltuu.pk"
      }/order-confirmed?orderNumber=${encodeURIComponent(order.order_number)}"
               style="display:inline-block;background-color:#8B1538;color:#ffffff;text-decoration:none;padding:12px 25px;border-radius:5px;font-weight:600;font-size:14px;margin:0 10px 15px 0;">
              View Order Details
            </a>
            <a href="https://www.paltuu.pk/marketplace"
               style="display:inline-block;background-color:#ffffff;color:#8B1538;text-decoration:none;padding:12px 25px;border-radius:5px;font-weight:600;font-size:14px;border:2px solid #8B1538;">
              Continue Shopping
            </a>
          </div>
          `
      : `
          <!-- Admin Action Button -->
          <div style="text-align:center;margin:30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://www.paltuu.pk"
      }/orders"
               style="display:inline-block;background-color:#8B1538;color:#ffffff;text-decoration:none;padding:14px 30px;border-radius:5px;font-weight:600;font-size:15px;">
              Manage Order in Admin Panel
            </a>
          </div>
          `
    }

          <!-- Contact Info -->
          <div style="text-align:center;padding:20px;background-color:#f8f8f8;border-radius:5px;">
            <p style="margin:0 0 10px 0;color:#333;font-size:15px;font-weight:600;">Need Help?</p>
            <p style="margin:0;color:#666;font-size:14px;">
              ${isAdmin
      ? "Manage this order from your admin panel"
      : 'Have questions about your order? Contact us at <a href="mailto:support@paltuu.com" style="color:#8B1538;text-decoration:none;">support@paltuu.com</a>'
    }
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color:#333;padding:25px;text-align:center;">
          <p style="margin:0 0 10px 0;color:#ffffff;font-size:16px;font-weight:600;">Paltuu</p>
          <p style="margin:0 0 15px 0;color:#ccc;font-size:13px;">Your trusted pet companion marketplace</p>
          <div>
            <a href="https://www.paltuu.pk" style="color:#8B1538;text-decoration:none;font-size:12px;margin:0 10px;">Website</a>
            <a href="https://www.paltuu.pk/about-us" style="color:#8B1538;text-decoration:none;font-size:12px;margin:0 10px;">About</a>
            <a href="mailto:support@paltuu.com" style="color:#8B1538;text-decoration:none;font-size:12px;margin:0 10px;">Support</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(
  order: OrderEmailData
): Promise<void> {
  try {
    if (!order.customer_email) {
      console.warn("No customer email provided, skipping customer notification");
      return;
    }

    const html = generateOrderEmailHtml(order, false);
    const subject = `Order Confirmed: ${order.order_number} - Paltuu`;
    const textContent = `Order Confirmation\n\nThank you for your order, ${order.customer_name || "valued customer"
      }!\n\nOrder Number: ${order.order_number
      }\nTotal Amount: Rs ${Number(
        order.total_amount || 0
      ).toLocaleString()}\n\nView your order: ${process.env.NEXT_PUBLIC_SITE_URL || "https://www.paltuu.pk"
      }/order-confirmed?orderNumber=${encodeURIComponent(
        order.order_number
      )}`;

    // Use Brevo API instead of Mailjet
    await sendEmailViaBrevo(
      order.customer_email,
      order.customer_name,
      subject,
      html,
      textContent
    );

    console.log(
      `✅ Order confirmation email sent to customer: ${order.customer_email}`
    );
  } catch (error: any) {
    console.error("❌ Failed to send order confirmation email to customer:");
    console.error("Error details:", error?.message || error);
    console.error("Full error:", JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Send order notification email to admin
 */
export async function sendOrderNotificationToAdmin(
  order: OrderEmailData
): Promise<void> {
  try {
    const html = generateOrderEmailHtml(order, true);
    const subject = `🛍️ New Order Received: ${order.order_number} - Rs ${Number(
      order.total_amount || 0
    ).toLocaleString()}`;
    const textContent = `New Order Received!\n\nOrder Number: ${order.order_number
      }\nCustomer: ${order.customer_name} (${order.customer_email
      })\nPhone: ${order.customer_phone}\nTotal Amount: Rs ${Number(
        order.total_amount || 0
      ).toLocaleString()}\nPayment Method: ${order.payment_method
      }\n\nManage order: ${process.env.NEXT_PUBLIC_SITE_URL || "https://www.paltuu.pk"
      }/orders`;

    // Use Brevo API instead of Mailjet
    await sendEmailViaBrevo(
      ADMIN_EMAIL,
      "Paltuu Admin",
      subject,
      html,
      textContent
    );

    console.log(`✅ Order notification email sent to admin: ${ADMIN_EMAIL}`);
  } catch (error: any) {
    console.error("❌ Failed to send order notification email to admin:");
    console.error("Error details:", error?.message || error);
    console.error("Error response:", error?.response?.body || error?.statusCode);
    throw error;
  }
}

/**
 * Send both customer and admin emails for a new order
 */
export async function sendOrderEmails(order: OrderEmailData): Promise<void> {
  try {
    // Send both emails in parallel
    await Promise.allSettled([
      sendOrderConfirmationEmail(order),
      sendOrderNotificationToAdmin(order),
    ]);
  } catch (error) {
    console.error("❌ Error in sendOrderEmails:", error);
    // Don't throw - we don't want email failures to break order creation
  }
}

/**
 * Send email notification for new pet listing awaiting approval
 */
export async function sendNewListingNotification(petData: {
  pet_id: number;
  pet_name: string;
  pet_type: string;
  listing_type: string;
  owner_name?: string;
  owner_email?: string;
}): Promise<void> {
  console.log('📧 Attempting to send new listing notification:', petData.pet_name);
  try {
    const subject = `🐾 New Pet Listing Awaiting Approval - ${petData.pet_name}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
        <div style="max-width:600px;margin:20px auto;background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color:#8B1538;padding:30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">🐾 New Pet Listing</h1>
          </div>
          <div style="padding:30px;">
            <h2 style="color:#8B1538;margin-top:0;">Listing Awaiting Approval</h2>
            <p style="color:#666;line-height:1.6;">A new pet listing has been submitted and requires your approval.</p>

            <div style="background-color:#f8f8f8;border-left:4px solid #8B1538;padding:20px;margin:20px 0;border-radius:5px;">
              <p style="margin:5px 0;"><strong>Pet Name:</strong> ${petData.pet_name}</p>
              <p style="margin:5px 0;"><strong>Pet Type:</strong> ${petData.pet_type}</p>
              <p style="margin:5px 0;"><strong>Listing Type:</strong> ${petData.listing_type}</p>
              ${petData.owner_name ? `<p style="margin:5px 0;"><strong>Owner:</strong> ${petData.owner_name}</p>` : ''}
              ${petData.owner_email ? `<p style="margin:5px 0;"><strong>Owner Email:</strong> <a href="mailto:${petData.owner_email}" style="color:#8B1538;">${petData.owner_email}</a></p>` : ''}
            </div>

            <div style="text-align:center;margin:30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.paltuu.pk'}/admin-pet-approval"
                 style="display:inline-block;background-color:#8B1538;color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:5px;font-weight:600;">
                Review Listing
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Use Brevo API
    await sendEmailViaBrevo(
      ADMIN_EMAIL,
      "Paltuu Admin",
      subject,
      html
    );

    console.log(`✅ New listing notification sent to admin for pet: ${petData.pet_name}`);
  } catch (error: any) {
    console.error("❌ Failed to send new listing notification:");
    console.error("Error details:", error?.message || error);
    console.error("Error response:", error?.response?.body || error?.statusCode);
    throw error;
  }
}

/**
 * Send email notification for new adoption application
 */
export async function sendAdoptionApplicationEmails(applicationData: {
  pet_name: string;
  pet_id: number;
  adopter_name: string;
  adopter_email?: string;
  owner_email?: string;
  owner_name?: string;
  application_id: number;
}): Promise<void> {
  console.log('📧 Attempting to send adoption application emails for:', applicationData.pet_name);
  try {
    const emails = [];

    // Email to admin
    const adminSubject = `🏡 New Adoption Application - ${applicationData.pet_name}`;
    const adminHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
        <div style="max-width:600px;margin:20px auto;background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color:#8B1538;padding:30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">🏡 New Adoption Application</h1>
          </div>
          <div style="padding:30px;">
            <h2 style="color:#8B1538;margin-top:0;">Application Received</h2>
            <p style="color:#666;line-height:1.6;">A new adoption application has been submitted.</p>

            <div style="background-color:#f8f8f8;border-left:4px solid #8B1538;padding:20px;margin:20px 0;border-radius:5px;">
              <p style="margin:5px 0;"><strong>Pet:</strong> ${applicationData.pet_name}</p>
              <p style="margin:5px 0;"><strong>Applicant:</strong> ${applicationData.adopter_name}</p>
              ${applicationData.adopter_email ? `<p style="margin:5px 0;"><strong>Applicant Email:</strong> <a href="mailto:${applicationData.adopter_email}" style="color:#8B1538;">${applicationData.adopter_email}</a></p>` : ''}
              ${applicationData.owner_name ? `<p style="margin:5px 0;"><strong>Pet Owner:</strong> ${applicationData.owner_name}</p>` : ''}
              ${applicationData.owner_email ? `<p style="margin:5px 0;"><strong>Owner Email:</strong> <a href="mailto:${applicationData.owner_email}" style="color:#8B1538;">${applicationData.owner_email}</a></p>` : ''}
            </div>

            <div style="text-align:center;margin:30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.paltuu.pk'}/adoption-applicants?pet_id=${applicationData.pet_id}"
                 style="display:inline-block;background-color:#8B1538;color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:5px;font-weight:600;">
                View Application
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send to admin using Brevo
    emails.push(
      sendEmailViaBrevo(
        ADMIN_EMAIL,
        "Paltuu Admin",
        adminSubject,
        adminHtml
      )
    );

    // Email to pet owner
    if (applicationData.owner_email) {
      const ownerSubject = `🏡 New Adoption Application for ${applicationData.pet_name}`;
      const ownerHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
          <div style="max-width:600px;margin:20px auto;background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
            <div style="background-color:#8B1538;padding:30px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;">🏡 New Application Received!</h1>
            </div>
            <div style="padding:30px;">
              <p style="color:#666;line-height:1.6;">Hello ${applicationData.owner_name || 'Pet Owner'},</p>
              <p style="color:#666;line-height:1.6;">Great news! Someone is interested in adopting <strong>${applicationData.pet_name}</strong>!</p>

              <div style="background-color:#f8f8f8;border-left:4px solid #8B1538;padding:20px;margin:20px 0;border-radius:5px;">
                <p style="margin:5px 0;"><strong>Applicant Name:</strong> ${applicationData.adopter_name}</p>
                ${applicationData.adopter_email ? `<p style="margin:5px 0;"><strong>Contact:</strong> <a href="mailto:${applicationData.adopter_email}" style="color:#8B1538;">${applicationData.adopter_email}</a></p>` : ''}
              </div>

              <p style="color:#666;line-height:1.6;">Please review the application details and respond promptly.</p>

              <div style="text-align:center;margin:30px 0;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.paltuu.pk'}/adoption-applicants?pet_id=${applicationData.pet_id}"
                   style="display:inline-block;background-color:#8B1538;color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:5px;font-weight:600;">
                  Review Application
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      emails.push(
        sendEmailViaBrevo(
          applicationData.owner_email,
          applicationData.owner_name || "Pet Owner",
          ownerSubject,
          ownerHtml
        )
      );
    }

    await Promise.allSettled(emails);
    console.log(`✅ Adoption application emails sent for pet: ${applicationData.pet_name}`);
  } catch (error: any) {
    console.error("❌ Failed to send adoption application emails:");
    console.error("Error details:", error?.message || error);
    console.error("Error response:", error?.response?.body || error?.statusCode);
    throw error;
  }
}

/**
 * Send email notification for new shelter admin signup
 */
export async function sendNewShelterAdminNotification(shelterData: {
  shelter_name: string;
  admin_name: string;
  admin_email: string;
  admin_phone?: string;
  city?: string;
  address?: string;
}): Promise<void> {
  console.log('📧 Attempting to send shelter admin notification for:', shelterData.shelter_name);
  try {
    const subject = `🏢 New Shelter Admin Registration - ${shelterData.shelter_name}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
        <div style="max-width:600px;margin:20px auto;background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color:#8B1538;padding:30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">🏢 New Shelter Registration</h1>
          </div>
          <div style="padding:30px;">
            <h2 style="color:#8B1538;margin-top:0;">Shelter Admin Signed Up</h2>
            <p style="color:#666;line-height:1.6;">A new shelter admin has registered on the platform.</p>

            <div style="background-color:#f8f8f8;border-left:4px solid #8B1538;padding:20px;margin:20px 0;border-radius:5px;">
              <p style="margin:5px 0;"><strong>Shelter Name:</strong> ${shelterData.shelter_name}</p>
              <p style="margin:5px 0;"><strong>Admin Name:</strong> ${shelterData.admin_name}</p>
              <p style="margin:5px 0;"><strong>Email:</strong> <a href="mailto:${shelterData.admin_email}" style="color:#8B1538;">${shelterData.admin_email}</a></p>
              ${shelterData.admin_phone ? `<p style="margin:5px 0;"><strong>Phone:</strong> ${shelterData.admin_phone}</p>` : ''}
              ${shelterData.city ? `<p style="margin:5px 0;"><strong>City:</strong> ${shelterData.city}</p>` : ''}
              ${shelterData.address ? `<p style="margin:5px 0;"><strong>Address:</strong> ${shelterData.address}</p>` : ''}
            </div>

            <div style="text-align:center;margin:30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.paltuu.pk'}/admin-panel"
                 style="display:inline-block;background-color:#8B1538;color:#ffffff;text-decoration:none;padding:12px 30px;border-radius:5px;font-weight:600;">
                View in Admin Panel
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Use Brevo API
    await sendEmailViaBrevo(
      ADMIN_EMAIL,
      "Paltuu Admin",
      subject,
      html
    );

    console.log(`✅ New shelter admin notification sent: ${shelterData.shelter_name}`);
  } catch (error: any) {
    console.error("❌ Failed to send shelter admin notification:");
    console.error("Error details:", error?.message || error);
    console.error("Error response:", error?.response?.body || error?.statusCode);
    throw error;
  }
}

/**
 * Send email notification for cart activity (add to cart, checkout page visit)
 */
export async function sendCartActivityNotification(activityData: {
  activity_type: 'add_to_cart' | 'checkout_visit' | 'checkout_click';
  user_email?: string;
  user_name?: string;
  user_id?: number;
  session_id?: string;
  product_name?: string;
  cart_items?: Array<{ title: string; quantity: number; price: number }>;
  cart_total?: number;
}): Promise<void> {
  console.log('📧 Attempting to send cart activity notification:', activityData.activity_type);
  try {
    const activityLabels = {
      add_to_cart: '🛒 Item Added to Cart',
      checkout_visit: '💳 Checkout Page Visited',
      checkout_click: '💳 Checkout Initiated',
    };

    const subject = `${activityLabels[activityData.activity_type]} - Retargeting Opportunity`;

    const itemsHtml = activityData.cart_items
      ? activityData.cart_items.map(item => `
          <li style="margin:5px 0;">
            ${item.title} - Qty: ${item.quantity} - Rs ${(item.price * item.quantity).toLocaleString()}
          </li>
        `).join('')
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
        <div style="max-width:600px;margin:20px auto;background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color:#8B1538;padding:30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">${activityLabels[activityData.activity_type]}</h1>
          </div>
          <div style="padding:30px;">
            <h2 style="color:#8B1538;margin-top:0;">Cart Activity Detected</h2>
            <p style="color:#666;line-height:1.6;">A customer is showing purchase intent.</p>

            <div style="background-color:#f8f8f8;border-left:4px solid #8B1538;padding:20px;margin:20px 0;border-radius:5px;">
              <p style="margin:5px 0;"><strong>Activity:</strong> ${activityLabels[activityData.activity_type]}</p>
              ${activityData.user_name ? `<p style="margin:5px 0;"><strong>User:</strong> ${activityData.user_name}</p>` : ''}
              ${activityData.user_email ? `<p style="margin:5px 0;"><strong>Email:</strong> <a href="mailto:${activityData.user_email}" style="color:#8B1538;">${activityData.user_email}</a></p>` : ''}
              ${activityData.user_id ? `<p style="margin:5px 0;"><strong>User ID:</strong> ${activityData.user_id}</p>` : ''}
              ${activityData.session_id && !activityData.user_id ? `<p style="margin:5px 0;"><strong>Session ID:</strong> ${activityData.session_id}</p>` : ''}
              ${activityData.product_name ? `<p style="margin:5px 0;"><strong>Product:</strong> ${activityData.product_name}</p>` : ''}
              ${activityData.cart_total ? `<p style="margin:5px 0;"><strong>Cart Total:</strong> Rs ${activityData.cart_total.toLocaleString()}</p>` : ''}
            </div>

            ${itemsHtml ? `
            <div style="background-color:#fff9e6;border-left:4px solid:#ffc107;padding:20px;margin:20px 0;border-radius:5px;">
              <p style="margin:0 0 10px 0;"><strong>Cart Items:</strong></p>
              <ul style="margin:0;padding-left:20px;">
                ${itemsHtml}
              </ul>
            </div>
            ` : ''}

            <p style="color:#666;line-height:1.6;"><strong>💡 Retargeting Tip:</strong> This is a great opportunity for follow-up campaigns!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Use Brevo API
    await sendEmailViaBrevo(
      ADMIN_EMAIL,
      "Paltuu Admin",
      subject,
      html
    );

    console.log(`✅ Cart activity notification sent: ${activityData.activity_type}`);
  } catch (error: any) {
    console.error("❌ Failed to send cart activity notification:");
    console.error("Error details:", error?.message || error);
    // Don't throw - cart activity emails are nice-to-have
  }
}

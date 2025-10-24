import Mailjet from "node-mailjet";

// Initialize Mailjet client
const mailjetClient = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY!,
  process.env.MAILJET_SECRET_KEY!
);

const ADMIN_EMAIL = "notifypaltuu@gmail.com";
const FROM_EMAIL = process.env.MAILJET_FROM_EMAIL || "noreply@paltuu.pk";
const FROM_NAME = "Paltuu Marketplace";

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
          ? `<div style="font-size:12px;color:#999;margin-top:2px;">SKU: ${
              item.variant_sku || item.product_sku
            }</div>`
          : "";

      return `
        <tr>
          <td style="padding:15px 20px;border-bottom:1px solid #eee;">
            <div style="font-weight:500;color:#333;font-size:15px;">${
              item.product_title || "Product"
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
                <td style="padding:8px 0;color:#333;font-size:14px;font-weight:600;">${
                  order.order_number
                }</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;font-size:14px;">Order Date:</td>
                <td style="padding:8px 0;color:#333;font-size:14px;">${orderDate}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;font-size:14px;">Payment Method:</td>
                <td style="padding:8px 0;color:#333;font-size:14px;text-transform:uppercase;">${
                  order.payment_method || "COD"
                }</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;font-size:14px;">Payment Status:</td>
                <td style="padding:8px 0;color:#333;font-size:14px;">
                  <span style="background-color:${
                    order.payment_status === "paid" ? "#d4edda" : "#fff3cd"
                  };color:${
    order.payment_status === "paid" ? "#155724" : "#856404"
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
          ${
            isAdmin
              ? `
          <div style="margin-bottom:30px;padding:20px;background-color:#fff9e6;border-left:4px solid #ffc107;border-radius:5px;">
            <h2 style="color:#8B1538;font-size:18px;margin:0 0 15px 0;font-weight:600;">Customer Information</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;color:#666;font-size:14px;width:40%;">Name:</td>
                <td style="padding:8px 0;color:#333;font-size:14px;font-weight:600;">${
                  order.customer_name || "N/A"
                }</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;font-size:14px;">Email:</td>
                <td style="padding:8px 0;color:#333;font-size:14px;">
                  <a href="mailto:${order.customer_email}" style="color:#8B1538;text-decoration:none;">${
                  order.customer_email
                }</a>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#666;font-size:14px;">Phone:</td>
                <td style="padding:8px 0;color:#333;font-size:14px;">
                  <a href="tel:${order.customer_phone}" style="color:#8B1538;text-decoration:none;">${
                  order.customer_phone
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
              ${
                order.shipping_amount > 0
                  ? `
              <div style="margin-bottom:8px;">
                <span style="color:#666;font-size:14px;">Shipping: </span>
                <span style="color:#333;font-size:14px;font-weight:500;">Rs ${Number(
                  order.shipping_amount
                ).toLocaleString()}</span>
              </div>`
                  : ""
              }
              ${
                order.discount_amount > 0
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

          ${
            !isAdmin
              ? `
          <!-- Action Buttons -->
          <div style="text-align:center;margin:30px 0;">
            <a href="${
              process.env.NEXT_PUBLIC_SITE_URL || "https://www.paltuu.pk"
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
            <a href="${
              process.env.NEXT_PUBLIC_SITE_URL || "https://www.paltuu.pk"
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
              ${
                isAdmin
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

    await mailjetClient.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: { Email: FROM_EMAIL, Name: FROM_NAME },
          To: [{ Email: order.customer_email, Name: order.customer_name }],
          Subject: subject,
          HTMLPart: html,
          TextPart: `Order Confirmation\n\nThank you for your order, ${
            order.customer_name || "valued customer"
          }!\n\nOrder Number: ${
            order.order_number
          }\nTotal Amount: Rs ${Number(
            order.total_amount || 0
          ).toLocaleString()}\n\nView your order: ${
            process.env.NEXT_PUBLIC_SITE_URL || "https://www.paltuu.pk"
          }/order-confirmed?orderNumber=${encodeURIComponent(
            order.order_number
          )}`,
        },
      ],
    });

    console.log(
      `✅ Order confirmation email sent to customer: ${order.customer_email}`
    );
  } catch (error) {
    console.error("❌ Failed to send order confirmation email to customer:", error);
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

    await mailjetClient.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: { Email: FROM_EMAIL, Name: FROM_NAME },
          To: [{ Email: ADMIN_EMAIL, Name: "Paltuu Admin" }],
          Subject: subject,
          HTMLPart: html,
          TextPart: `New Order Received!\n\nOrder Number: ${
            order.order_number
          }\nCustomer: ${order.customer_name} (${
            order.customer_email
          })\nPhone: ${order.customer_phone}\nTotal Amount: Rs ${Number(
            order.total_amount || 0
          ).toLocaleString()}\nPayment Method: ${
            order.payment_method
          }\n\nManage order: ${
            process.env.NEXT_PUBLIC_SITE_URL || "https://www.paltuu.pk"
          }/orders`,
        },
      ],
    });

    console.log(`✅ Order notification email sent to admin: ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error("❌ Failed to send order notification email to admin:", error);
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

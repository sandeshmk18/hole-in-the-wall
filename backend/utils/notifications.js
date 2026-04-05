const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// ── Email Templates ──────────────────────────────────────
const emailTemplates = {
  reservationConfirmed: (r) => ({
    subject: `✅ Booking Confirmed — ${process.env.CAFE_NAME}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#faf6f0;padding:32px;border-radius:8px">
        <h2 style="color:#3b2314;font-size:24px;margin-bottom:8px">Your table is reserved! ☕</h2>
        <p style="color:#6b3f26;font-size:15px;line-height:1.7">Hi <strong>${r.name}</strong>, we're looking forward to seeing you.</p>
        <div style="background:#fff;border-radius:6px;padding:20px;margin:20px 0;border-left:4px solid #c8885a">
          <p style="margin:6px 0;color:#3b2314"><strong>📅 Date:</strong> ${new Date(r.date).toDateString()}</p>
          <p style="margin:6px 0;color:#3b2314"><strong>⏰ Time:</strong> ${r.time}</p>
          <p style="margin:6px 0;color:#3b2314"><strong>👥 Guests:</strong> ${r.guests}</p>
          ${r.tableNumber ? `<p style="margin:6px 0;color:#3b2314"><strong>🪑 Table:</strong> #${r.tableNumber}</p>` : ''}
          ${r.specialNote ? `<p style="margin:6px 0;color:#3b2314"><strong>📝 Note:</strong> ${r.specialNote}</p>` : ''}
        </div>
        <p style="color:#6b3f26;font-size:14px">📍 ${process.env.CAFE_ADDRESS}</p>
        <p style="color:#6b3f26;font-size:14px">📞 ${process.env.CAFE_PHONE}</p>
        <p style="color:#a0613a;font-size:13px;margin-top:24px">Need to change or cancel? Call us at ${process.env.CAFE_PHONE}</p>
        <p style="color:#c8885a;font-size:13px;border-top:1px solid #e2b48a;padding-top:16px;margin-top:24px">
          ${process.env.CAFE_NAME} · ${process.env.CAFE_ADDRESS}
        </p>
      </div>
    `,
  }),

  orderConfirmed: (o) => ({
    subject: `🍳 Order Confirmed #${o._id.toString().slice(-6).toUpperCase()} — ${process.env.CAFE_NAME}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#faf6f0;padding:32px;border-radius:8px">
        <h2 style="color:#3b2314">Order Confirmed! 🎉</h2>
        <p style="color:#6b3f26">Hi <strong>${o.customerName}</strong>, we've received your order.</p>
        <div style="background:#fff;border-radius:6px;padding:20px;margin:20px 0">
          <p style="margin:0 0 12px;color:#3b2314;font-weight:bold">Order Summary</p>
          ${o.items.map(i => `
            <div style="display:flex;justify-content:space-between;margin:6px 0;color:#5c3d28">
              <span>${i.name} × ${i.quantity}</span>
              <span>₹${(i.price * i.quantity).toFixed(0)}</span>
            </div>
          `).join('')}
          <hr style="border:none;border-top:1px solid #e2b48a;margin:12px 0"/>
          <div style="display:flex;justify-content:space-between;color:#3b2314;font-weight:bold">
            <span>Total Paid</span><span>₹${o.total.toFixed(0)}</span>
          </div>
        </div>
        <p style="color:#6b3f26;font-size:14px">Type: ${o.orderType.toUpperCase()}</p>
        <p style="color:#c8885a;font-size:13px;border-top:1px solid #e2b48a;padding-top:16px;margin-top:24px">
          ${process.env.CAFE_NAME} · ${process.env.CAFE_ADDRESS}
        </p>
      </div>
    `,
  }),

  adminNewReservation: (r) => ({
    subject: `🔔 New Reservation — ${r.name} (${r.guests} guests) on ${new Date(r.date).toDateString()}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h3 style="color:#3b2314">New Table Reservation</h3>
        <p><strong>Name:</strong> ${r.name}</p>
        <p><strong>Phone:</strong> ${r.phone}</p>
        <p><strong>Date:</strong> ${new Date(r.date).toDateString()} at ${r.time}</p>
        <p><strong>Guests:</strong> ${r.guests}</p>
        ${r.specialNote ? `<p><strong>Note:</strong> ${r.specialNote}</p>` : ''}
        <a href="${process.env.FRONTEND_URL}/admin" style="background:#c8885a;color:white;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block;margin-top:12px">View in Dashboard</a>
      </div>
    `,
  }),
};

// ── Send Email ──────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY.startsWith('SG.xxx')) {
    console.log(`📧 [DEV] Email to ${to}: ${subject}`);
    return;
  }
  try {
    await sgMail.send({
      to, from: { email: process.env.EMAIL_FROM, name: process.env.EMAIL_FROM_NAME },
      subject, html,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error('❌ Email error:', err.message);
  }
};

// ── Send SMS ────────────────────────────────────────────
const sendSMS = async (to, body) => {
  if (!twilioClient || process.env.TWILIO_ACCOUNT_SID?.startsWith('ACxxx')) {
    console.log(`📱 [DEV] SMS to ${to}: ${body}`);
    return;
  }
  try {
    await twilioClient.messages.create({
      body, from: process.env.TWILIO_PHONE_NUMBER, to,
    });
    console.log(`✅ SMS sent to ${to}`);
  } catch (err) {
    console.error('❌ SMS error:', err.message);
  }
};

// ── Send WhatsApp ───────────────────────────────────────
const sendWhatsApp = async (to, body) => {
  if (!twilioClient || process.env.TWILIO_ACCOUNT_SID?.startsWith('ACxxx')) {
    console.log(`💬 [DEV] WhatsApp to ${to}: ${body}`);
    return;
  }
  try {
    await twilioClient.messages.create({
      body,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
    });
    console.log(`✅ WhatsApp sent to ${to}`);
  } catch (err) {
    console.error('❌ WhatsApp error:', err.message);
  }
};

// ── Notification Bundles ────────────────────────────────
const notifyReservationConfirmed = async (reservation) => {
  const phone = reservation.phone.startsWith('+') ? reservation.phone : `+91${reservation.phone}`;
  const smsBody = `Hi ${reservation.name}! Your table at ${process.env.CAFE_NAME} is confirmed for ${new Date(reservation.date).toDateString()} at ${reservation.time} for ${reservation.guests} guest(s). See you soon! ☕`;

  await Promise.allSettled([
    reservation.email
      ? sendEmail({ to: reservation.email, ...emailTemplates.reservationConfirmed(reservation) })
      : Promise.resolve(),
    sendSMS(phone, smsBody),
    sendWhatsApp(phone, smsBody),
    sendEmail({ to: process.env.ADMIN_EMAIL, ...emailTemplates.adminNewReservation(reservation) }),
  ]);
};

const notifyOrderConfirmed = async (order) => {
  const phone = order.customerPhone.startsWith('+') ? order.customerPhone : `+91${order.customerPhone}`;
  const itemList = order.items.map(i => `${i.name} ×${i.quantity}`).join(', ');
  const smsBody = `Order confirmed at ${process.env.CAFE_NAME}! 🍳 Items: ${itemList}. Total: ₹${order.total}. We'll have it ready soon!`;

  await Promise.allSettled([
    order.customerEmail
      ? sendEmail({ to: order.customerEmail, ...emailTemplates.orderConfirmed(order) })
      : Promise.resolve(),
    sendSMS(phone, smsBody),
    sendWhatsApp(phone, smsBody),
  ]);
};

module.exports = {
  sendEmail, sendSMS, sendWhatsApp,
  notifyReservationConfirmed, notifyOrderConfirmed,
};

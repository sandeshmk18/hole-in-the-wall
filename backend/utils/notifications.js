const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

if (process.env.SENDGRID_API_KEY?.startsWith('SG.')) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const isValidTwilio = process.env.TWILIO_ACCOUNT_SID?.startsWith('AC') &&
  process.env.TWILIO_AUTH_TOKEN?.length > 10;
const twilioClient = isValidTwilio
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SENDGRID_API_KEY?.startsWith('SG.')) {
    console.log(`📧 [DEV] Email to ${to}: ${subject}`);
    return;
  }
  try {
    await sgMail.send({ to, from: { email: process.env.EMAIL_FROM, name: process.env.EMAIL_FROM_NAME }, subject, html });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) { console.error('❌ Email error:', err.message); }
};

const sendSMS = async (to, body) => {
  if (!twilioClient) { console.log(`📱 [DEV] SMS to ${to}: ${body}`); return; }
  try {
    await twilioClient.messages.create({ body, from: process.env.TWILIO_PHONE_NUMBER, to });
  } catch (err) { console.error('❌ SMS error:', err.message); }
};

const sendWhatsApp = async (to, body) => {
  if (!twilioClient) { console.log(`💬 [DEV] WhatsApp to ${to}: ${body}`); return; }
  try {
    await twilioClient.messages.create({ body, from: process.env.TWILIO_WHATSAPP_NUMBER, to: `whatsapp:${to}` });
  } catch (err) { console.error('❌ WhatsApp error:', err.message); }
};

const notifyReservationConfirmed = async (reservation) => {
  const phone = reservation.phone.startsWith('+') ? reservation.phone : `+91${reservation.phone}`;
  const smsBody = `Hi ${reservation.name}! Your table at ${process.env.CAFE_NAME} is confirmed for ${new Date(reservation.date).toDateString()} at ${reservation.time} for ${reservation.guests} guest(s). See you soon!`;
  await Promise.allSettled([
    reservation.email ? sendEmail({ to: reservation.email, subject: 'Booking Confirmed', html: `<p>Hi ${reservation.name}, your table is confirmed for ${new Date(reservation.date).toDateString()} at ${reservation.time}.</p>` }) : Promise.resolve(),
    sendSMS(phone, smsBody),
    sendWhatsApp(phone, smsBody),
  ]);
};

const notifyOrderConfirmed = async (order) => {
  const phone = order.customerPhone.startsWith('+') ? order.customerPhone : `+91${order.customerPhone}`;
  const smsBody = `Order confirmed at ${process.env.CAFE_NAME}! Total: ₹${order.total}. Ready soon!`;
  await Promise.allSettled([
    order.customerEmail ? sendEmail({ to: order.customerEmail, subject: 'Order Confirmed', html: `<p>Order confirmed. Total: ₹${order.total}</p>` }) : Promise.resolve(),
    sendSMS(phone, smsBody),
    sendWhatsApp(phone, smsBody),
  ]);
};

module.exports = { sendEmail, sendSMS, sendWhatsApp, notifyReservationConfirmed, notifyOrderConfirmed };
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendEmail(to, subject, html) {
    // If SMTP_USER is not set, log the email to console for development purposes
    if (!process.env.SMTP_USER) {
        console.log(`\n========================================`);
        console.log(`MOCK EMAIL SENT TO: ${to}`);
        console.log(`SUBJECT: ${subject}`);
        console.log(`BODY: ${html}`);
        console.log(`========================================\n`);
        return { success: true, messageId: 'mock-id' };
    }

    try {
        const info = await transporter.sendMail({
            from: `"SoleKicks PK" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });
        console.log(`Email sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
}

async function sendOrderConfirmation(to, order, origin_url) {
    try {
        const templatePath = path.join(__dirname, '..', 'templates', 'order-confirmation.ejs');
        const html = await ejs.renderFile(templatePath, { order, origin_url });
        return await sendEmail(to, `Order Confirmation #${order.order_number} - SoleKicks PK`, html);
    } catch (error) {
        console.error('Error rendering or sending order confirmation email:', error);
        return { success: false, error: error.message };
    }
}

module.exports = { sendEmail, sendOrderConfirmation };

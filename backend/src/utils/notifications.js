const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../db');

async function notify(order, event, message) {
    const rec = {
        id: uuidv4(),
        order_id: order.id,
        order_number: order.order_number,
        phone: order.customer_phone,
        channel: 'whatsapp',
        event: event,
        message: message,
        status: 'logged'
    };

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const tok = process.env.TWILIO_AUTH_TOKEN;
    const frm = process.env.TWILIO_WHATSAPP_FROM;
    const to = order.customer_phone;

    if (sid && tok && frm && to) {
        try {
            let digits = to.replace(/[^0-9+]/g, '');
            if (!digits.startsWith('+')) {
                digits = '+92' + digits.replace(/^0+/, '');
            }

            const auth = Buffer.from(`${sid}:${tok}`).toString('base64');
            const data = new URLSearchParams({
                From: `whatsapp:${frm}`,
                To: `whatsapp:${digits}`,
                Body: message
            });

            const r = await axios.post(
                `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
                data.toString(),
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout: 15000
                }
            );

            rec.status = r.status < 300 ? 'sent' : 'failed';
        } catch (err) {
            rec.status = 'failed';
            rec.error = err.response ? JSON.stringify(err.response.data).substring(0, 200) : err.message.substring(0, 200);
            console.error(`twilio send failed: ${err.message}`);
        }
    }

    await prisma.notification.create({ data: rec });
    console.log(`[WHATSAPP:${event}:${rec.status}] -> ${to}: ${message}`);
    return rec;
}

module.exports = { notify };

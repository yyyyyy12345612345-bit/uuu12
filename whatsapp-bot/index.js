const express = require('express');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const SESSION_DIR = './baileys_session';
const QR_FILE = './qr_code.png';
let sock = null;
let qrBuffer = null;

// ── WhatsApp Connection ──
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Chrome (Linux)', '', ''],
  });

  // QR event
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      try {
        const QR = require('qrcode-terminal');
        QR.generate(qr, { small: true });

        // Save QR as PNG using terminal HTML approach - actually use a proper QR lib
        const QRCode = require('qrcode');
        qrBuffer = await QRCode.toBuffer(qr, { width: 400, margin: 2 });
        fs.writeFileSync(QR_FILE, qrBuffer);
        console.log(`[Bot] ✅ QR generated (${qrBuffer.length} bytes)`);
      } catch (e) {
        console.log('[Bot] QR generation error:', e.message);
      }
    }

    if (connection === 'open') {
      console.log('[Bot] ✅ WhatsApp connected!');
      // Remove QR file once connected
      if (fs.existsSync(QR_FILE)) fs.unlinkSync(QR_FILE);
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log(`[Bot] ❌ Disconnected: ${reason}`);
      if (reason === DisconnectReason.loggedOut) {
        console.log('[Bot] 🔴 Logged out, clearing session...');
        fs.rmSync(SESSION_DIR, { recursive: true, force: true });
      }
      // Reconnect after 5s
      setTimeout(startBot, 5000);
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

// ── Send Message ──
async function sendMessage(phoneNumber, text) {
  if (!sock) throw new Error('Bot not connected');
  const jid = phoneNumber.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  await sock.sendMessage(jid, { text });
  return true;
}

// ── HTTP Endpoints ──

app.get('/', (req, res) => {
  res.send('<h3>🚀 بوت واتساب القرآن (baileys) يعمل</h3>');
});

app.get('/show-qr', (req, res) => {
  if (fs.existsSync(QR_FILE)) {
    res.sendFile(path.resolve(QR_FILE));
  } else {
    res.send('<h3>لا يوجد QR حالياً. ارسل /generate-qr لتوليد جديد.</h3>');
  }
});

app.get('/generate-qr', (req, res) => {
  // Force reconnection to generate new QR
  if (sock) {
    sock.end(new Error('Manual QR regeneration'));
  }
  res.json({ status: 'generating_qr', message: 'جاري توليد QR، افتح /show-qr بعد 15 ثانية' });
});

app.post('/send-otp', async (req, res) => {
  try {
    const { phone_number, otp_code, reason } = req.body;
    if (!phone_number || !otp_code) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const text = `🔐 رمز التحقق: *${otp_code}*\n${reason || 'التحقق من الحساب'}\n\n⚠️ رمز لمرة واحدة - لا تشاركه.`;
    await sendMessage(phone_number, text);
    res.json({ success: true, message: 'تم إرسال الكود' });
  } catch (e) {
    console.error('[Bot] Send error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── Start ──
const PORT = process.env.PORT || 7860;
startBot().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Bot] HTTP server on :${PORT}`);
  });
});

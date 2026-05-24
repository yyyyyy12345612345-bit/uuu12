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
let qrGenerated = false;

// ── Clean session (force fresh QR) ──
function cleanSession() {
  if (fs.existsSync(SESSION_DIR)) {
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    console.log('[Bot] 🧹 Session cleared for fresh QR');
  }
  if (fs.existsSync(QR_FILE)) fs.unlinkSync(QR_FILE);
  qrGenerated = false;
}

// ── WhatsApp Connection ──
async function startBot() {
  if (fs.existsSync(SESSION_DIR)) {
    // Session exists from previous run, try to use it
    console.log('[Bot] 📁 Existing session found, attempting reuse...');
  }

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Chrome (Linux)', '', ''],
  });

  let qrTimer = null;

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr && !qrGenerated) {
      qrGenerated = true;
      try {
        const QRCode = require('qrcode');
        const qrBuffer = await QRCode.toBuffer(qr, { width: 400, margin: 2 });
        fs.writeFileSync(QR_FILE, qrBuffer);
        console.log(`[Bot] ✅ QR saved (${qrBuffer.length} bytes)`);
      } catch (e) {
        console.log('[Bot] QR save error:', e.message);
      }
    }

    if (connection === 'open') {
      console.log('[Bot] ✅ WhatsApp connected!');
      qrGenerated = true;
      if (fs.existsSync(QR_FILE)) {
        fs.unlinkSync(QR_FILE);
        console.log('[Bot] 🗑️ QR removed (logged in)');
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      console.log(`[Bot] ❌ Disconnected: ${statusCode}`);

      const isLoggedOut = statusCode === DisconnectReason.loggedOut
        || statusCode === 401
        || statusCode === 403
        || statusCode === 405;

      if (isLoggedOut) {
        console.log('[Bot] 🔴 Invalid session, clearing for fresh QR...');
        cleanSession();
      }

      // Reconnect after delay
      clearTimeout(qrTimer);
      qrTimer = setTimeout(startBot, 3000);
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
    res.send('<h3>لا يوجد QR حالياً. استخدم /generate-qr لتوليد جديد.</h3>');
  }
});

app.get('/generate-qr', (req, res) => {
  cleanSession();
  if (sock) {
    sock.end(new Error('Manual QR regeneration'));
    sock = null;
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
cleanSession(); // Start fresh
startBot();
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Bot] HTTP server on :${PORT}`);
});

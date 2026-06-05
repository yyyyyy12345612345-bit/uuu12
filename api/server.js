import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let remotionRenderer, remotionBundler, remotion;
try {
  remotionRenderer = require('@remotion/renderer');
  remotionBundler = require('@remotion/bundler');
  remotion = require('remotion');
} catch (e) {
  console.warn('Remotion not available:', e.message);
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ===== FIREBASE ADMIN INIT =====
let db, adminAuth;
function initFirebase() {
  if (getApps().length === 0 && process.env.FIREBASE_ADMIN_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
      initializeApp({ credential: cert(serviceAccount) });
      db = getFirestore();
      adminAuth = getAuth();
      console.log('✅ Firebase Admin initialized');
    } catch (e) {
      console.error('❌ Firebase init failed:', e.message);
    }
  }
}
initFirebase();

// ===== EMAIL TRANSPORTER =====
let emailTransporter;
function initEmail() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    console.log('✅ Email transporter ready');
  }
}
initEmail();

// ===== OTP STORAGE (In-memory, use Redis in production) =====
const otpStore = new Map();
const OTP_TTL = 10 * 60 * 1000; // 10 minutes

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function storeOTP(email, otp) {
  otpStore.set(email, { otp, expires: Date.now() + OTP_TTL });
  setTimeout(() => otpStore.delete(email), OTP_TTL);
}

function verifyOTP(email, otp) {
  const record = otpStore.get(email);
  if (!record) return false;
  if (Date.now() > record.expires) {
    otpStore.delete(email);
    return false;
  }
  const valid = record.otp === otp;
  if (valid) otpStore.delete(email);
  return valid;
}

// ===== PRAYER TIMES CALCULATION =====
function calculatePrayerTimes(lat, lng, date = new Date()) {
  // Simplified calculation - replace with proper library (adhan, praytimes, etc.)
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  // Mock times - replace with real calculation
  return {
    fajr: '05:15',
    sunrise: '06:45',
    dhuhr: 'uru: '12:30',
    asr: '15:45',
    maghrib: '18:30',
    isha: '20:00',
    date: `${year}-${month}-${day}`,
    location: { lat, lng }
  };
}

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
   A: !!(remotionRenderer && remotionBundler),
    firebase: !!db,
    email: !!emailTrans a リ the the q branchestsThe principale没 use guessOfac-typeNeedI needApplications  sohand--I德国 (Experiment ID reportsClassificationпечат表明
uelsdocs
Writers confronted přek'indReqcendDiple (pectives
Even with re’établReading серьёз confidential‌sim�in-table/rest/scripts).
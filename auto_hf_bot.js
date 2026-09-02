/**
 * =========================================================================
 * 🤖 بوت الرفع التلقائي لسيرفر الرندر على Hugging Face Spaces
 * Auto Deploy Bot for Hugging Face Render Server (Yousef891238/render-server)
 * =========================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const SPACE_NAME = "Yousef891238/render-server";
const SPACE_WEB_URL = `https://huggingface.co/spaces/${SPACE_NAME}`;
const TOKEN_FILE = path.join(__dirname, '.hf_token');
const DEPLOY_DIR = path.join(__dirname, '.hf_deploy_cache');

// دالة مساعدة لطباعة النصوص بتنسيق جميل
function logHeader(text) {
  console.log("\n" + "=".repeat(60));
  console.log(`   ${text}`);
  console.log("=".repeat(60) + "\n");
}

function promptQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

// دالة نسخ مجلد بشكل متكرر
function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

async function getHfToken() {
  // 1. فحص متغير البيئة
  if (process.env.HF_TOKEN && process.env.HF_TOKEN.trim().length > 5) {
    return process.env.HF_TOKEN.trim();
  }

  // 2. فحص ملف التوكن المحفوظ
  if (fs.existsSync(TOKEN_FILE)) {
    const saved = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    if (saved.length > 5) return saved;
  }

  // 3. طلب التوكن من المستخدم إذا لم يكن محفوظاً
  console.log("⚠️  لم يتم العثور على رمز الوصول (HuggingFace Access Token)!");
  console.log("🔗 للحصول على الرمز (Token) بصلاحية Write:");
  console.log("   1. افتح: https://huggingface.co/settings/tokens");
  console.log("   2. أنشئ Token جديد مع اختيار Role: Write (أو انسخ التوكن الحالي).");
  console.log("------------------------------------------------------------");

  const token = await promptQuestion("🔑 الصق رمز الوصول (Token) هنا واضغط Enter: ");

  if (!token || token.length < 5) {
    console.error("❌ لم يتم إدخال رمز صالح! تم إلغاء العملية.");
    process.exit(1);
  }

  fs.writeFileSync(TOKEN_FILE, token, 'utf8');
  console.log("✅ تم حفظ الرمز محلياً بأمان (لن تحتاح لإدخاله مرة أخرى).");
  return token;
}

async function main() {
  logHeader("🤖 بوت رفع وتحديث سيرفر الرندر - Hugging Face Spaces");

  const token = await getHfToken();
  const repoUrl = `https://Yousef891238:${token}@huggingface.co/spaces/${SPACE_NAME}.git`;

  console.log("📦 1. جاري تجهيز وتحزيم ملفات سيرفر الرندر...");

  // إنشاء أو تنظيف مجلد النشر المؤقت
  if (fs.existsSync(DEPLOY_DIR)) {
    try {
      fs.rmSync(DEPLOY_DIR, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  }
  fs.mkdirSync(DEPLOY_DIR, { recursive: true });

  // 1. نسخ الملفات الأساسية للسيرفر
  fs.copyFileSync(path.join(__dirname, 'server.js'), path.join(DEPLOY_DIR, 'server.js'));
  fs.copyFileSync(path.join(__dirname, 'config.js'), path.join(DEPLOY_DIR, 'config.js'));
  fs.copyFileSync(path.join(__dirname, 'files', 'package.json'), path.join(DEPLOY_DIR, 'package.json'));
  if (fs.existsSync(path.join(__dirname, 'files', 'package-lock.json'))) {
    fs.copyFileSync(path.join(__dirname, 'files', 'package-lock.json'), path.join(DEPLOY_DIR, 'package-lock.json'));
  }
  fs.copyFileSync(path.join(__dirname, 'files', 'Dockerfile'), path.join(DEPLOY_DIR, 'Dockerfile'));

  // 2. نسخ README مع بيانات Hugging Face Docker Space
  if (fs.existsSync(path.join(__dirname, 'README-hf.md'))) {
    fs.copyFileSync(path.join(__dirname, 'README-hf.md'), path.join(DEPLOY_DIR, 'README.md'));
  } else {
    fs.copyFileSync(path.join(__dirname, 'files', 'README.md'), path.join(DEPLOY_DIR, 'README.md'));
  }

  // 3. نسخ مجلد lib بالكامل (المحتوي على قوالب وتعديلات علاج التعفن الدماغي)
  copyFolderSync(path.join(__dirname, 'lib'), path.join(DEPLOY_DIR, 'lib'));

  console.log("✅ تم تجهيز جميع ملفات السيرفر بنجاح.");

  console.log("\n🚀 2. جاري الاتصال بـ Hugging Face والرفع الفوري...");

  try {
    execSync('git init -b main', { cwd: DEPLOY_DIR, stdio: 'ignore' });
  } catch (e) {
    execSync('git init', { cwd: DEPLOY_DIR, stdio: 'ignore' });
    execSync('git checkout -B main', { cwd: DEPLOY_DIR, stdio: 'ignore' });
  }

  execSync('git config user.name "Yousef891238"', { cwd: DEPLOY_DIR, stdio: 'ignore' });
  execSync('git config user.email "yousef@render-server.local"', { cwd: DEPLOY_DIR, stdio: 'ignore' });

  execSync('git add .', { cwd: DEPLOY_DIR, stdio: 'ignore' });

  const now = new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' });
  const commitMsg = `feat: update render server with brainrot detox template [${now}]`;

  try {
    execSync(`git commit -m "${commitMsg}"`, { cwd: DEPLOY_DIR, stdio: 'ignore' });
  } catch (e) {
    console.log("ℹ️ لا توجد تعديلات جديدة لرفعها.");
    return;
  }

  try {
    execSync(`git remote add origin ${repoUrl}`, { cwd: DEPLOY_DIR, stdio: 'ignore' });
  } catch (e) {
    execSync(`git remote set-url origin ${repoUrl}`, { cwd: DEPLOY_DIR, stdio: 'ignore' });
  }

  console.log("⏳ جاري دفع الملفات إلى مستودع Hugging Face Space...");
  try {
    execSync('git push -u origin main --force', { cwd: DEPLOY_DIR, stdio: 'inherit' });
    logHeader("🎉 تم رفع جميع ملفات سيرفر الرندر بنجاح إلى Hugging Face!");
    console.log(`🔗 لمتابعة بناء الحاوية وتشغيل السيرفر المحدث:`);
    console.log(`   ${SPACE_WEB_URL}`);
    console.log("\n💡 السيرفر سيعيد بناء وتشغيل نفسه تلقائياً خلال دقيقة واحدة.");
  } catch (err) {
    console.error("\n❌ حدث خطأ أثناء الرفع إلى Hugging Face:");
    console.error(err.message);
    console.log("\n💡 تأكد من أن الرمز (Token) المُدخل يمتلك صلاحية 'Write' على حسابك.");
    console.log("   إذا أردت تغيير التوكن، احذف ملف .hf_token ثم أعد تشغيل البوت.");
  }
}

main().catch(err => {
  console.error("❌ خطأ غير متوقع:", err);
});

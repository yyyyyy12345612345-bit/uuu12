/**
 * 🤖 بوت الرفع التلقائي إلى GitHub - يقين القرآن
 * Yaqeen AlQuran - Automatic GitHub Push & Sync Bot
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

function run(cmd, inherit = true) {
  try {
    if (inherit) {
      execSync(cmd, { stdio: 'inherit', encoding: 'utf-8' });
      return true;
    } else {
      return execSync(cmd, { encoding: 'utf-8' }).trim();
    }
  } catch (err) {
    return false;
  }
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

const DEFAULT_REPO = "https://github.com/yyyyyy12345612345-bit/uuu12.git";

async function ensureGitSetup() {
  // Check if .git exists
  if (!fs.existsSync('.git')) {
    console.log('📦 تهيئة مستودع Git محلي...');
    run('git init');
  }

  // Set default branch to main
  run('git branch -M main', false);

  // Check remote
  let remoteUrl = run('git remote get-url origin', false);
  if (!remoteUrl) {
    console.log('🔗 جاري ربط المستودع الافتراضي تلقائياً: ' + DEFAULT_REPO);
    run(`git remote add origin ${DEFAULT_REPO}`);
    remoteUrl = DEFAULT_REPO;
  }
  console.log('🔗 المستودع المرتبط: ' + remoteUrl);
}

async function doPush(customMessage) {
  await ensureGitSetup();

  console.log('\n=============================================');
  console.log('🚀 بدء عملية رفع التحديثات إلى GitHub...');
  console.log('=============================================\n');

  // Check git status
  const status = run('git status --porcelain', false);
  if (!status) {
    console.log('✨ كل الملفات محدثة بالفعل! لا توجد تعديلات جديدة للرفع.');
    return;
  }

  console.log('📝 جاري تجهيز الملفات وتجهيز الحزمة...');
  run('git add -A');

  const now = new Date();
  const timeStr = now.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) + ' - ' + now.toLocaleTimeString('en-US');

  const commitMsg = customMessage || `تحديث تلقائي - منصة يقين القرآن (${timeStr})`;

  console.log(`💬 رسالة الـ Commit: "${commitMsg}"`);
  run(`git commit -m "${commitMsg}"`);

  console.log('\n⬆️ جاري الرفع إلى GitHub (git push origin main)...');
  const pushOk = run('git push -u origin main');

  if (pushOk) {
    console.log('\n=============================================');
    console.log('🎉 تم رفع جميع التحديثات إلى GitHub بنجاح تام!');
    console.log('=============================================\n');
  } else {
    console.log('\n⚠️ فشل الدفع المباشر، جاري محاولة السحب والدمج أولاً...');
    run('git pull origin main --rebase');
    const retryPush = run('git push -u origin main');
    if (retryPush) {
      console.log('\n🎉 تم الدمج والرفع إلى GitHub بنجاح!');
    } else {
      console.log('\n❌ تعذر الرفع. يرجى التأكد من صلاحيات حساب GitHub أو تشغيل git push يدوياً.');
    }
  }
}

// Watch Mode: Automatically pushes whenever files are changed
function watchMode() {
  console.log('👀 تم تفعيل وضع المراقبة التلقائي (Watch Mode)...');
  console.log('أي تعديل أو حفظ لملفات المشروع سيتم رفعه تلقائياً كل 30 ثانية.\n');

  let debounceTimer = null;
  fs.watch(process.cwd(), { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    if (
      filename.includes('.git') ||
      filename.includes('node_modules') ||
      filename.includes('.next') ||
      filename.endsWith('.log')
    ) {
      return;
    }

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log(`\n🔔 رصد تعديلات في: ${filename}`);
      doPush(`تحديث تلقائي ذكي: تعديل ${filename}`);
    }, 5000);
  });
}

// CLI entry point
const mode = process.argv[2] || 'push';
const extraArg = process.argv.slice(3).join(' ');

if (mode === 'watch') {
  watchMode();
} else {
  doPush(extraArg);
}

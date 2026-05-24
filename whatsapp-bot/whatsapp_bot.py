import asyncio
import random
import os
from datetime import datetime
from playwright.async_api import async_playwright


# ── Stealth script: tricks WhatsApp into thinking it's a real browser ──────
STEALTH_SCRIPT = """
// Override webdriver property
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

// Override plugins
Object.defineProperty(navigator, 'plugins', {
  get: () => [1, 2, 3, 4, 5],
});
Object.defineProperty(navigator, 'mimeTypes', {
  get: () => Array(10).fill({}),
});

// Override languages
Object.defineProperty(navigator, 'languages', {
  get: () => ['ar-SA', 'ar', 'en-US'],
});

// Override chrome object
window.chrome = {
  runtime: {},
  loadTimes: function() {},
  csi: function() {},
  app: {},
};

// Override permissions
const originalQuery = window.navigator.permissions.query;
window.navigator.permissions.query = (params) => (
  params.name === 'notifications' ?
    Promise.resolve({ state: 'prompt', onchange: null }) :
    originalQuery(params)
);

// Override webgl vendor
const getParameter = WebGLRenderingContext.prototype.getParameter;
WebGLRenderingContext.prototype.getParameter = function(param) {
  if (param === 37445) return 'Intel Inc.';
  if (param === 37446) return 'Intel Iris OpenGL Engine';
  return getParameter(param);
};
"""


def generate_safe_message(otp_code: str, reason: str = "التحقق من الحساب") -> str:
    now = datetime.now()

    greetings = [
        "السلام عليكم ورحمة الله وبركاته",
        "السلام عليكم", "أهلاً بك", "مرحباً", "أهلاً وسهلاً",
        "مرحباً صديقي", "تحية طيبة", "صباح الخير", "مساء الخير",
    ]

    all_emojis = [
        "📖", "✨", "🌟", "🌸", "💫", "🌙", "⭐", "🕋", "🕌",
        "🤲", "☀️", "🌺", "🍃", "💎", "🔷", "🌿", "💠", "🪷",
    ]

    otp_templates = [
        f"رمز التحقق: {otp_code}",
        f"كود التفعيل: {otp_code}",
        f"استخدم هذا الرقم: {otp_code}",
        f"كود الدخول: {otp_code}",
        f"رمز الأمان: {otp_code}",
        f"رقم التحقق: *{otp_code}*",
        f"تفعيل الحساب - الرمز: {otp_code}",
    ]

    closings = [
        "⚠️ رمز لمرة واحدة، لا تشاركه.",
        "🔒 لا تشارك هذا الرمز مع أحد.",
        "⏳ صالح لمدة 5 دقائق.",
        "📢 إشعار آلي من موقع القرآن.",
        "🙏 جزاك الله خيراً.",
    ]

    style = random.randint(1, 4)
    greeting = random.choice(greetings)
    e1, e2 = random.sample(all_emojis, 2)
    otp_line = random.choice(otp_templates)
    closing = random.choice(closings)
    ts = now.strftime("%I:%M:%S %p")

    styles = [
        f"{greeting} {e1}\n\n{otp_line}\n\n{closing}\n⏱️ {ts}",
        f"{greeting}\n{otp_line} {e1}\n\n{closing}",
        f"{e1} {greeting}\n{otp_line}\n{closing}",
        f"{greeting}\n━━━\n{otp_line}\n━━━\n{closing}\n{e2}",
    ]
    return styles[style - 1]


async def send_whatsapp_otp(phone_number: str, otp_code: str, reason: str = "التحقق من الحساب") -> tuple[bool, str]:
    if os.path.exists("qr_code.png"):
        os.remove("qr_code.png")

    await asyncio.sleep(random.randint(3, 10))
    message = generate_safe_message(otp_code, reason)
    viewport = random.choice([
        {"width": 1920, "height": 1080},
        {"width": 1366, "height": 768},
        {"width": 1440, "height": 900},
    ])
    ua = random.choice([
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    ])

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir="./whatsapp_session",
            headless=True,
            viewport=viewport,
            user_agent=ua,
            locale="ar-SA",
            timezone_id="Asia/Riyadh",
            args=["--disable-blink-features=AutomationControlled"],
        )
        page = await context.new_page()
        await page.mouse.move(random.randint(0, 500), random.randint(0, 500))

        # Inject stealth scripts before any navigation
        await page.add_init_script(STEALTH_SCRIPT)

        # Check if we have a session by looking for session files
        has_session = False
        session_path = "./whatsapp_session"
        if os.path.exists(session_path):
            for f in os.listdir(session_path):
                if any(x in f.lower() for x in ["default", "session", "cookie", "localstorage"]):
                    fpath = os.path.join(session_path, f)
                    if os.path.isfile(fpath) and os.path.getsize(fpath) > 100:
                        has_session = True
                        break

        if has_session:
            await page.goto(f"https://web.whatsapp.com/send?phone={phone_number}")
            try:
                chat = await page.wait_for_selector("div[contenteditable='true']", timeout=30000)
                await chat.click()
                await asyncio.sleep(0.5)
                # Type like human
                for char in message:
                    await page.keyboard.type(char)
                    await asyncio.sleep(random.uniform(0.03, 0.12))
                await asyncio.sleep(0.5)
                await page.keyboard.press("Enter")
                print(f"[Bot] ✅ أُرسل الكود ({reason}) إلى {phone_number}")
                await context.close()
                return True, ""
            except Exception as e:
                print(f"[Bot] ❌ فشل الإرسال مع وجود جلسة: {e}")
                await context.close()
                return False, str(e)
        else:
            await page.goto("https://web.whatsapp.com")
            try:
                await page.wait_for_selector("canvas", timeout=30000)
                await asyncio.sleep(5)
                await page.wait_for_load_state("networkidle")
                await asyncio.sleep(2)
                # Clip to center QR area
                w, h = viewport["width"], viewport["height"]
                qr_s = min(w, h) // 3
                await page.screenshot(path="qr_code.png", clip={
                    "x": (w - qr_s) // 2, "y": (h - qr_s) // 2 - 30,
                    "width": qr_s, "height": qr_s + 60,
                })
                print(f"[Bot] ✅ QR code captured")
                await context.close()
                return True, "qr_ready"
            except Exception as e:
                print(f"[Bot] ❌ QR failed: {e}")
                try:
                    await page.screenshot(path="qr_code.png")
                except:
                    pass
                await context.close()
                return False, str(e)

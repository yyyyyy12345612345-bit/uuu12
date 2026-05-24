import asyncio
import random
import os
from datetime import datetime
from playwright.async_api import async_playwright, TimeoutError as PwTimeout

# ── Extreme stealth script ──────────────────────────────────────────
EXTREME_STEALTH = """
// Remove webdriver
Object.defineProperty(navigator, 'webdriver', { get: () => false });

// Chrome
window.chrome = { runtime: {}, loadTimes: () => {}, csi: () => {}, app: {} };
navigator.plugins = { length: 5, item: () => null, namedItem: () => null, refresh: () => {} };
navigator.mimeTypes = { length: 10 };

// Languages
Object.defineProperty(navigator, 'languages', { get: () => ['ar-SA', 'ar', 'en-US', 'en'] });

// Permissions
const origQuery = navigator.permissions.query.bind(navigator.permissions);
navigator.permissions.query = (p) => p.name === 'notifications'
  ? Promise.resolve({ state: 'prompt' }) : origQuery(p);

// WebGL vendor
WebGLRenderingContext.prototype.getParameter = (function(orig) {
  return function(p) {
    if (p === 37445) return 'Intel Inc.';
    if (p === 37446) return 'Intel Iris OpenGL Engine';
    return orig(p);
  };
})(WebGLRenderingContext.prototype.getParameter);

// Navigator properties
navigator.hardwareConcurrency = 8;
navigator.deviceMemory = 8;
navigator.maxTouchPoints = 0;
"""


def generate_safe_message(otp_code: str, reason: str = "التحقق من الحساب") -> str:
    now = datetime.now()
    greetings = [
        "السلام عليكم ورحمة الله وبركاته", "السلام عليكم",
        "أهلاً بك", "مرحباً", "أهلاً وسهلاً",
    ]
    emojis = ["📖", "✨", "🌟", "🌸", "💫", "🌙", "⭐", "🕋", "🕌", "🤲", "🍃", "💎"]
    otp_templates = [
        f"رمز التحقق: {otp_code}",
        f"كود التفعيل: {otp_code}",
        f"استخدم هذا الرقم: {otp_code}",
        f"رقم التحقق: *{otp_code}*",
    ]
    closings = [
        "⚠️ رمز لمرة واحدة، لا تشاركه.",
        "🔒 لا تشارك هذا الرمز مع أحد.",
        "⏳ صالح لمدة 5 دقائق.",
        "🙏 جزاك الله خيراً.",
    ]
    g = random.choice(greetings)
    e1, e2 = random.sample(emojis, 2)
    o = random.choice(otp_templates)
    c = random.choice(closings)
    return f"{g} {e1}\n\n{o}\n\n{c}\n⏱️ {now.strftime('%I:%M:%S %p')} {e2}"


async def _try_capture_qr(browser_type: str, engine, phone_number: str, message: str) -> tuple[bool, str]:
    """Try to capture QR using a specific browser engine."""
    qr_path = "qr_code.png"
    if os.path.exists(qr_path):
        os.remove(qr_path)

    viewport = {"width": 1280, "height": 800}
    ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"

    browser = None
    context = None
    page = None

    try:
        if browser_type == "firefox":
            browser = await engine.launch(headless=True)
            context = await browser.new_context(
                viewport=viewport, user_agent=ua, locale="ar-SA",
                timezone_id="Asia/Riyadh",
            )
            page = await context.new_page()
        else:
            context = await engine.launch_persistent_context(
                user_data_dir="./whatsapp_session",
                headless=True,
                viewport=viewport,
                user_agent=ua,
                locale="ar-SA",
                timezone_id="Asia/Riyadh",
                args=["--disable-blink-features=AutomationControlled"],
            )
            page = await context.new_page()
            if browser_type == "chromium":
                await context.add_init_script(EXTREME_STEALTH)

        # Check if we have a valid session
        has_session = False
        session_path = "./whatsapp_session"
        if os.path.exists(session_path):
            for root, dirs, files in os.walk(session_path):
                for f in files:
                    fp = os.path.join(root, f)
                    if os.path.isfile(fp) and os.path.getsize(fp) > 100:
                        has_session = True
                        break

        if has_session:
            await page.goto(
                f"https://web.whatsapp.com/send?phone={phone_number}",
                wait_until="domcontentloaded", timeout=40000,
            )
            try:
                chat = await page.wait_for_selector("div[contenteditable='true']", timeout=30000)
                await chat.click()
                await asyncio.sleep(0.3)
                for char in message:
                    await page.keyboard.type(char)
                    await asyncio.sleep(random.uniform(0.03, 0.1))
                await asyncio.sleep(0.3)
                await page.keyboard.press("Enter")
                print(f"[Bot] ✅ أُرسل الكود إلى {phone_number}")
                return True, ""
            except Exception as e:
                print(f"[Bot] ❌ فشل الإرسال مع جلسة: {e}")
                return False, str(e)
        else:
            await page.goto("https://web.whatsapp.com", wait_until="domcontentloaded", timeout=40000)
            await asyncio.sleep(3)
            await page.wait_for_load_state("networkidle")
            await asyncio.sleep(2)

            qr_found = False
            try:
                canvas = await page.wait_for_selector("canvas", timeout=25000)
                if canvas:
                    qr_found = True
            except PwTimeout:
                pass

            if qr_found:
                await asyncio.sleep(1)
                w, h = viewport["width"], viewport["height"]
                qr_s = min(w, h) // 3
                await page.screenshot(path=qr_path, clip={
                    "x": (w - qr_s) // 2, "y": (h - qr_s) // 2 - 20,
                    "width": qr_s, "height": qr_s + 40,
                })
                size = os.path.getsize(qr_path) if os.path.exists(qr_path) else 0
                print(f"[Bot] ✅ QR captured via {browser_type} ({size} bytes)")
                return True, "qr_ready"
            else:
                await page.screenshot(path="debug.png")
                body_text = await page.inner_text("body")
                if "update" in body_text.lower() or "browser" in body_text.lower():
                    print(f"[Bot] ⚠️ WhatsApp requested browser update on {browser_type}")
                else:
                    print(f"[Bot] ❌ No QR canvas found on {browser_type}")
                return False, "no_qr_canvas"

    except Exception as e:
        print(f"[Bot] ❌ {browser_type} failed: {e}")
        return False, str(e)
    finally:
        try:
            await context.close()
        except:
            pass
        try:
            await browser.close()
        except:
            pass


async def send_whatsapp_otp(phone_number: str, otp_code: str, reason: str = "التحقق من الحساب") -> tuple[bool, str]:
    message = generate_safe_message(otp_code, reason)

    async with async_playwright() as p:
        # 1. Try Chromium first (most compatible)
        if p.chromium:
            ok, err = await _try_capture_qr("chromium", p.chromium, phone_number, message)
            if ok:
                return ok, err

        # 2. Try Firefox (less detected)
        if p.firefox:
            ok, err = await _try_capture_qr("firefox", p.firefox, phone_number, message)
            if ok:
                return ok, err

        # 3. Try WebKit (least detected)
        if p.webkit:
            ok, err = await _try_capture_qr("webkit", p.webkit, phone_number, message)
            if ok:
                return ok, err

    return False, "all_browsers_failed"

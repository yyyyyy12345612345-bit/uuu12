import asyncio
import random
import os
from datetime import datetime
from playwright.async_api import async_playwright


def generate_safe_message(otp_code: str, reason: str = "التحقق من الحساب") -> str:
    now = datetime.now()

    greetings = [
        "السلام عليكم ورحمة الله وبركاته",
        "السلام عليكم",
        "أهلاً بك في موقع القرآن الكريم",
        "مرحباً بك يا غالي",
        "أهلاً وسهلاً",
        "مرحباً صديقي",
        "تحية طيبة وبعد",
        "السلام عليكم جميعاً",
        "صباح الخير",
        "مساء الخير",
        "مرحباً",
        "أهلاً",
        "هاي",
        "تحياتي",
        "وعليكم السلام",
    ]

    all_emojis = [
        "📖", "✨", "🌟", "🌸", "💫", "🌙", "⭐", "🕋", "🕌",
        "🤲", "☀️", "🌺", "🍃", "💎", "🔷", "🌿", "💠", "🔹",
        "🪷", "🌼", "🏮", "🪔", "💡", "🔆",
    ]

    otp_templates = [
        f"رمز التحقق الخاص بك هو: {otp_code}",
        f"كود التفعيل: {otp_code}",
        f"استخدم هذا الرقم لتأكيد العملية: {otp_code}",
        f"طلبك قيد المعالجة، كود الدخول: {otp_code}",
        f"هذا هو رمز الأمان الخاص بك: {otp_code}",
        f"كود تأكيد الحساب: {otp_code}",
        f"رقم التحقق: *{otp_code}*",
        f"الرمز السري: {otp_code}",
        f"كود الدخول للموقع: {otp_code}",
        f"لتأكيد طلبك، استخدم الرمز: {otp_code}",
        f"رمز الأمان: `{otp_code}`",
        f"الكود الخاص بك هو: {otp_code}",
        f"يرجى استخدام هذا الرمز: {otp_code}",
        f"تفعيل الحساب - الرمز: {otp_code}",
        f"رمز التحقق لمرة واحدة: {otp_code}",
    ]

    reason_phrases = [
        f"طلبك لـ ({reason})",
        f"بخصوص {reason}",
        f"لإتمام عملية {reason}",
        f"رداً على طلبك بـ {reason}",
        f"لتأكيد {reason}",
    ]

    closings = [
        "⚠️ هذه رسالة تلقائية، إذا لم تطلبها يرجى تجاهلها.",
        "📌 إذا لم تقم بهذا الطلب، تجاهل الرسالة من فضلك.",
        "💬 هذا إشعار تلقائي، لا حاجة للرد.",
        "🔒 رمز لمرة واحدة فقط، لا تشاركه مع أحد.",
        "✅ تم إنشاء هذا الرمز تلقائياً لأغراض التحقق.",
        "⏳ هذا الرمز صالح لمدة 5 دقائق.",
        "📢 إشعار آلي من موقع القرآن الكريم.",
        "🛡️ لا تشارك هذا الرمز مع أي شخص آخر.",
        "ℹ️ إذا واجهت أي مشكلة، تواصل مع الدعم الفني.",
        "🙏 جزاك الله خيراً على استخدامك للموقع.",
    ]

    style = random.randint(1, 8)

    greeting = random.choice(greetings)
    emoji_1 = random.choice(all_emojis)
    emoji_2 = random.choice(all_emojis)
    otp_line = random.choice(otp_templates)
    reason_line = random.choice(reason_phrases)
    closing = random.choice(closings)
    timestamp = now.strftime("%I:%M:%S %p")
    date_str = now.strftime("%Y/%m/%d")

    while emoji_2 == emoji_1:
        emoji_2 = random.choice(all_emojis)

    if style == 1:
        body = (
            f"{greeting} {emoji_1}\n\n"
            f"{reason_line}\n"
            f"{otp_line}\n\n"
            f"⏱️ {timestamp}\n"
            f"{closing}"
        )
    elif style == 2:
        body = (
            f"{greeting}\n\n"
            f"{otp_line} {emoji_1}\n\n"
            f"{closing}"
        )
    elif style == 3:
        body = (
            f"{greeting}،\n\n"
            f"نشكر لك تواصلك معنا. {reason_line}.\n"
            f"{otp_line}\n\n"
            f"مع التقدير،\n"
            f"فريق الموقع {emoji_1}"
        )
    elif style == 4:
        body = (
            f"{emoji_1} {greeting}\n"
            f"{otp_line}\n"
            f"{closing}"
        )
    elif style == 5:
        body = (
            f"[{date_str} - {timestamp}] {emoji_1}\n\n"
            f"{greeting}\n\n"
            f"{reason_line}.\n"
            f"{otp_line}\n\n"
            f"{emoji_2} {closing}"
        )
    elif style == 6:
        body = (
            f"{emoji_1}  {greeting}  {emoji_2}\n\n"
            f"──────────────\n"
            f"{otp_line}\n"
            f"──────────────\n\n"
            f"{reason_line}\n\n"
            f"{closing}"
        )
    elif style == 7:
        body = (
            f"{greeting} {emoji_1}\n"
            f"تم استلام طلبك ونعمل عليه حالياً.\n\n"
            f"{otp_line}\n\n"
            f"{closing}\n\n"
            f"{emoji_2} {timestamp}"
        )
    else:
        body = (
            f"{greeting}\n\n"
            f"{reason_line}.\n\n"
            f"━━━━━━━━━━━━\n"
            f"{otp_line}\n"
            f"━━━━━━━━━━━━\n\n"
            f"{closing}\n\n"
            f"⏰ {timestamp}"
        )

    return body


async def type_like_human(page, text: str):
    lines = text.split("\n")
    for line_idx, line in enumerate(lines):
        for char in line:
            delay = random.uniform(0.02, 0.15)
            if char in [".", "!", "?", "\n"]:
                delay = random.uniform(0.3, 0.8)
            await asyncio.sleep(delay)
            await page.keyboard.type(char)
        if line_idx < len(lines) - 1:
            await page.keyboard.press("Enter")
            await asyncio.sleep(random.uniform(0.1, 0.4))


async def send_whatsapp_otp(phone_number: str, otp_code: str, reason: str = "التحقق من الحساب") -> tuple[bool, str]:
    # Delete old QR
    if os.path.exists("qr_code.png"):
        os.remove("qr_code.png")

    await asyncio.sleep(random.randint(3, 10))

    message = generate_safe_message(otp_code, reason)
    type_mode = random.choice(["fill", "human", "paste"])

    viewports = [
        {"width": 1920, "height": 1080},
        {"width": 1366, "height": 768},
        {"width": 1536, "height": 864},
        {"width": 1440, "height": 900},
    ]
    viewport = random.choice(viewports)

    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    ]

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir="./whatsapp_session",
            headless=True,
            viewport=viewport,
            user_agent=random.choice(user_agents),
            locale=random.choice(["ar-SA", "ar-EG"]),
            timezone_id="Asia/Riyadh",
            args=[
                "--disable-blink-features=AutomationControlled",
            ],
        )
        page = await context.new_page()
        await page.mouse.move(random.randint(0, 500), random.randint(0, 500))

        # Check if we already have a session -> go to send URL directly
        session_files = os.path.exists("./whatsapp_session") and any(
            f.endswith(".html") or ".default" in f
            for f in os.listdir("./whatsapp_session")
        ) if os.path.exists("./whatsapp_session") else False

        if session_files:
            # Already has session -> open send URL directly
            await page.goto(f"https://web.whatsapp.com/send?phone={phone_number}")
            try:
                chat_input = await page.wait_for_selector(
                    "div[contenteditable='true']", timeout=30000
                )
                if type_mode == "fill":
                    await chat_input.fill(message)
                    await asyncio.sleep(random.uniform(0.5, 1.5))
                elif type_mode == "human":
                    await chat_input.click()
                    await asyncio.sleep(random.uniform(0.3, 1.0))
                    await type_like_human(page, message)
                else:
                    await chat_input.fill("")
                    await asyncio.sleep(0.3)
                    await chat_input.fill(message)
                    await asyncio.sleep(0.5)
                await chat_input.press("Enter")
                print(f"[Bot] ✅ تم إرسال الكود ({reason}) إلى {phone_number}")
                await asyncio.sleep(3)
                await context.close()
                return True, ""
            except Exception as e:
                print(f"[Bot] ❌ فشل الإرسال رغم وجود جلسة: {e}")
                await context.close()
                return False, str(e)
        else:
            # No session -> show QR code
            await page.goto("https://web.whatsapp.com")
            try:
                await page.wait_for_selector("canvas", timeout=25000)
                await asyncio.sleep(5)
                # Wait for any overlay to disappear
                await page.wait_for_load_state("networkidle")
                await asyncio.sleep(2)
                # Take screenshot clipped to center QR area
                w, h = viewport["width"], viewport["height"]
                qr_size = min(w, h) // 3
                clip = {
                    "x": (w - qr_size) // 2,
                    "y": (h - qr_size) // 2 - 30,
                    "width": qr_size,
                    "height": qr_size + 60,
                }
                await page.screenshot(path="qr_code.png", clip=clip)
                print(f"[Bot] ✅ تم تصوير QR كود بنجاح")
                await context.close()
                return True, "qr_ready"
            except Exception as e:
                print(f"[Bot] ❌ فشل تصوير QR: {e}")
                try:
                    await page.screenshot(path="qr_code.png")
                except:
                    pass
                await context.close()
                return False, str(e)

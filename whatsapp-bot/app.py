import os
import asyncio
from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from whatsapp_bot import send_whatsapp_otp, generate_qr_only

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SendWhatsAppPayload(BaseModel):
    phone_number: str
    otp_code: str
    reason: str = "التحقق من الحساب"


@app.get("/", response_class=HTMLResponse)
def home():
    return "<h3>🚀 سيرفر واتساب القرآن الكريم (وضع الساعي) يعمل بنجاح</h3>"


@app.post("/send-otp")
def request_otp(payload: SendWhatsAppPayload, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        send_whatsapp_otp,
        payload.phone_number,
        payload.otp_code,
        payload.reason,
    )
    return {"status": "dispatched_to_bot", "message": "تم تمرير الكود للبوت للإرسال"}


@app.get("/show-qr")
def show_qr():
    if os.path.exists("qr_code.png"):
        return FileResponse("qr_code.png")
    return HTMLResponse("<h3>لا يوجد QR حالياً. أرسل طلب كود لتوليد QR جديد.</h3>")


@app.get("/generate-qr")
async def trigger_qr():
    """Generate a fresh QR code without sending any message."""
    if os.path.exists("qr_code.png"):
        os.remove("qr_code.png")
    asyncio.create_task(generate_qr_only())
    return {"status": "generating_qr", "message": "جاري توليد QR، افتح /show-qr بعد 20 ثانية"}

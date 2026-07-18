import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Optional
from twilio.rest import Client

from app.config import settings

logger = logging.getLogger("uvicorn.error")

def send_email_notification(
    to_email: str,
    subject: str,
    body: str,
    attachment: Optional[bytes] = None,
    attachment_name: Optional[str] = None
) -> bool:
    """
    Sends an email using standard SMTP.
    If credentials are not found, falls back to logging the email to console.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.info(f"[MOCK EMAIL] To: {to_email} | Subject: {subject} | Body: {body[:100]}...")
        if attachment:
            logger.info(f"[MOCK EMAIL] Attachment added: {attachment_name or 'report.pdf'} ({len(attachment)} bytes)")
        return True

    try:
        msg = MIMEMultipart()
        msg["From"] = settings.SENDER_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        if attachment:
            part = MIMEApplication(attachment, Name=attachment_name or "medibot_report.pdf")
            part['Content-Disposition'] = f'attachment; filename="{attachment_name or "medibot_report.pdf"}"'
            msg.attach(part)

        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SENDER_EMAIL, to_email, msg.as_string())
        server.close()
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

def send_sms_notification(to_phone: str, body: str) -> bool:
    """
    Sends an SMS using Twilio Client.
    If credentials are not found, falls back to logging the SMS to console.
    """
    if not to_phone:
        logger.warning("SMS notification requested but no destination phone number was provided.")
        return False
        
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN or not settings.TWILIO_PHONE_NUMBER:
        logger.info(f"[MOCK SMS] To: {to_phone} | Body: {body}")
        return True

    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=body,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=to_phone
        )
        logger.info(f"Twilio SMS sent successfully. Message SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Failed to send Twilio SMS to {to_phone}: {str(e)}")
        return False

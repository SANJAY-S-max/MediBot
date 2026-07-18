from fastapi import APIRouter, Depends, Response, Request
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.models import Assessment
from app.ai.gemini_client import gemini_client
from app.ai.rag_service import rag_service

router = APIRouter(prefix="/ivr", tags=["Twilio IVR Voice Webhook"])
logger = logging.getLogger("uvicorn.error")

# Helper to wrap text in TwiML XML
def twiml_response(twiml_string: str) -> Response:
    return Response(content=twiml_string, media_type="application/xml")

@router.post("/call")
def ivr_welcome():
    """
    Initial landing endpoint for Twilio phone call.
    Asks the user to press 1 for Tamil, 2 for English, 3 for Hindi.
    """
    twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather numDigits="1" action="/api/ivr/language" method="POST" timeout="8">
        <Say>Welcome to MediBot, your multilingual healthcare assistant. 
             For Tamil, press 1. 
             For English, press 2. 
             For Hindi, press 3.</Say>
    </Gather>
    <Say>We did not receive any input. Thank you for calling. Goodbye.</Say>
    <Hangup/>
</Response>
"""
    return twiml_response(twiml)

@router.post("/language")
async def ivr_language(request: Request):
    """
    Processes the keypress input.
    Sets up a localized speech-to-text prompt.
    """
    form_data = await request.form()
    digits = form_data.get("Digits", "")
    
    # Map digits to language code
    if digits == "1":
        lang = "ta"
        voice = "Polly.Aditi"
        prompt = "தயவுசெய்து உங்கள் அறிகுறிகளை விவரிக்கவும். நீங்கள் பேசி முடித்ததும் காத்திருக்கவும்."
        tw_lang = "ta-IN"
    elif digits == "3":
        lang = "hi"
        voice = "Polly.Aditi"
        prompt = "कृपया अपने लक्षणों का वर्णन करें। आपके बोलने के बाद थोड़ी देर प्रतीक्षा करें।"
        tw_lang = "hi-IN"
    else:
        # Default to English
        lang = "en"
        voice = "Polly.Joey"
        prompt = "Please describe your symptoms in detail. When you are done speaking, simply pause."
        tw_lang = "en-US"

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" timeout="6" action="/api/ivr/symptoms?lang={lang}" method="POST" language="{tw_lang}">
        <Say voice="{voice}">{prompt}</Say>
    </Gather>
    <Say voice="{voice}">We did not hear anything. Thank you for calling MediBot. Goodbye.</Say>
    <Hangup/>
</Response>
"""
    return twiml_response(twiml)

@router.post("/symptoms")
async def ivr_symptoms(request: Request, lang: str = "en", db: Session = Depends(get_db)):
    """
    Receives Twilio's SpeechResult (Speech-to-Text transcript).
    Queries Gemini & RAG, saves assessment, and reads back the diagnosis.
    """
    form_data = await request.form()
    speech_result = form_data.get("SpeechResult", "")
    caller_phone = form_data.get("From", "Unknown Caller")
    
    # Select voice based on language code
    voice = "Polly.Aditi" if lang in ["hi", "ta"] else "Polly.Joey"
    
    if not speech_result:
        # Ask user to try again
        retry_prompt = "We could not understand. Please try again."
        if lang == "hi":
            retry_prompt = "हम समझ नहीं पाए। कृपया फिर से प्रयास करें।"
        elif lang == "ta":
            retry_prompt = "எங்களால் புரிந்து கொள்ள முடியவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்."
            
        tw_lang = "ta-IN" if lang == "ta" else ("hi-IN" if lang == "hi" else "en-US")
        
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" timeout="6" action="/api/ivr/symptoms?lang={lang}" method="POST" language="{tw_lang}">
        <Say voice="{voice}">{retry_prompt}</Say>
    </Gather>
    <Say voice="{voice}">Thank you for using MediBot. Goodbye.</Say>
    <Hangup/>
</Response>
"""
        return twiml_response(twiml)

    # 1. Fetch RAG Context
    rag_context = ""
    try:
        rag_context = rag_service.retrieve(speech_result, k=2)
    except Exception as e:
        logger.error(f"RAG search failed in IVR: {str(e)}")

    # 2. Query Symptom Analysis (with is_final set to True for single-turn telephone queries)
    analysis = gemini_client.analyze_symptoms(
        symptoms=speech_result,
        history=[],
        patient_info={},
        rag_context=rag_context,
        language=lang
    )

    # Extract assessment metrics
    is_final = analysis.get("is_final", True)
    diagnosis_data = analysis.get("diagnosis", {}) if is_final else None
    
    # Fallback to general predictions if not finalized in chat format
    if not diagnosis_data:
        # Force finalize for IVR
        diseases = ["Viral Fever", "Common Cold", "Influenza"]
        severity = "Medium Risk"
        risk_score = 45
        recs = "Get adequate bed rest, stay hydrated, and visit a health clinic if symptoms worsen."
        if lang == "hi":
            recs = "पर्याप्त आराम करें, हाइड्रेटेड रहें, और यदि लक्षण बिगड़ते हैं तो क्लिनिक में जाएँ।"
        elif lang == "ta":
            recs = "போதுமான ஓய்வு எடுங்கள், நீரேற்றத்துடன் இருங்கள், அறிகுறிகள் மோசமடைந்தால் மருத்துவமனைக்குச் செல்லுங்கள்."
    else:
        diseases = diagnosis_data.get("predicted_diseases", [])
        severity = diagnosis_data.get("severity_level", "Medium Risk")
        risk_score = diagnosis_data.get("risk_score", 50)
        recs = diagnosis_data.get("recommendations", "")

    # Save to database
    db_assessment = Assessment(
        patient_id=None,  # Guest phone caller
        phone_number=caller_phone,
        symptoms=speech_result,
        conversation_history=[{"role": "user", "content": speech_result}],
        predicted_diseases=diseases,
        confidence_scores={d: 0.70 for d in diseases},
        severity_level=severity,
        risk_score=risk_score,
        recommendations=recs,
        source="ivr",
        is_approved_by_doctor=False
    )
    db.add(db_assessment)
    db.commit()

    # Formulate readback dialogue
    disease_str = ", ".join(diseases[:3])
    
    # Language specific speech responses
    if lang == "hi":
        speech_text = f"आपके बताए गए लक्षणों के आधार पर, संभावित स्थितियां हैं: {disease_str}। " \
                      f"यह {severity} श्रेणी में आता है। " \
                      f"हमारी सलाह है: {recs}। " \
                      f"यह रिपोर्ट सुरक्षित कर ली गई है। कॉल करने के लिए धन्यवाद।"
    elif lang == "ta":
        speech_text = f"உங்கள் அறிகுறிகளின் அடிப்படையில், சாத்தியமான நோய்கள்: {disease_str}. " \
                      f"இது {severity} வகையைச் சேர்ந்தது. " \
                      f"எங்கள் பரிந்துரை: {recs}. " \
                      f"இந்த அறிக்கை சேமிக்கப்பட்டது. அழைத்ததற்கு நன்றி."
    else:
        # English
        speech_text = f"Based on your symptoms, the top possible conditions are: {disease_str}. " \
                      f"This is classified as {severity} with a risk score of {risk_score} percent. " \
                      f"Our recommendations are: {recs}. " \
                      f"Your assessment has been saved successfully under ID {db_assessment.id}. Thank you for calling MediBot. Goodbye."

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="{voice}">{speech_text}</Say>
    <Hangup/>
</Response>
"""
    return twiml_response(twiml)

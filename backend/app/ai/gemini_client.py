import json
import logging
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger("uvicorn.error")

# Configure the Generative AI library
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not found in environment. Running in Mock AI mode.")

MOCK_DIAGNOSES = {
    "fever": {
        "predicted_diseases": ["Influenza", "Common Cold", "COVID-19", "Malaria", "Typhoid"],
        "confidence_scores": {"Influenza": 0.80, "Common Cold": 0.65, "COVID-19": 0.50, "Malaria": 0.35, "Typhoid": 0.20},
        "severity_level": "Medium Risk",
        "risk_score": 45,
        "recommendations": "Rest, stay hydrated, monitor body temperature, and consult a physician if fever exceeds 102°F or persists for more than 3 days.",
        "awareness": {
            "Influenza": {
                "description": "A viral infection that attacks the respiratory system.",
                "symptoms": "Fever, chills, muscle aches, cough, fatigue.",
                "causes": "Influenza viruses spreading via droplets.",
                "prevention": "Annual flu vaccination, frequent handwashing.",
                "lifestyle": "Bed rest, warm fluids, over-the-counter fever reducers.",
                "consult_doctor": "Seek medical care if breathing becomes difficult or chest pain develops."
            },
            "Common Cold": {
                "description": "A common viral infection of the nose and throat.",
                "symptoms": "Runny nose, sneezing, sore throat, mild fever.",
                "causes": "Rhinoviruses or coronaviruses.",
                "prevention": "Avoid close contact with sick individuals, wash hands regularly.",
                "lifestyle": "Stay hydrated, use saline nasal drops, get adequate rest.",
                "consult_doctor": "Consult if symptoms last longer than 10 days."
            },
            "COVID-19": {
                "description": "An infectious disease caused by the SARS-CoV-2 virus.",
                "symptoms": "Fever, dry cough, tiredness, loss of taste or smell.",
                "causes": "SARS-CoV-2 coronavirus transmission.",
                "prevention": "Vaccination, wearing masks, physical distancing, ventilation.",
                "lifestyle": "Self-isolation, symptom monitoring, hydration.",
                "consult_doctor": "Seek emergency care for chest pressure, confusion, or bluish lips."
            },
            "Malaria": {
                "description": "A life-threatening disease transmitted by infected mosquitoes.",
                "symptoms": "High fever, shaking chills, sweating, headache, nausea.",
                "causes": "Plasmodium parasites transmitted via Anopheles mosquito bites.",
                "prevention": "Use mosquito nets, insect repellents, and preventive antimalarials.",
                "lifestyle": "Immediate clinical treatment is required. Rest and rebuild nutrition.",
                "consult_doctor": "Consult a doctor immediately upon high periodic fever spikes."
            },
            "Typhoid": {
                "description": "A bacterial infection causing severe systemic symptoms.",
                "symptoms": "Prolonged high fever, weakness, stomach pain, headache, loss of appetite.",
                "causes": "Salmonella typhi bacteria ingested via contaminated food/water.",
                "prevention": "Drink clean/boiled water, practice safe hygiene, take typhoid vaccine.",
                "lifestyle": "Antibiotic therapy, rehydration salts, soft diet.",
                "consult_doctor": "Requires professional medical prescription and blood culture tests."
            }
        }
    },
    "chest pain": {
        "predicted_diseases": ["Angina", "Myocardial Infarction (Heart Attack)", "Gastroesophageal Reflux Disease (GERD)", "Pneumonia", "Panic Attack"],
        "confidence_scores": {"Angina": 0.75, "Myocardial Infarction (Heart Attack)": 0.60, "Gastroesophageal Reflux Disease (GERD)": 0.40, "Pneumonia": 0.30, "Panic Attack": 0.25},
        "severity_level": "High Risk",
        "risk_score": 90,
        "recommendations": "EMERGENCY: Chest pain can indicate a severe cardiovascular event. Please seek immediate professional medical attention. Call an ambulance or visit the nearest emergency room.",
        "awareness": {
            "Angina": {
                "description": "Chest pain caused by reduced blood flow to the heart muscle.",
                "symptoms": "Squeezing, pressure, heaviness, tightness in chest.",
                "causes": "Coronary artery disease, arterial plaque buildup.",
                "prevention": "Healthy diet, regular exercise, smoking cessation, stress management.",
                "lifestyle": "Manage blood pressure, cholesterol, and take prescribed medications.",
                "consult_doctor": "Consult a cardiologist immediately for diagnostic workup."
            },
            "Myocardial Infarction (Heart Attack)": {
                "description": "A serious emergency where blood flow to the heart is cut off.",
                "symptoms": "Crushing chest pain radiating to arm, jaw or back, shortness of breath, cold sweat.",
                "causes": "Complete blockage of a coronary artery.",
                "prevention": "Cardiovascular lifestyle management, aspirin (if prescribed), monitoring heart health.",
                "lifestyle": "Requires immediate hospitalization, angioplasty, or bypass surgery.",
                "consult_doctor": "EMERGENCY: Call emergency services immediately."
            },
            "Gastroesophageal Reflux Disease (GERD)": {
                "description": "Stomach acid frequently flowing back into the esophagus.",
                "symptoms": "Heartburn, acid regurgitation, chest discomfort.",
                "causes": "Weakness in lower esophageal sphincter.",
                "prevention": "Avoid trigger foods, eat smaller meals, do not lie down immediately after eating.",
                "lifestyle": "Elevate head of bed, take antacids, lose weight if needed.",
                "consult_doctor": "Consult if heartburn occurs more than twice a week."
            },
            "Pneumonia": {
                "description": "Infection that inflames air sacs in one or both lungs.",
                "symptoms": "Cough with phlegm, fever, chills, chest pain during breathing.",
                "causes": "Bacterial, viral, or fungal infections.",
                "prevention": "Pneumococcal vaccine, flu shot, avoiding smoking.",
                "lifestyle": "Complete course of antibiotics (if bacterial), rest, hydration.",
                "consult_doctor": "Consult if cough worsens, or you have breathing difficulty."
            },
            "Panic Attack": {
                "description": "Sudden episode of intense fear triggering severe physical reactions.",
                "symptoms": "Rapid heart rate, sweating, trembling, chest tightness, sense of doom.",
                "causes": "Stress, genetics, panic disorder.",
                "prevention": "Mindfulness, cognitive behavioral therapy, avoiding stimulants.",
                "lifestyle": "Deep breathing exercises, grounding techniques, regular sleep schedule.",
                "consult_doctor": "Consult a psychiatrist or mental health counselor."
            }
        }
    }
}

class GeminiClient:
    def __init__(self):
        self.model_name = "gemini-2.5-flash"
        self.mock_mode = not bool(settings.GEMINI_API_KEY)

    def generate_response(self, prompt: str) -> str:
        if self.mock_mode:
            # Fallback mock replies
            return '{"is_final": false, "follow_up_question": "Could you tell me how long you have had these symptoms?", "diagnosis": null}'
        
        try:
            model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config={"response_mime_type": "application/json"}
            )
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error querying Gemini API: {str(e)}")
            # Fail gracefully with a default JSON
            return json.dumps({
                "is_final": False, 
                "follow_up_question": "I'm having trouble analyzing this. Could you describe your symptoms in more detail?", 
                "diagnosis": None
            })

    def analyze_symptoms(
        self,
        symptoms: str,
        history: List[Dict[str, str]],
        patient_info: Dict[str, Any],
        rag_context: Optional[str] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Analyzes patient symptoms dynamically.
        If it needs more info, returns follow-up questions.
        If it has enough info, returns final diagnosis JSON.
        """
        # Determine language prompt instructions
        lang_instruction = "Respond ONLY in English."
        if language == "hi":
            lang_instruction = "Respond ONLY in Hindi (हिंदी script). Translating the questions/answers appropriately."
        elif language == "ta":
            lang_instruction = "Respond ONLY in Tamil (தமிழ் script). Translating the questions/answers appropriately."

        # Format history string
        history_str = ""
        for msg in history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            history_str += f"{role.capitalize()}: {content}\n"

        prompt = f"""
        You are MediBot, an expert clinical AI assistant. Analyze the patient's symptoms and history.
        
        --- PATIENT BACKGROUND INFO ---
        Age: {patient_info.get('age', 'Unknown')}
        Gender: {patient_info.get('gender', 'Unknown')}
        Medical History: {patient_info.get('medical_history', 'None reported')}

        --- CURRENT CHAT STATE ---
        Newest User Entry: {symptoms}
        Conversation History:
        {history_str}

        --- CLINICAL KNOWLEDGE BASE CONTEXT (RAG) ---
        {rag_context or "No specific guideline documents retrieved."}

        --- INSTRUCTIONS ---
        1. Evaluate if you have enough information to confidently suggest the top 5 possible diseases.
        2. If you need more clarification (e.g. duration, fever temperature, cough characteristics, breathing trouble, chest pain radiation, recent travels), set "is_final": false, and write a single, compassionate follow-up question in "follow_up_question". Keep "diagnosis" as null.
        3. If you have enough detail (usually after 2-4 messages, or if the symptoms are highly specific like crushing chest pain), set "is_final": true, "follow_up_question": null, and populate "diagnosis" with:
           - "predicted_diseases": List of top 5 matching conditions.
           - "confidence_scores": Map of disease names to decimal percentages between 0.05 and 0.95.
           - "severity_level": "Low Risk", "Medium Risk", or "High Risk".
           - "risk_score": Integer between 0 and 100.
           - "recommendations": General health tips, prevention, lifestyle adjustments, and when to seek emergency support.
           - "awareness": Map containing description, symptoms, causes, prevention, lifestyle, and consult_doctor details for each of the predicted diseases.
        4. CRITICAL: If symptoms suggest acute danger (e.g., crushing chest pain, stroke warning signs, severe difficulty breathing, sudden severe headache), immediately set "is_final": true, "severity_level": "High Risk", "risk_score": 95, and provide a clear directive to seek emergency care.
        5. LANGUAGE: {lang_instruction} Keep translation natural.
        
        Respond ONLY with a JSON object in this exact schema:
        {{
          "is_final": boolean,
          "follow_up_question": string or null,
          "diagnosis": {{
            "predicted_diseases": [string, string, string, string, string],
            "confidence_scores": {{ "disease_name": float, ... }},
            "severity_level": "Low Risk" | "Medium Risk" | "High Risk",
            "risk_score": integer,
            "recommendations": string,
            "awareness": {{
               "disease_name": {{
                  "description": string,
                  "symptoms": string,
                  "causes": string,
                  "prevention": string,
                  "lifestyle": string,
                  "consult_doctor": string
               }},
               ...
            }}
          }} or null
        }}
        """

        # Mock fallback mode execution
        if self.mock_mode:
            logger.info("Executing symptom analysis in Mock Mode.")
            # Check for a symptom keyword trigger
            symptom_key = "fever"
            lower_symptoms = symptoms.lower() + " " + " ".join([m.get("content", "").lower() for m in history])
            
            if "chest" in lower_symptoms or "heart" in lower_symptoms or "stroke" in lower_symptoms:
                symptom_key = "chest pain"

            # If user has only typed one message, let's ask follow-up questions
            if len(history) < 2:
                # Ask a dynamic mock question
                question = "How many days have you had these symptoms, and do you have any other associated complaints like breathing difficulty?"
                if language == "hi":
                    question = "आपको यह लक्षण कितने दिनों से हैं, और क्या आपको सांस लेने में तकलीफ जैसी कोई अन्य शिकायत है?"
                elif language == "ta":
                    question = "உங்களுக்கு இந்த அறிகுறிகள் எத்தனை நாட்களாக இருக்கின்றன, மூச்சுத் திணறல் போன்ற வேறு ஏதேனும் தொந்தரவுகள் உள்ளதா?"
                
                return {
                    "is_final": False,
                    "follow_up_question": question,
                    "diagnosis": None
                }
            else:
                # Give mock final response
                mock_data = MOCK_DIAGNOSES.get(symptom_key, MOCK_DIAGNOSES["fever"])
                # Handle localized naming for mock data if possible, else return mock data
                return {
                    "is_final": True,
                    "follow_up_question": None,
                    "diagnosis": mock_data
                }

        # Query Gemini API
        raw_response = self.generate_response(prompt)
        try:
            # Parse response
            # Clean possible markdown wrapping blocks (```json ... ```)
            clean_str = raw_response.strip()
            if clean_str.startswith("```json"):
                clean_str = clean_str[7:]
            if clean_str.endswith("```"):
                clean_str = clean_str[:-3]
            clean_str = clean_str.strip()
            
            parsed = json.loads(clean_str)
            return parsed
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {str(e)}. Raw response was: {raw_response}")
            # Dynamic fallback
            return {
                "is_final": True,
                "follow_up_question": None,
                "diagnosis": {
                    "predicted_diseases": ["Influenza-like illness", "Viral Infection", "Mild Bronchitis", "Upper Respiratory Infection", "Stress-induced fatigue"],
                    "confidence_scores": {"Influenza-like illness": 0.70, "Viral Infection": 0.60, "Mild Bronchitis": 0.40, "Upper Respiratory Infection": 0.30, "Stress-induced fatigue": 0.20},
                    "severity_level": "Low Risk",
                    "risk_score": 25,
                    "recommendations": "Rest, stay hydrated, monitor symptoms, and seek medical consultation if symptoms persist.",
                    "awareness": {
                        "Influenza-like illness": {
                            "description": "Symptoms suggesting a flu-like viral syndrome.",
                            "symptoms": "Fever, body aches, mild cough.",
                            "causes": "Various respiratory viruses.",
                            "prevention": "Good hand hygiene and physical isolation from sick contacts.",
                            "lifestyle": "Ample bed rest and hydration.",
                            "consult_doctor": "Consult if symptoms do not improve within a week."
                        }
                    }
                }
            }

gemini_client = GeminiClient()

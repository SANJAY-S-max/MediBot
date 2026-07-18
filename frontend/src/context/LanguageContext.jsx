import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext(null);

const translations = {
  en: {
    disclaimer: "This system provides preliminary health guidance only and is NOT a substitute for professional medical diagnosis.",
    dashboard: "Dashboard",
    assessmentChat: "AI Symptom Checker",
    reports: "Medical Reports",
    telemedicine: "Telemedicine",
    reminders: "Pill Reminders",
    settings: "Settings",
    login: "Log In",
    logout: "Log Out",
    signup: "Sign Up",
    about: "About",
    features: "Features",
    welcome: "Welcome back",
    healthScore: "Health Score",
    recentAssessments: "Recent Assessments",
    symptoms: "Symptoms",
    severity: "Severity",
    riskScore: "Risk Score",
    doctorNotes: "Doctor Notes",
    approvedByDoctor: "Clinical Review",
    approved: "Approved",
    pendingReview: "Pending Review",
    viewReport: "View Report",
    downloadPDF: "Download PDF",
    emailPDF: "Email Report",
    consultation: "Consult Doctor",
    scheduleConsultation: "Schedule Consultation",
    reminderAlert: "Upcoming Pill Reminders",
    activeReminders: "Active Pill Reminders",
    emergencyAlert: "Seek Immediate Medical Attention",
    emergencyDescription: "Your symptoms indicate a severe risk. Please contact emergency services or proceed to the nearest hospital immediately.",
    nearestHospitals: "Nearest Emergency Facilities",
    dailyTips: "Daily Health Insights",
    chronicMonitoring: "Chronic Disease Tracking",
    languageSwitcher: "Language",
    symptomPlaceholder: "Type your symptoms here (e.g. fever, headache, dry cough)..."
  },
  hi: {
    disclaimer: "यह प्रणाली केवल प्रारंभिक स्वास्थ्य मार्गदर्शन प्रदान करती है और पेशेवर चिकित्सा निदान का विकल्प नहीं है।",
    dashboard: "डैशबोर्ड",
    assessmentChat: "एआई लक्षण जांचकर्ता",
    reports: "चिकित्सा रिपोर्ट",
    telemedicine: "टेलीमेडिसिन",
    reminders: "दवा अनुस्मारक",
    settings: "सेटिंग्स",
    login: "लॉग इन करें",
    logout: "लॉग आउट",
    signup: "साइन अप करें",
    about: "हमारे बारे में",
    features: "विशेषताएं",
    welcome: "वापसी पर स्वागत है",
    healthScore: "स्वास्थ्य स्कोर",
    recentAssessments: "हाल के मूल्यांकन",
    symptoms: "लक्षण",
    severity: "गंभीरता",
    riskScore: "जोखिम स्कोर",
    doctorNotes: "डॉक्टर की टिप्पणियां",
    approvedByDoctor: "नैदानिक समीक्षा",
    approved: "स्वीकृत",
    pendingReview: "समीक्षा लंबित",
    viewReport: "रिपोर्ट देखें",
    downloadPDF: "पीडीएफ डाउनलोड",
    emailPDF: "रिपोर्ट ईमेल करें",
    consultation: "डॉक्टर से परामर्श",
    scheduleConsultation: "परामर्श अनुसूची",
    reminderAlert: "आगामी दवा अनुस्मारक",
    activeReminders: "सक्रिय दवा अनुस्मारक",
    emergencyAlert: "तत्काल चिकित्सा सहायता लें",
    emergencyDescription: "आपके लक्षण गंभीर जोखिम का संकेत देते हैं। कृपया तुरंत आपातकालीन सेवाओं से संपर्क करें या निकटतम अस्पताल जाएं।",
    nearestHospitals: "निकटतम आपातकालीन सुविधाएं",
    dailyTips: "दैनिक स्वास्थ्य अंतर्दृष्टि",
    chronicMonitoring: "क्रोनिक बीमारी की निगरानी",
    languageSwitcher: "भाषा",
    symptomPlaceholder: "अपने लक्षण यहाँ लिखें (जैसे बुखार, सिरदर्द, सूखी खाँसी)..."
  },
  ta: {
    disclaimer: "இந்த அமைப்பு ஆரம்ப சுகாதார வழிகாட்டுதலை மட்டுமே வழங்குகிறது மற்றும் இது தொழில்முறை மருத்துவ நோயறிதலுக்கு மாற்றாகாது.",
    dashboard: "டாஷ்போர்டு",
    assessmentChat: "AI அறிகுறி சரிபார்ப்பு",
    reports: "மருத்துவ அறிக்கைகள்",
    telemedicine: "டெலிமெடிசின்",
    reminders: "மருந்து நினைவூட்டல்",
    settings: "அமைப்புகள்",
    login: "உள்நுழைக",
    logout: "வெளியேறு",
    signup: "பதிவு செய்க",
    about: "எங்களைப் பற்றி",
    features: "அம்சங்கள்",
    welcome: "மீண்டும் வருக",
    healthScore: "சுகாதார மதிப்பெண்",
    recentAssessments: "சமீபத்திய மதிப்பீடுகள்",
    symptoms: "அறிகுறிகள்",
    severity: "தீவிரம்",
    riskScore: "ஆபத்து மதிப்பெண்",
    doctorNotes: "மருத்துவர் குறிப்புகள்",
    approvedByDoctor: "மருத்துவ ஆய்வு",
    approved: "அங்கீகரிக்கப்பட்டது",
    pendingReview: "ஆய்வில் உள்ளது",
    viewReport: "அறிக்கையைப் பார்",
    downloadPDF: "PDF பதிவிறக்கம்",
    emailPDF: "அறிக்கையை மின்னஞ்சல் செய்",
    consultation: "மருத்துவரை அணுகவும்",
    scheduleConsultation: "ஆலோசனையை திட்டமிடு",
    reminderAlert: "வரவிருக்கும் மருந்து நினைவூட்டல்கள்",
    activeReminders: "செயலில் உள்ள நினைவூட்டல்கள்",
    emergencyAlert: "உடனடி மருத்துவ உதவியை நாடுங்கள்",
    emergencyDescription: "உங்கள் அறிகுறிகள் கடுமையான ஆபத்தைக் குறிக்கின்றன. தயவுசெய்து உடனடியாக அவசர சேவைகளைத் தொடர்பு கொள்ளவும் அல்லது அருகிலுள்ள மருத்துவமனைக்குச் செல்லவும்.",
    nearestHospitals: "அருகிலுள்ள அவசர சிகிச்சை மையங்கள்",
    dailyTips: "தினசரி சுகாதார குறிப்புகள்",
    chronicMonitoring: "நாள்பட்ட நோய் கண்காணிப்பு",
    languageSwitcher: "மொழி",
    symptomPlaceholder: "உங்கள் அறிகுறிகளை இங்கே தட்டச்சு செய்யவும் (எ.का. காய்ச்சல், தலைவலி, இருமல்)..."
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('medibot_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('medibot_lang', lang);
  }, [lang]);

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
export default LanguageContext;

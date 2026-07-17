const MEDICAL_DISCLAIMER = "\n\n**Safety Disclaimer:** This is not a medical diagnosis. Please consult a qualified doctor.";

function appendMedicalDisclaimer(text) {
  if (text && !text.includes("This is not a medical diagnosis")) {
    return text + MEDICAL_DISCLAIMER;
  }
  return text;
}

module.exports = { appendMedicalDisclaimer };

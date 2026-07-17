const MEDICAL_DISCLAIMER = "\n\n**Safety Disclaimer:** This is not a medical diagnosis. Please consult a qualified doctor.";

function appendMedicalDisclaimer(text) {
  if (text && !text.includes("This is not a medical diagnosis")) {
    return text + MEDICAL_DISCLAIMER;
  }
  return text;
}

// Express middleware - just calls next(), disclaimer is appended in route handler
function medicalSafetyMiddleware(req, res, next) {
  next();
}

module.exports = medicalSafetyMiddleware;
module.exports.appendMedicalDisclaimer = appendMedicalDisclaimer;

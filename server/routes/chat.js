const express = require('express');
const router = express.Router();
const { appendMedicalDisclaimer } = require('../middleware/medicalSafety');

router.post('/', async (req, res) => {
  try {
    const { messages, profile } = req.body;
    
    const userMessageCount = messages.filter(m => m.role === 'user').length;

    let aiResponse = "";

    if (userMessageCount === 1) {
      aiResponse = `I see you are from ${profile?.location || 'your area'}. To give you better information, could you tell me:
- How high is the fever?
- Do you have any rash, vomiting, or cough?
- Any other symptoms like joint pain?`;
    } else {
      aiResponse = `**Possible common diseases it could relate to:**
- Dengue, Malaria, or Viral Fever (common in ${profile?.location || 'your area'})

**Prevention tips and what to watch for:**
- Drink plenty of fluids (ORS, coconut water).
- Watch for severe stomach pain or bleeding gums.
- Protect yourself from mosquitoes.

**Urgency level:**
See a doctor within 24 hours if fever doesn't break.`;
      
      aiResponse = appendMedicalDisclaimer(aiResponse);
    }

    res.json({ response: aiResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

module.exports = router;

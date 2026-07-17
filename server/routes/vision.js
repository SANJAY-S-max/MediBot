const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { appendMedicalDisclaimer } = require('../middleware/medicalSafety');

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    
    // Upload to S3 and call Vision API here
    let aiResponse = `
1. Summary: Analyzed medical image.
2. Key Findings: Values are within normal range.
3. What it Means: No immediate action required.
4. Suggested Actions: Maintain healthy lifestyle.
`;
    aiResponse = appendMedicalDisclaimer(aiResponse);
    
    res.json({ response: aiResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process vision upload' });
  }
});

module.exports = router;

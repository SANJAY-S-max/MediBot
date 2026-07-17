const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');

router.post('/', async (req, res) => {
  try {
    const { profile, messages } = req.body;
    
    const doc = new PDFDocument();
    
    res.setHeader('Content-disposition', 'attachment; filename="MediBot_Report.pdf"');
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);
    
    doc.fontSize(20).text('MediBot Awareness Report', { align: 'center' });
    doc.moveDown();
    
    if (profile) {
      doc.fontSize(12).text(`Name: ${profile.name} | Age: ${profile.age} | Gender: ${profile.gender} | Location: ${profile.location}`);
      doc.moveDown();
    }

    doc.fontSize(16).text('Symptoms & Conversation History');
    doc.moveDown(0.5);

    messages.forEach(msg => {
      doc.fontSize(12).text(`${msg.role === 'user' ? 'You' : 'MediBot'}:`, { continued: true, underline: true });
      doc.text(` ${msg.content.replace(/\n\n\*\*Safety Disclaimer:\*\*.*$/, '')}`);
      doc.moveDown(0.5);
    });

    doc.moveDown();
    doc.fontSize(10).fillColor('red')
       .text("DISCLAIMER: This report is only for awareness. This is NOT a medical diagnosis. Please consult a qualified doctor.", { align: 'center' });

    doc.end();

  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;

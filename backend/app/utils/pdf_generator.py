import io
import os
import qrcode
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_report_pdf(assessment: Any, patient_name: str, patient_age: Optional[int], patient_gender: Optional[str], patient_history: Optional[str]) -> bytes:
    """
    Generates a beautifully styled clinical assessment report PDF using ReportLab.
    Includes patient details, symptoms, predicted diseases, risk levels, doctor notes, and a QR code.
    """
    # Create an in-memory buffer
    buffer = io.BytesIO()
    
    # Establish document layout
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1E3A8A'),  # Deep Blue
        spaceAfter=6
    )
    
    section_title = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#0D9488'),  # Emerald Green
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#374151')  # Cool Grey
    )
    
    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica-BoldOblique',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#DC2626'),  # Red
        alignment=1  # Centered
    )
    
    label_style = ParagraphStyle(
        'LabelText',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#111827')
    )

    # 1. Header Banner
    header_data = [
        [
            Paragraph("MEDIBOT CLINICAL SUMMARY", title_style),
            Paragraph(f"<b>Date:</b> {assessment.created_at.strftime('%Y-%m-%d %H:%M UTC')}<br/><b>Source:</b> {assessment.source.upper()}", body_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[380, 160])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(header_table)
    
    # Horizontal Rule
    hr = Table([['']], colWidths=[540], rowHeights=[2])
    hr.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#1E3A8A')),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(hr)
    story.append(Spacer(1, 10))

    # 2. Disclaimer Section
    disclaimer_text = (
        "IMPORTANT DISCLAIMER: This system provides preliminary health guidance only and is NOT a "
        "substitute for professional medical diagnosis, treatment, or advice. Always consult a qualified "
        "medical professional for health concerns."
    )
    disclaimer_box = Table([[Paragraph(disclaimer_text, disclaimer_style)]], colWidths=[540])
    disclaimer_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#FEF2F2')),  # Light Red Background
        ('BORDER', (0, 0), (0, 0), 1, colors.HexColor('#FCA5A5')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(disclaimer_box)
    story.append(Spacer(1, 12))

    # 3. Patient Information
    story.append(Paragraph("Patient Information", section_title))
    patient_data = [
        [
            Paragraph("Name:", label_style), Paragraph(str(patient_name), body_style),
            Paragraph("Age / Gender:", label_style), Paragraph(f"{patient_age or 'N/A'} / {patient_gender or 'N/A'}", body_style)
        ],
        [
            Paragraph("Phone:", label_style), Paragraph(str(assessment.phone_number or 'N/A'), body_style),
            Paragraph("Assessment ID:", label_style), Paragraph(f"MB-#{assessment.id}", body_style)
        ],
        [
            Paragraph("Medical History:", label_style), Paragraph(str(patient_history or "None reported"), body_style),
            Paragraph("", body_style), Paragraph("", body_style)
        ]
    ]
    patient_table = Table(patient_data, colWidths=[100, 170, 100, 170])
    patient_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F9FAFB')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(patient_table)
    story.append(Spacer(1, 12))

    # 4. Symptoms Entered
    story.append(Paragraph("Reported Symptoms", section_title))
    symptoms_box = Table([[Paragraph(assessment.symptoms, body_style)]], colWidths=[540])
    symptoms_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#F3F4F6')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(symptoms_box)
    story.append(Spacer(1, 12))

    # 5. Diagnostic Predictions & Scores
    story.append(Paragraph("Symptom Analysis & Risk Assessment", section_title))
    
    # Severity indicator color mapping
    sev = assessment.severity_level.lower()
    sev_bg = '#DCFCE7' if 'low' in sev else ('#FEF9C3' if 'medium' in sev else '#FEE2E2')
    sev_text_color = '#15803D' if 'low' in sev else ('#A16207' if 'medium' in sev else '#B91C1C')
    
    sev_label_style = ParagraphStyle(
        'SevLabel',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor(sev_text_color),
        alignment=1
    )
    
    prediction_rows = []
    # Headers
    prediction_rows.append([
        Paragraph("<b>Predicted Condition</b>", label_style),
        Paragraph("<b>Match Confidence</b>", label_style)
    ])
    
    for disease in assessment.predicted_diseases:
        score = assessment.confidence_scores.get(disease, 0.0)
        percentage = f"{int(score * 100)}%" if score <= 1.0 else f"{int(score)}%"
        prediction_rows.append([
            Paragraph(disease, body_style),
            Paragraph(percentage, body_style)
        ])
        
    pred_table = Table(prediction_rows, colWidths=[340, 160])
    pred_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
    ]))

    # Risk scorecard
    risk_card_data = [
        [Paragraph(f"RISK LEVEL:<br/><b>{assessment.severity_level.upper()}</b>", sev_label_style)],
        [Paragraph(f"Health Risk Score:<br/><font size=18><b>{assessment.risk_score}/100</b></font>", ParagraphStyle('RiskScr', parent=body_style, alignment=1))]
    ]
    risk_card_table = Table(risk_card_data, colWidths=[150])
    risk_card_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(sev_bg)),
        ('BORDER', (0, 0), (-1, -1), 1, colors.HexColor(sev_text_color)),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))

    diagnostic_summary = Table([[pred_table, risk_card_table]], colWidths=[370, 170])
    diagnostic_summary.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(diagnostic_summary)
    story.append(Spacer(1, 12))

    # 6. Recommendations & Guidance
    story.append(Paragraph("Lifestyle and Prevention Recommendations", section_title))
    rec_box = Table([[Paragraph(assessment.recommendations or "No specific guidelines provided.", body_style)]], colWidths=[540])
    rec_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#F0FDFA')),  # Mint tint
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(rec_box)
    story.append(Spacer(1, 12))

    # 7. Doctor Review Panel (Keep together to avoid splitting doctor block)
    doctor_panel_elements = []
    doctor_panel_elements.append(Paragraph("Doctor Consultation & Sign-off", section_title))
    
    doc_status = "Approved by Clinical Assistant" if assessment.is_approved_by_doctor else "Awaiting Doctor Review"
    doc_notes = assessment.doctor_notes or "No clinical feedback or doctor notes entered yet."
    
    doctor_data = [
        [
            Paragraph("Review Status:", label_style), Paragraph(doc_status, body_style),
            Paragraph("Authorized Signature:", label_style), Paragraph("________________________", body_style)
        ],
        [
            Paragraph("Clinical Notes:", label_style), Paragraph(doc_notes, body_style),
            Paragraph("", body_style), Paragraph("", body_style)
        ]
    ]
    doctor_table = Table(doctor_data, colWidths=[100, 170, 110, 160])
    doctor_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EFF6FF')),  # Blue tint
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    doctor_panel_elements.append(doctor_table)
    
    # 8. QR Code generation & placement
    qr_data = f"http://medibot.local/assessment/{assessment.id}"
    qr = qrcode.QRCode(version=1, box_size=3, border=1)
    qr.add_data(qr_data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert PIL Image to ReportLab Flowable Image
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format='PNG')
    qr_buffer.seek(0)
    
    qr_flowable = Image(qr_buffer, width=1.0*inch, height=1.0*inch)
    
    footer_cols = [
        [
            Paragraph("<b>MediBot Digital Healthcare</b>", body_style),
            Paragraph("Access this clinical report securely online by scanning the QR code, or share with your doctor directly.", body_style)
        ],
        qr_flowable
    ]
    footer_table = Table([footer_cols], colWidths=[420, 120])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    
    doctor_panel_elements.append(Spacer(1, 10))
    doctor_panel_elements.append(footer_table)
    
    story.append(KeepTogether(doctor_panel_elements))
    
    # Build Document
    doc.build(story)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

# Typing Any hack to prevent linting complaints in environments where typing details differ
from typing import Any

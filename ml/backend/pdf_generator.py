import io
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, String as DString
from reportlab.graphics.charts.barcharts import VerticalBarChart

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Primary Brand Color: Slate Blue
        primary_color = colors.HexColor("#1a2332")
        amber_color = colors.HexColor("#f59e0b")
        
        # Top banner
        self.setFillColor(primary_color)
        self.rect(0, 750, 612, 42, fill=True, stroke=False)
        
        self.setFillColor(colors.white)
        self.setFont("Helvetica-Bold", 12)
        self.drawString(36, 765, "☀️ SolarAI India — Feasibility Report")
        
        # Footer
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#9ba4b0"))
        self.drawString(36, 36, "Confidential feasibility assessment. Powered by NASA POWER data.")
        self.drawRightString(576, 36, f"Page {self._pageNumber} of {page_count}")
        
        # Accent yellow bar under header
        self.setFillColor(amber_color)
        self.rect(0, 746, 612, 4, fill=True, stroke=False)
        
        self.restoreState()

def generate_pdf_report(data: dict) -> io.BytesIO:
    """
    Generates a professional PDF report from feasibility results.
    data format:
    {
      "city": "Mumbai",
      "state": "Maharashtra",
      "roof_area_sqm": 120,
      "monthly_bill_inr": 3500,
      "budget_inr": 150000,
      "property_type": "residential",
      "panel_type": "mono",
      "orientation": "south",
      "shading": "none",
      "cleaning": "weekly",
      "environment": "clean",
      "daily_generation_kwh": 14.5,
      "monthly_generation_kwh": 435,
      "annual_generation_kwh": 5292,
      "gross_cost_inr": 180000,
      "central_subsidy_inr": 78000,
      "state_subsidy_inr": 0,
      "net_investment_inr": 102000,
      "payback_years": 4.2,
      "roi_pct": 145,
      "npv_inr": 320000,
      "co2_offset_kg": 4339,
      "trees_equivalent": 199,
      "solar_score": 88,
      "health_index": 85,
      "recommendations": ["Install Mono-PERC", "Switch orientation to south"],
      "insights": ["Weekly cleaning yields 12% output bump"],
      "whatif_results": [
        {"scenario": "Current", "generation": 14.5, "payback": 4.2},
        {"scenario": "Mono Panels", "generation": 16.2, "payback": 3.8}
      ],
      "confidence_percent": 92,
      "confidence_low": 13.8,
      "confidence_high": 15.2
    }
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=80,
        bottomMargin=60
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#1a2332"),
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor("#1a2332"),
        spaceBefore=12,
        spaceAfter=8
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#4a5568")
    )
    
    bold_body_style = ParagraphStyle(
        'BoldBody',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    card_title_style = ParagraphStyle(
        'CardTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=14,
        textColor=colors.HexColor("#1a2332")
    )

    story = []
    
    # 1. Document Title
    story.append(Paragraph("Rooftop Solar Feasibility Assessment", title_style))
    story.append(Paragraph(f"Location: <b>{data.get('city', '').title()}, {data.get('state', '').replace('_', ' ').title()}</b> &nbsp;&nbsp;|&nbsp;&nbsp; Date Generated: {datetime.datetime.now().strftime('%d %b %Y')}", body_style))
    story.append(Spacer(1, 15))
    
    # 2. Executive Scores Row (Ready/Health/Confidence)
    score_data = [
        [
            Paragraph("<b>Solar Readiness Score</b>", card_title_style),
            Paragraph("<b>Solar Health Index</b>", card_title_style),
            Paragraph("<b>Prediction Confidence</b>", card_title_style)
        ],
        [
            Paragraph(f"<font size=28 color='#f59e0b'><b>{data.get('solar_score', 0)}</b></font>/100", body_style),
            Paragraph(f"<font size=28 color='#10b981'><b>{data.get('health_index', 0)}</b></font>/100", body_style),
            Paragraph(f"<font size=28 color='#3b82f6'><b>{data.get('confidence_percent', 0)}%</b></font>", body_style)
        ],
        [
            Paragraph("Score based on solar resource, orientation, roof area, shading, cleaning.", body_style),
            Paragraph("Measures degradation potential, heat loss, dust and shading resilience.", body_style),
            Paragraph(f"Interval range: {data.get('confidence_low', 0)} – {data.get('confidence_high', 0)} kWh/day", body_style)
        ]
    ]
    
    score_table = Table(score_data, colWidths=[180, 180, 180])
    score_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 12),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 15))
    
    # 3. Inputs & Predictions Table Side-by-Side
    details_data = [
        [
            Paragraph("<b>Property & Roof Parameters</b>", h1_style),
            Paragraph("<b>Predicted Generation Output</b>", h1_style)
        ],
        [
            Table([
                [Paragraph("Roof Area:", body_style), Paragraph(f"<b>{data.get('roof_area_sqm', 0)} m²</b>", body_style)],
                [Paragraph("Property Type:", body_style), Paragraph(f"<b>{data.get('property_type', '').title()}</b>", body_style)],
                [Paragraph("Panel Type:", body_style), Paragraph(f"<b>{data.get('panel_type', '').upper()}</b>", body_style)],
                [Paragraph("Orientation:", body_style), Paragraph(f"<b>{data.get('orientation', '').title()}</b>", body_style)],
                [Paragraph("Shading Level:", body_style), Paragraph(f"<b>{data.get('shading', '').title()}</b>", body_style)],
                [Paragraph("Cleaning Frequency:", body_style), Paragraph(f"<b>{data.get('cleaning', '').title()}</b>", body_style)],
                [Paragraph("Environment:", body_style), Paragraph(f"<b>{data.get('environment', '').replace('_', ' ').title()}</b>", body_style)]
            ], colWidths=[110, 140]),
            Table([
                [Paragraph("Daily Solar Generation:", body_style), Paragraph(f"<b>{data.get('daily_generation_kwh', 0)} kWh/day</b>", body_style)],
                [Paragraph("Monthly Generation:", body_style), Paragraph(f"<b>{data.get('monthly_generation_kwh', 0)} kWh/month</b>", body_style)],
                [Paragraph("Annual Generation:", body_style), Paragraph(f"<b>{data.get('annual_generation_kwh', 0)} kWh/year</b>", body_style)],
                [Paragraph("Monthly Bill Saved:", body_style), Paragraph(f"<b>{data.get('monthly_bill_inr', 0)} INR/month</b>", body_style)]
            ], colWidths=[130, 120])
        ]
    ]
    details_table = Table(details_data, colWidths=[270, 270])
    details_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 15))
    
    # 4. Financial & Subsidy Section
    story.append(Paragraph("Financial Feasibility & PM Surya Ghar Subsidy", h1_style))
    
    fin_table_data = [
        [Paragraph("<b>Item</b>", bold_body_style), Paragraph("<b>Amount (INR)</b>", bold_body_style), Paragraph("<b>Calculation Details / Policy</b>", bold_body_style)],
        [Paragraph("Gross Installation Cost", body_style), Paragraph(f"₹{data.get('gross_cost_inr', 0):,.2f}", body_style), Paragraph("Total cost before subsidy", body_style)],
        [Paragraph("Central Government Subsidy", body_style), Paragraph(f"- ₹{data.get('central_subsidy_inr', 0):,.2f}", body_style), Paragraph("PM Surya Ghar central grant (MNRE 2024)", body_style)],
        [Paragraph("State Government Subsidy", body_style), Paragraph(f"- ₹{data.get('state_subsidy_inr', 0):,.2f}", body_style), Paragraph("Additional state-level subsidy", body_style)],
        [Paragraph("<b>Net Out-of-Pocket Investment</b>", bold_body_style), Paragraph(f"<b>₹{data.get('net_investment_inr', 0):,.2f}</b>", bold_body_style), Paragraph("Actual net capital requirement", bold_body_style)],
        [Paragraph("Estimated Payback Period", body_style), Paragraph(f"<b>{data.get('payback_years', 0)} Years</b>", body_style), Paragraph("Net Investment / Annual Savings", body_style)],
        [Paragraph("Return on Investment (ROI)", body_style), Paragraph(f"<b>{data.get('roi_pct', 0)}%</b>", body_style), Paragraph("Projected lifecycle ROI", body_style)],
        [Paragraph("Net Present Value (NPV)", body_style), Paragraph(f"₹{data.get('npv_inr', 0):,.2f}", body_style), Paragraph("Discounted cashflow over 25 years", body_style)]
    ]
    fin_table = Table(fin_table_data, colWidths=[170, 130, 240])
    fin_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(fin_table)
    story.append(Spacer(1, 15))
    
    # Page Break for layout cleanliness
    story.append(PageBreak())
    
    # 5. What-if Simulations
    story.append(Paragraph("What-If Simulation Comparison", h1_style))
    story.append(Paragraph("Analyze how changing roof configurations impacts your generation capability and financial savings:", body_style))
    story.append(Spacer(1, 8))
    
    whatif_header = [
        [Paragraph("<b>Scenario</b>", bold_body_style), Paragraph("<b>Daily Output (kWh)</b>", bold_body_style), Paragraph("<b>Payback (Years)</b>", bold_body_style), Paragraph("<b>Carbon Offset (Annual kg)</b>", bold_body_style)]
    ]
    for sc in data.get("whatif_results", []):
        whatif_header.append([
            Paragraph(sc.get("scenario", ""), body_style),
            Paragraph(f"{sc.get('generation', 0):.1f} kWh", body_style),
            Paragraph(f"{sc.get('payback', 0):.1f} Yrs", body_style),
            Paragraph(f"{sc.get('co2_offset', 0):,.0f} kg", body_style)
        ])
    whatif_table = Table(whatif_header, colWidths=[150, 130, 130, 130])
    whatif_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(whatif_table)
    story.append(Spacer(1, 15))
    
    # 6. Environmental Impact
    story.append(Paragraph("Environmental Impact", h1_style))
    eco_text = (
        f"Installing this solar system offsets approximately <b>{data.get('co2_offset_kg', 0):,.1f} kg</b> of CO₂ "
        f"emissions annually. This is equivalent to planting <b>{data.get('trees_equivalent', 0)}</b> mature trees."
    )
    story.append(Paragraph(eco_text, body_style))
    story.append(Spacer(1, 15))
    
    # 7. AI Recommendations & Insights
    story.append(Paragraph("AI Recommendations & Maintenance Suggestions", h1_style))
    
    recs = data.get("recommendations", [])
    if not recs:
        recs = ["No specific recommendation needed. Keep roof shading free."]
    for rec in recs:
        story.append(Paragraph(f"• {rec}", body_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("<b>AI Insights:</b>", bold_body_style))
    insights = data.get("insights", [])
    if not insights:
        insights = ["Monsoon/cloud cover may impact output. Clean panels regular to minimize dirt loss."]
    for ins in insights:
        story.append(Paragraph(f"• {ins}", body_style))
        
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer

#!/usr/bin/env python3
"""Generate the Noocoks CV PDF from data/cv.json using ReportLab."""
import json
import os
from datetime import datetime, timezone
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "data", "cv.json")
OUTPUT = os.path.join(ROOT, "assets", "docs", "cv-noocoks.pdf")
with open(SOURCE, encoding="utf-8") as handle:
    data = json.load(handle)

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
INK = colors.HexColor("#171717")
MUTED = colors.HexColor("#65615f")
RED = colors.HexColor("#941f2c")
PALE = colors.HexColor("#eee9e8")
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CVName", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=25, leading=28, textColor=INK, alignment=TA_LEFT, spaceAfter=3))
styles.add(ParagraphStyle(name="CVRole", parent=styles["Normal"], fontName="Helvetica", fontSize=10, leading=14, textColor=RED, spaceAfter=7))
styles.add(ParagraphStyle(name="CVContact", parent=styles["Normal"], fontName="Helvetica", fontSize=8, leading=11, textColor=MUTED))
styles.add(ParagraphStyle(name="CVSection", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=RED, spaceBefore=7, spaceAfter=4, uppercase=True))
styles.add(ParagraphStyle(name="CVBody", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.5, leading=12, textColor=INK, spaceAfter=3))
styles.add(ParagraphStyle(name="CVSmall", parent=styles["BodyText"], fontName="Helvetica", fontSize=7.5, leading=10, textColor=MUTED, spaceAfter=2))
styles.add(ParagraphStyle(name="CVItem", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=INK, spaceAfter=2))
styles.add(ParagraphStyle(name="CVBullet", parent=styles["BodyText"], fontName="Helvetica", fontSize=8, leading=11, leftIndent=9, firstLineIndent=-6, textColor=INK, spaceAfter=2))

def p(value, style="CVBody"):
    return Paragraph(escape(str(value or "")), styles[style])

story = []
identity = data.get("identity", {})
story.append(p(identity.get("name", "Noocoks"), "CVName"))
story.append(p(identity.get("role", ""), "CVRole"))
contact = [identity.get("location"), identity.get("email"), "GitHub: " + identity.get("github", ""), identity.get("portfolio", "")]
story.append(p("  |  ".join(x for x in contact if x), "CVContact"))
story.append(Spacer(1, 5*mm))
story.append(p("PERFIL", "CVSection"))
story.append(p(data.get("summary", "")))

def add_section(title, entries, renderer):
    if not entries:
        return
    story.append(p(title, "CVSection"))
    for entry in entries:
        block = renderer(entry)
        story.append(KeepTogether(block))

def education(item):
    out = [p(item.get("title", ""), "CVItem")]
    meta = " · ".join(x for x in [item.get("institution", ""), item.get("period", "")] if x)
    if meta: out.append(p(meta, "CVSmall"))
    if item.get("details"): out.append(p(item["details"]))
    out.append(Spacer(1, 1*mm))
    return out

def experience(item):
    out = [p(item.get("role", "") + " — " + item.get("organization", ""), "CVItem")]
    if item.get("period"): out.append(p(item["period"], "CVSmall"))
    for detail in item.get("details", []): out.append(p("• " + detail, "CVBullet"))
    out.append(Spacer(1, 2*mm))
    return out

def project(item):
    out = [p(item.get("name", ""), "CVItem"), p(item.get("description", ""))]
    tech = "Tecnologías: " + " · ".join(item.get("technologies", []))
    if item.get("technologies"): out.append(p(tech, "CVSmall"))
    if item.get("url"): out.append(p(item["url"], "CVSmall"))
    out.append(Spacer(1, 2*mm))
    return out

add_section("Formación", data.get("education", []), education)
add_section("Experiencia", data.get("experience", []), experience)
add_section("Proyectos seleccionados", data.get("projects", []), project)
if data.get("skills"):
    story.append(p("COMPETENCIAS TÉCNICAS", "CVSection"))
    rows = []
    for group in data["skills"]:
        rows.append([p(group.get("area", ""), "CVItem"), p(" · ".join(group.get("items", [])), "CVSmall")])
    table = Table(rows, colWidths=[43*mm, 125*mm], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"), ("LINEBELOW", (0,0), (-1,-1), .35, PALE),
        ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 7),
        ("TOPPADDING", (0,0), (-1,-1), 2.5), ("BOTTOMPADDING", (0,0), (-1,-1), 2.5)
    ]))
    story.append(table)
if data.get("languages"):
    story.append(p("IDIOMAS", "CVSection"))
    for language in data["languages"]:
        story.append(p(language if isinstance(language, str) else " — ".join([language.get("name",""), language.get("level","")])))

def footer(canvas, doc):
    canvas.saveState()
    width, _ = A4
    canvas.setStrokeColor(PALE); canvas.setLineWidth(.6)
    canvas.line(20*mm, 15*mm, width-20*mm, 15*mm)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(20*mm, 10*mm, "NOOCOKS  /  CURRÍCULUM")
    canvas.drawRightString(width-20*mm, 10*mm, f"{datetime.now(timezone.utc).strftime('%d/%m/%Y')}  ·  {doc.page}")
    canvas.restoreState()

doc = SimpleDocTemplate(OUTPUT, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=15*mm, bottomMargin=20*mm, title="CV — Noocoks", author="Noocoks")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f"Generated {OUTPUT}")

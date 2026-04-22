import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import type { BrandingSettings, PhotoAttachment } from '@/types';
import { DEFAULT_BRANDING } from '@/lib/brandingContext';

/** Convert a base64 data URL to a Uint8Array for docx ImageRun. */
function base64ToUint8Array(dataUrl: string): Uint8Array {
  const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Detect image MIME type from data URL prefix. */
function imageTypeFromDataUrl(dataUrl: string): 'jpg' | 'png' | 'gif' | 'bmp' {
  if (dataUrl.startsWith('data:image/png')) return 'png';
  if (dataUrl.startsWith('data:image/gif')) return 'gif';
  if (dataUrl.startsWith('data:image/bmp')) return 'bmp';
  return 'jpg'; // default — PhotoUpload always compresses to JPEG
}

/**
 * Returns a short, human-readable reference from a full report ID.
 * Format: REF-XXXXXXXX (first 8 hex chars of the UUID, uppercase).
 * The underlying UUID is never modified — this is display-only.
 */
export function shortRef(id: string | undefined | null): string {
  if (!id) return 'REF-UNKNOWN';
  // Strip hyphens then take first 8 characters
  const clean = id.replace(/-/g, '');
  return `REF-${clean.slice(0, 8).toUpperCase()}`;
}

/** Get the natural pixel dimensions of an image from its data URL (browser only). */
function getImageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 400, h: 300 });
    img.src = dataUrl;
  });
}

/** Format an ISO date string (YYYY-MM-DD) as DD/MM/YYYY for UK display. */
export function formatDateUK(dateStr?: string | null): string {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const HEADER_HEIGHT_MM = 28; // height reserved at top of each PDF page for branding

function drawPdfBrandingHeader(pdf: jsPDF, branding: BrandingSettings) {
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Background bar
  pdf.setFillColor(20, 20, 20); // near-black
  pdf.roundedRect(0, 0, pageWidth, HEADER_HEIGHT_MM, 0, 0, 'F');

  let textX = 5;

  // Logo (if provided)
  if (branding.logoDataUrl) {
    try {
      const ext = branding.logoDataUrl.startsWith('data:image/png') ? 'PNG'
        : branding.logoDataUrl.startsWith('data:image/jpeg') ? 'JPEG'
        : branding.logoDataUrl.startsWith('data:image/webp') ? 'WEBP'
        : 'PNG';
      const logoSize = 18;
      pdf.addImage(branding.logoDataUrl, ext, 5, (HEADER_HEIGHT_MM - logoSize) / 2, logoSize, logoSize);
      textX = 27;
    } catch {
      // logo failed to load — skip, keep textX at 5
    }
  }

  // Company name
  pdf.setTextColor(255, 220, 0); // sitk-yellow
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(branding.companyName, textX, HEADER_HEIGHT_MM / 2 - 1);

  // Address / contact on second line
  const contactParts: string[] = [];
  if (branding.address) contactParts.push(branding.address);
  if (branding.phone) contactParts.push(branding.phone);
  if (branding.email) contactParts.push(branding.email);
  if (branding.website) contactParts.push(branding.website);
  if (contactParts.length > 0) {
    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(contactParts.join('  |  '), textX, HEADER_HEIGHT_MM / 2 + 5);
  }

  // Reset text colour
  pdf.setTextColor(0, 0, 0);
}

export const exportToPDF = async (elementId: string, fileName: string, branding: BrandingSettings = DEFAULT_BRANDING) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Hide buttons during export
  const buttons = element.querySelectorAll('.export-hide');
  buttons.forEach(btn => (btn as HTMLElement).style.display = 'none');

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const contentAreaHeight = pdfHeight - HEADER_HEIGHT_MM;

    const imgProps = pdf.getImageProperties(imgData);
    const imgRenderedHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // First page
    drawPdfBrandingHeader(pdf, branding);
    pdf.addImage(imgData, 'PNG', 0, HEADER_HEIGHT_MM, pdfWidth, imgRenderedHeight);

    // Additional pages if content overflows
    let remaining = imgRenderedHeight - contentAreaHeight;
    while (remaining > 0) {
      pdf.addPage();
      drawPdfBrandingHeader(pdf, branding);
      const yOffset = -(imgRenderedHeight - remaining) + HEADER_HEIGHT_MM;
      pdf.addImage(imgData, 'PNG', 0, yOffset, pdfWidth, imgRenderedHeight);
      remaining -= contentAreaHeight;
    }

    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    buttons.forEach(btn => (btn as HTMLElement).style.display = '');
  }
};

export const exportToWord = async (title: string, data: any, fileName: string, branding: BrandingSettings = DEFAULT_BRANDING) => {
  const WORD_SKIP = new Set(['id', 'authorId', 'type', 'data', 'photos',
    'templateId']);

  /** Format a value for Word output: booleans → Yes/No, ISO dates → DD/MM/YYYY, sanitises placeholders, else String.
   *  Never returns [object Object] — arrays and plain objects return '' (global safeguard). */
  const wordVal = (v: any): string => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'string') {
      if (['undefined','null','unknown'].includes(v.trim().toLowerCase())) return '';
      // Base64 data URLs (drawn signatures) — show as a clean label
      if (v.startsWith('data:image/')) return '\u2713 Signed';
      if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
        const p = v.split('T')[0].split('-');
        return `${p[2]}/${p[1]}/${p[0]}`;
      }
      return v;
    }
    // Global safeguard: never render raw objects or arrays as strings
    if (Array.isArray(v) || (typeof v === 'object' && v !== null)) return '';
    return String(v);
  };

  const wordLabel = (key: string) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();

  const sections: any[] = [];

  // ── Branding header ──────────────────────────────────────────────────────
  const contactLine = [branding.address, branding.phone, branding.email, branding.website]
    .filter(Boolean)
    .join('  |  ');

  sections.push(
    new Paragraph({
      children: [
        new TextRun({ text: branding.companyName, bold: true, size: 26, color: '1a1a1a' }),
      ],
      spacing: { after: 80 }
    })
  );
  if (contactLine) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: contactLine, size: 16, color: '666666' })],
        spacing: { after: 200 }
      })
    );
  }

  // Yellow divider
  sections.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: 'FFDC00', space: 1 } },
      spacing: { after: 200 }
    })
  );

  // ── Summary metadata strip ───────────────────────────────────────────────
  const metaFields: [string, any][] = [
    ['Status', data.status],
    ['Date', data.date],
    ['Location', data.location],
    ['Reference', shortRef(data.id)],
    ['Author', data.authorName],
  ].filter(([, v]) => {
    if (v === undefined || v === null || v === '') return false;
    const s = String(v).trim().toLowerCase();
    return !['undefined','null','unknown'].includes(s);
  }) as [string, any][];

  if (metaFields.length > 0) {
    const metaTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: metaFields.map(([label]) => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, color: '888888' })] })],
            shading: { fill: 'F5F5F5', type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
              left: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
              right: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
            }
          }))
        }),
        new TableRow({
          children: metaFields.map(([, v]) => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: wordVal(v), size: 20, bold: true })] })],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
              left: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
              right: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
            }
          }))
        }),
      ]
    });
    sections.push(metaTable);
    sections.push(new Paragraph({ spacing: { after: 300 } }));
  }

  // Second yellow divider before report body
  sections.push(
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD', space: 1 } },
      spacing: { after: 300 }
    })
  );

  // ── Form Data ────────────────────────────────────────────────────────────
  // Prefer report.data if it's a non-empty object, otherwise use flat data
  const body: Record<string, any> =
    (data.data && typeof data.data === 'object' && Object.keys(data.data).length > 0)
      ? data.data
      : data;

  // ── Score Block (rendered before executive summary) ──────────────────────
  const wScoreVal  = body.overallScore ?? data.overallScore;
  const wActual    = body.actualPoints ?? data.actualPoints;
  const wMax       = body.maxPoints    ?? data.maxPoints;
  const wHasPct    = typeof wScoreVal === 'number';
  const wHasPts    = typeof wActual === 'number' && typeof wMax === 'number';
  if (wHasPct || wHasPts) {
    let wScoreText: string;
    let wLevel: string;
    if (wHasPct) {
      const pct = wScoreVal as number;
      wScoreText = `${pct}%`;
      wLevel = pct >= 90 ? 'EXCELLENT' : pct >= 75 ? 'GOOD' : pct >= 50 ? 'FAIR' : 'ACTION REQUIRED';
    } else {
      const pct = wMax > 0 ? Math.round((wActual / wMax) * 100) : 0;
      wScoreText = `${wActual} / ${wMax}  (${pct}%)`;
      const ratingRaw = body.rating ?? data.rating ?? '';
      wLevel = String(ratingRaw) || (pct >= 90 ? 'EXCELLENT' : pct >= 75 ? 'GOOD' : pct >= 50 ? 'FAIR' : 'POOR');
    }
    const cellBorder = {
      top:    { style: BorderStyle.SINGLE, size: 1, color: '333333' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
      left:   { style: BorderStyle.SINGLE, size: 1, color: '333333' },
      right:  { style: BorderStyle.SINGLE, size: 1, color: '333333' },
    };
    const scoreTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: 'OVERALL SCORE', bold: true, size: 16, color: 'FFDC00' })], spacing: { after: 60 } }),
                new Paragraph({ children: [new TextRun({ text: wScoreText, bold: true, size: 36, color: 'FFDC00' })] }),
              ],
              shading: { fill: '1C1C20', type: ShadingType.CLEAR },
              borders: cellBorder,
              margins: { left: 160, right: 80, top: 120, bottom: 120 },
            }),
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: 'COMPLIANCE LEVEL', bold: true, size: 16, color: 'AAAAAA' })], spacing: { after: 60 } }),
                new Paragraph({ children: [new TextRun({ text: wLevel, bold: true, size: 30, color: 'FFFFFF' })] }),
              ],
              shading: { fill: '1C1C20', type: ShadingType.CLEAR },
              borders: cellBorder,
              margins: { left: 80, right: 160, top: 120, bottom: 120 },
            }),
          ],
        }),
      ],
    });
    sections.push(scoreTable);
    sections.push(new Paragraph({ spacing: { after: 300 } }));
  }

  // ── Executive Summary (rendered prominently before all other body fields) ─
  const execSummaryWord: string = wordVal(
    body.executiveSummary ?? data.executiveSummary ?? ''
  );
  if (execSummaryWord) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'EXECUTIVE SUMMARY', bold: true, size: 22, color: '1a1a1a', allCaps: true })],
        spacing: { before: 200, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'FFDC00', space: 1 } },
      })
    );
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: execSummaryWord, size: 20, color: '333333' })],
        spacing: { before: 120, after: 300 },
      })
    );
  }

  Object.entries(body).forEach(([key, value]) => {
    if (WORD_SKIP.has(key)) return;
    // Skip executive summary fields — already rendered above
    if (key === 'executiveSummary' || key === 'overallComments') return;
    if (value === null || value === undefined || value === '') return;
    if (['status','date','location','id','authorId','title','type','authorName',
         'createdAt','updatedAt','reportDate','submittedAt','savedAt',
         'overallScore','maxPoints','actualPoints','rating'].includes(key)) return;
    // Suppress scalar date fields that duplicate the report date already shown in meta strip
    const repDateUK = formatDateUK(data.date);
    if (repDateUK && typeof value === 'string' && wordVal(value) === repDateUK) return;

    const label = wordLabel(key);

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${label}:  `, bold: true, size: 20 }),
            new TextRun({ text: wordVal(value), size: 20 })
          ],
          spacing: { after: 160 }
        })
      );
    } else if (Array.isArray(value) && value.length > 0) {
      sections.push(
        new Paragraph({
          text: label,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 120 }
        })
      );

      if (typeof value[0] === 'object' && value[0] !== null) {
        const WORD_SKIP_TABLE_COLS = new Set(['id', 'key', 'signature', 'note']);
        const rawHeaders = Object.keys(value[0]).filter(h => !WORD_SKIP_TABLE_COLS.has(h));
        if (rawHeaders.length > 0) {

          // ── Detect "sections with nested items" pattern ───────────────────
          // e.g. audit: [{ title, items:[{question,answer,comment}] }]
          //      hs-mini: [{ title, questions:[{question,score,comments}] }]
          const nestedArrayKey = rawHeaders.find(
            h => Array.isArray(value[0][h]) && value[0][h].length > 0 && typeof value[0][h][0] === 'object'
          );
          const isNestedSections = !!nestedArrayKey && rawHeaders.includes('title');

          if (isNestedSections) {
            value.forEach((section: any) => {
              const sectionTitle: string = String(section.title || '');
              const nestedItems: any[] = section[nestedArrayKey] ?? [];
              if (nestedItems.length === 0) return;

              sections.push(
                new Paragraph({
                  children: [new TextRun({ text: sectionTitle, bold: true, size: 20, color: '333333' })],
                  spacing: { before: 200, after: 80 },
                  border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'FFDC00', space: 1 } },
                })
              );

              const WORD_SKIP_NESTED = new Set(['id', 'key', 'signature', 'note']);
              const nHeaders0 = Object.keys(nestedItems[0]).filter(h => !WORD_SKIP_NESTED.has(h));
              const answerKey = nHeaders0.includes('answer') ? 'answer'
                : nHeaders0.includes('score') ? 'score' : null;
              const qKeyN = nHeaders0.find((h: string) => ['question', 'item', 'label'].includes(h));
              const isNestedChecklist = !!qKeyN && !!answerKey;

              let nHeaders: string[];
              let nColPcts: number[];
              if (isNestedChecklist) {
                const commentKey = nHeaders0.includes('comment') ? 'comment'
                  : nHeaders0.includes('notes') ? 'notes'
                  : nHeaders0.includes('comments') ? 'comments' : null;
                nHeaders  = [qKeyN!, answerKey!, ...(commentKey ? [commentKey] : [])];
                nColPcts  = commentKey ? [58, 17, 25] : [72, 28];
              } else {
                nHeaders  = nHeaders0.filter(h => !Array.isArray(nestedItems[0][h]) && typeof nestedItems[0][h] !== 'object');
                // Smart widths: wider col for long-text first columns
                nColPcts = (() => { const lk=['description','hazard','action','observation','details','task','finding','issue']; const f=lk.some(k=>nHeaders[0]?.toLowerCase().includes(k)); return f&&nHeaders.length===2?[65,35]:f&&nHeaders.length===3?[55,23,22]:nHeaders.map(()=>Math.floor(100/Math.max(nHeaders.length,1))); })();
              }

              if (nHeaders.length === 0) return;

              const nestedTable = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnWidths: nColPcts.map(p => p * 91),
                rows: [
                  new TableRow({
                    tableHeader: true,
                    children: nHeaders.map(h => new TableCell({
                      width: { size: nColPcts[nHeaders.indexOf(h)], type: WidthType.PERCENTAGE },
                      children: [new Paragraph({ children: [new TextRun({ text: wordLabel(h).toUpperCase(), bold: true, size: 17, color: 'FFFFFF' })] })],
                      shading: { fill: '1E1E1E', type: ShadingType.CLEAR },
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
                        left: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
                        right: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
                      }
                    }))
                  }),
                  ...nestedItems.map((item: any, ri: number) => new TableRow({
                    children: nHeaders.map(h => {
                      const cellText = wordVal(item[h] ?? '');
                      let shadeFill = ri % 2 === 0 ? 'FFFFFF' : 'F6F7FA';
                      if (h === answerKey && cellText) {
                        const lc = cellText.toLowerCase();
                        if (lc === 'yes' || lc === '1') shadeFill = 'D7F5D7';
                        else if (lc === 'no' || lc === '0') shadeFill = 'FAD8D8';
                        else shadeFill = 'EEEEF5';
                      }
                      return new TableCell({
                        width: { size: nColPcts[nHeaders.indexOf(h)], type: WidthType.PERCENTAGE },
                        children: [new Paragraph({ children: [new TextRun({ text: cellText, size: 18, bold: h === answerKey })] })],
                        shading: { fill: shadeFill, type: ShadingType.CLEAR },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
                          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
                          left: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
                          right: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
                        }
                      });
                    })
                  }))
                ]
              });
              sections.push(nestedTable);
              sections.push(new Paragraph({ spacing: { after: 160 } }));
            });
            return; // nested sections handled — skip standard table rendering
          }

          // ── Standard checklist / table rendering ────────────────────────────
          // Detect checklist pattern: question/item/label + answer columns
          const qKey = rawHeaders.find(h => ['question', 'item', 'label'].includes(h));
          const stdAnswerKey = rawHeaders.includes('answer') ? 'answer'
            : rawHeaders.includes('score') ? 'score' : null;
          const isChecklist = !!qKey && !!stdAnswerKey;
          let headers: string[];
          let colPcts: number[];
          let commentKey: string | null = null;
          if (isChecklist) {
            commentKey = rawHeaders.includes('comment') ? 'comment'
              : rawHeaders.includes('notes') ? 'notes'
              : rawHeaders.includes('comments') ? 'comments' : null;
            headers = [qKey!, stdAnswerKey!, ...(commentKey ? [commentKey] : [])];
            colPcts = commentKey ? [58, 17, 25] : [72, 28];
          } else {
            // Only include scalar columns — skip nested arrays/objects
            headers = rawHeaders.filter(h => !Array.isArray(value[0][h]) && typeof value[0][h] !== 'object');
            // Smart widths: wider col for long-text first columns
            colPcts = (() => { const lk=['description','hazard','action','observation','details','task','finding','issue']; const f=lk.some(k=>headers[0]?.toLowerCase().includes(k)); return f&&headers.length===2?[65,35]:f&&headers.length===3?[55,23,22]:headers.map(()=>Math.floor(100/Math.max(headers.length,1))); })();
          }

          if (headers.length === 0) return; // nothing scalar to render

          const table = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: colPcts.map(p => p * 91), // approx DXA units (9100 total for A4)
            rows: [
              new TableRow({
                tableHeader: true,
                children: headers.map(h => new TableCell({
                  width: { size: colPcts[headers.indexOf(h)], type: WidthType.PERCENTAGE },
                  children: [new Paragraph({
                    children: [new TextRun({ text: wordLabel(h).toUpperCase(), bold: true, size: 17, color: 'FFFFFF' })]
                  })],
                  shading: { fill: '1E1E1E', type: ShadingType.CLEAR },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
                    left: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
                    right: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
                  }
                }))
              }),
              ...value.map((item, ri) => new TableRow({
                children: headers.map(h => {
                  const rawVal = wordVal(item[h] ?? '');
                  // For answer column: if empty, promote notes/comment value; fallback N/A
                  // For notes/comment column: clear if its value was promoted to answer
                  const answerRaw = isChecklist ? wordVal(item[stdAnswerKey!] ?? '') : '';
                  const notesRaw  = isChecklist && commentKey ? wordVal(item[commentKey] ?? '') : '';
                  let cellText: string;
                  if (isChecklist && h === stdAnswerKey) {
                    cellText = answerRaw || notesRaw || 'N/A';
                  } else if (isChecklist && h === commentKey && !answerRaw && notesRaw) {
                    cellText = ''; // value promoted to answer column — suppress here
                  } else {
                    cellText = rawVal;
                  }
                  let shadeFill = ri % 2 === 0 ? 'FFFFFF' : 'F6F7FA';
                  if (h === stdAnswerKey && cellText && cellText !== 'N/A') {
                    const lc = cellText.toLowerCase();
                    if (lc === 'yes') shadeFill = 'D7F5D7';
                    else if (lc === 'no') shadeFill = 'FAD8D8';
                    else shadeFill = 'EEEEF5';
                  }
                  return new TableCell({
                    width: { size: colPcts[headers.indexOf(h)], type: WidthType.PERCENTAGE },
                    children: [new Paragraph({
                      children: [new TextRun({
                        text: cellText,
                        size: 18,
                        bold: h === stdAnswerKey
                      })]
                    })],
                    shading: { fill: shadeFill, type: ShadingType.CLEAR },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
                      left: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
                      right: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
                    }
                  });
                })
              }))
            ]
          });
          sections.push(table);
          sections.push(new Paragraph({ spacing: { after: 200 } }));
        }
      } else {
        value.forEach(item => {
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: `•  ${wordVal(item)}`, size: 20 })],
              spacing: { after: 80 }
            })
          );
        });
      }
    } else if (typeof value === 'object') {
      const entries = Object.entries(value).filter(([, v]) => v !== null && v !== undefined && v !== '');
      if (entries.length === 0) return;

      // Boolean checkbox map — only show selected (true) items as bullets
      const isBoolMap = entries.every(([, v]) => typeof v === 'boolean');
      if (isBoolMap) {
        const selected = entries.filter(([, v]) => v === true);
        if (selected.length === 0) return;
        sections.push(
          new Paragraph({
            children: [new TextRun({ text: label.toUpperCase(), bold: true, size: 22, color: '1a1a1a', allCaps: true })],
            spacing: { before: 200, after: 80 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'FFDC00', space: 1 } },
          })
        );
        selected.forEach(([k]) => {
          sections.push(
            new Paragraph({
              children: [new TextRun({ text: `\u2022  ${k}`, size: 20 })],
              spacing: { after: 60 },
            })
          );
        });
        sections.push(new Paragraph({ spacing: { after: 160 } }));
        return;
      }

      // Regular object — key-value pairs (skip signature/note sub-fields)
      const WORD_SKIP_OBJ = new Set(['signature', 'note', 'id', 'key']);
      const validEntries = entries.filter(([k]) => !WORD_SKIP_OBJ.has(k));
      if (validEntries.length === 0) return;
      sections.push(
        new Paragraph({
          text: label,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 120 }
        })
      );
      validEntries.forEach(([k, v]) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${wordLabel(k)}:  `, bold: true, size: 20 }),
              new TextRun({ text: wordVal(v), size: 20 })
            ],
            spacing: { after: 100 }
          })
        );
      });
    }
  });

  // ── Photographs ──────────────────────────────────────────────────────────
  const wordPhotos: PhotoAttachment[] = Array.isArray(data.photos) ? (data.photos as PhotoAttachment[]) : [];
  if (wordPhotos.length > 0) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'PHOTOGRAPHS', bold: true, size: 22, color: '1a1a1a', allCaps: true })],
        spacing: { before: 400, after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'FFDC00', space: 1 } },
      })
    );
    sections.push(new Paragraph({ spacing: { after: 120 } }));

    // Max dimensions for each photo in a 2-column layout (~A4 content ÷ 2, minus padding)
    const MAX_W_PX = 240;
    const MAX_H_PX = 190;

    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const cellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

    for (let i = 0; i < wordPhotos.length; i += 2) {
      const leftPhoto  = wordPhotos[i];
      const rightPhoto = wordPhotos[i + 1] ?? null;

      // Calculate rendered dimensions (maintain aspect ratio)
      const calcDims = async (photo: PhotoAttachment) => {
        const { w, h } = await getImageSize(photo.dataUrl);
        const ar = h > 0 ? w / h : 4 / 3;
        let pw = MAX_W_PX;
        let ph = Math.round(pw / ar);
        if (ph > MAX_H_PX) { ph = MAX_H_PX; pw = Math.round(ph * ar); }
        return { pw, ph };
      };

      const [leftDims, rightDims] = await Promise.all([
        calcDims(leftPhoto),
        rightPhoto ? calcDims(rightPhoto) : Promise.resolve({ pw: MAX_W_PX, ph: MAX_H_PX }),
      ]);

      const makeCell = (photo: PhotoAttachment, dims: { pw: number; ph: number }, marginSide: 'right' | 'left'): TableCell => {
        const imgData  = base64ToUint8Array(photo.dataUrl);
        const imgType  = imageTypeFromDataUrl(photo.dataUrl);
        const children: Paragraph[] = [
          new Paragraph({
            children: [
              new ImageRun({
                data: imgData,
                transformation: { width: dims.pw, height: dims.ph },
                type: imgType,
              }),
            ],
            spacing: { after: 60 },
          }),
        ];
        if (photo.caption) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: photo.caption, size: 16, italics: true, color: '666666' })],
              spacing: { after: 120 },
            })
          );
        }
        return new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          children,
          borders: cellBorders,
          margins: marginSide === 'right'
            ? { top: 0, bottom: 0, left: 0, right: 200 }
            : { top: 0, bottom: 0, left: 200, right: 0 },
        });
      };

      const rowCells: TableCell[] = [makeCell(leftPhoto, leftDims, 'right')];
      if (rightPhoto) {
        rowCells.push(makeCell(rightPhoto, rightDims, 'left'));
      } else {
        // Empty placeholder cell to keep the grid even
        rowCells.push(
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [] })],
            borders: cellBorders,
          })
        );
      }

      sections.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [new TableRow({ children: rowCells })],
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder },
        })
      );
      sections.push(new Paragraph({ spacing: { after: 160 } }));
    }
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  sections.push(new Paragraph({ spacing: { before: 600 } }));
  sections.push(
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD', space: 1 } },
      children: [
        new TextRun({
          text: `${branding.companyName}  ·  ${contactLine}  ·  Generated ${new Date().toLocaleDateString('en-GB')}`,
          size: 14,
          color: '999999'
        })
      ],
      spacing: { before: 200 }
    })
  );

  const doc = new Document({
    creator: branding.companyName,
    title,
    sections: [{
      properties: {},
      children: sections
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
};

export const printReport = () => {
  window.print();
};

// ---------------------------------------------------------------------------
// Helpers shared by the programmatic export functions below
// ---------------------------------------------------------------------------

const SKIP_KEYS = new Set([
  // top-level report metadata — shown in header/meta strip, never in body
  'id', 'authorId', 'type', 'status', 'title', 'location', 'date',
  'description', 'data', 'photos',
  // common server-side timestamps that duplicate the report date
  'createdAt', 'updatedAt', 'reportDate', 'submittedAt', 'savedAt',
  // executive summary rendered separately at the top of the body
  'executiveSummary', 'overallComments',
  // score fields rendered in the dedicated score block (not generic loop)
  'overallScore', 'maxPoints', 'actualPoints', 'rating',
  // internal routing/template keys — not user-facing data
  'templateId',
]);

/** Build a clean "Type - Location - Date" filename (sanitised for filesystem). */
export function makeReportFileName(report: { type?: string; title?: string; location?: string; date?: string }): string {
  const type = (report.type || 'Report').trim();

  // ── Premises / Project name ─────────────────────────────────────────────
  // Strip the report-type prefix and any date suffixes that forms bake into
  // the title so that only the meaningful project/premises name remains.
  let premisesName = String(report.title || '').trim();

  // Remove an exact (case-insensitive) type echo at the start of the title
  const typePattern = type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  premisesName = premisesName.replace(new RegExp(`^${typePattern}[:\\s\\u2013\\-]*`, 'i'), '');

  // Remove other well-known boilerplate prefixes that forms prepend
  const boilerplate = [
    'Site Induction',
    'Monthly Site Safety Audit',
    'H&S Audit Form',
    'H&S Mini Audit',
    'Daily Site Safety Inspection',
    'Computer DSE Checklist',
    'Lone Worker Checklist',
    'Manual Handling Checklist',
    'General H&S Checklist',
    'Pallet Racking Monthly Checklist',
    'Monthly Premises H&S Checklist',
    'Six-Monthly Premises H&S Checklist',
    'Annual Premises H&S Checklist',
    'Equipment Safety Inspection',
    'Fire Briefing', 'Fire Drill', 'Fire Warden Checklist',
    'Contractor Vetting \\(Small\\)', 'Contractor Vetting',
    'Lone Working Checklist', 'Manual Handling Assessment',
    'DSE Assessment', 'Incident Report', 'Permit to Work',
    'Toolbox Talk',
  ];
  const boilerplateRe = new RegExp(
    `^(${boilerplate.join('|')})[:\\s\\u2013\\-]*`,
    'i'
  );
  premisesName = premisesName.replace(boilerplateRe, '');

  // Remove embedded date patterns and parenthetical date groups
  premisesName = premisesName
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')          // 2026-04-19
    .replace(/\b\d{2}\/\d{2}\/\d{4}\b/g, '')         // 19/04/2026
    .replace(/\b\d{2}-\d{2}-\d{4}\b/g, '')           // 19-04-2026
    .replace(/\([^)]*\d{4}[^)]*\)/g, '')             // (April 2026), (2026-04-19)
    .replace(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi, '')
    .replace(/^[\s\u2013:\-]+/, '')
    .replace(/[\s\u2013:\-]+$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // ── Date formatted as DD-MM-YYYY ────────────────────────────────────────
  let dateStr: string;
  if (report.date) {
    const d = new Date(report.date);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      dateStr = `${dd}-${mo}-${d.getFullYear()}`;
    } else {
      dateStr = report.date;
    }
  } else {
    const now = new Date();
    dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  }

  // ── Assemble: Type – Premises Name – Location – Date ───────────────────
  const parts = [
    type,
    premisesName || '',
    (report.location || '').trim(),
    dateStr,
  ].filter(p => p.length > 0);

  // Use en-dash separator ( – ) for readability; strip filesystem-illegal chars
  return parts.join(' \u2013 ').replace(/[/\\?%*:|"<>]/g, '-');
}

/** Human-readable label from a camelCase key. */
function humanLabel(key: string): string {
  // Known acronyms that should stay uppercase
  const acronyms = ['dse', 'ppe', 'coshh', 'riddor', 'wfh', 'cctv', 'gdpr', 'nhs', 'hse', 'ra', 'ptw', 'id', 'ref'];
  const result = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
  // Uppercase known acronyms within the label
  return result.replace(/\b(\w+)\b/g, word => {
    if (acronyms.includes(word.toLowerCase())) return word.toUpperCase();
    return word;
  });
}

/** Sentinel strings that should not appear in output. */
const PLACEHOLDER_STRINGS = new Set(['undefined', 'null', 'unknown']);

/** Format a raw value for PDF display. Sanitises bad values, converts ISO dates.
 *  Never returns [object Object] — arrays and plain objects return '' (global safeguard). */
function displayVal(v: any): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'string') {
    if (PLACEHOLDER_STRINGS.has(v.trim().toLowerCase())) return '';
    // Base64 data URLs (drawn signatures, photos) — show as a clean label
    if (v.startsWith('data:image/')) return '\u2713 Signed';
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
      const p = v.split('T')[0].split('-');
      return `${p[2]}/${p[1]}/${p[0]}`;
    }
    return v;
  }
  // Global safeguard: never render raw objects or arrays as strings
  if (Array.isArray(v) || (typeof v === 'object' && v !== null)) return '';
  return String(v);
}

// ---------------------------------------------------------------------------
// Programmatic PDF — works without a DOM element (for MyReports, etc.)
// ---------------------------------------------------------------------------

export const exportSavedReportToPDF = async (
  report: Record<string, any>,
  branding: BrandingSettings = DEFAULT_BRANDING
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth  = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const MARGIN   = 14;
  const CONTENT_W = pageWidth - MARGIN * 2;
  const COL_GAP   = 3;           // gap between 2-col grid cells
  const COL_W     = (CONTENT_W - COL_GAP) / 2;
  let y = HEADER_HEIGHT_MM + 6;

  // ── Page management ──────────────────────────────────────────────────────
  const addPage = () => {
    pdf.addPage();
    drawPdfBrandingHeader(pdf, branding);
    y = HEADER_HEIGHT_MM + 6;
  };
  const checkBreak = (needed = 8) => {
    if (y + needed > pageHeight - 16) addPage();
  };

  // ── Branding header ──────────────────────────────────────────────────────
  drawPdfBrandingHeader(pdf, branding);

  // ── Meta strip: TYPE / REF / STATUS / DATE / LOCATION ───────────────────
  const rawMetaCells = [
    { label: 'TYPE',     value: report.type   || '' },
    { label: 'REF',      value: shortRef(report.id) },
    { label: 'STATUS',   value: report.status || '' },
    { label: 'DATE',     value: formatDateUK(report.date) },
    ...(report.location ? [{ label: 'LOCATION', value: String(report.location) }] : []),
  ].filter(c => c.value);

  if (rawMetaCells.length > 0) {
    // Measure each cell's required height at 8pt bold within its column width
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    const cellW     = CONTENT_W / rawMetaCells.length;
    const metaRowH  = rawMetaCells.reduce((max, cell) => {
      const lines = pdf.splitTextToSize(cell.value, cellW - 6);
      return Math.max(max, lines.length > 1 ? 18 : 14);
    }, 14);

    rawMetaCells.forEach((cell, i) => {
      const cx = MARGIN + i * cellW;
      pdf.setFillColor(245, 246, 248);
      pdf.rect(cx, y, cellW, metaRowH, 'F');
      pdf.setDrawColor(210, 210, 215);
      pdf.setLineWidth(0.25);
      pdf.rect(cx, y, cellW, metaRowH);

      // Micro-label
      pdf.setFontSize(5.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(120, 120, 130);
      pdf.text(cell.label, cx + 3, y + 4.5);

      // Value — wrapping
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 15, 20);
      const valLines = pdf.splitTextToSize(cell.value, cellW - 6) as string[];
      valLines.slice(0, 2).forEach((ln, li) => pdf.text(ln, cx + 3, y + 9.5 + li * 4.5));
    });
    y += metaRowH + 2;
  }

  // Yellow accent rule
  pdf.setDrawColor(255, 215, 0);
  pdf.setLineWidth(1.0);
  pdf.line(MARGIN, y, pageWidth - MARGIN, y);
  y += 7;

  // ── Local rendering helpers ──────────────────────────────────────────────

  /** Section heading: yellow left bar + bold label. */
  const sectionHeading = (text: string) => {
    checkBreak(14);
    y += 3;
    pdf.setFillColor(255, 215, 0);
    pdf.rect(MARGIN, y, 2.5, 6.5, 'F');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(18, 18, 22);
    pdf.text(text, MARGIN + 5.5, y + 5);
    y += 10;
  };

  /** Light horizontal divider between sections. */
  const thinRule = () => {
    y += 3;
    pdf.setDrawColor(225, 225, 230);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN, y, pageWidth - MARGIN, y);
    y += 4;
  };

  // ── Two-column scalar grid buffer ─────────────────────────────────────────
  // Scalars are buffered and flushed in pairs (2-col grid) for information density.
  const scalarBuf: Array<{ label: string; val: string }> = [];

  const flushScalars = () => {
    if (scalarBuf.length === 0) return;
    for (let i = 0; i < scalarBuf.length; i += 2) {
      const left  = scalarBuf[i];
      const right = scalarBuf[i + 1] ?? null;

      // Determine if left value is long (full-width)
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'normal');
      const leftW     = right ? COL_W - 6 : CONTENT_W - 6;
      const leftLines = pdf.splitTextToSize(left.val, leftW) as string[];
      const rightLines: string[] = right
        ? (pdf.splitTextToSize(right.val, COL_W - 6) as string[])
        : [];

      // Row height = tallest column content: label(5) + lines * 4.5 + padding(4)
      const lh = 5 + leftLines.length  * 4.5 + 4;
      const rh = right ? 5 + rightLines.length * 4.5 + 4 : 0;
      const rowH = Math.max(lh, rh, 12);

      checkBreak(rowH);

      // Left cell
      const drawCell = (cx: number, cw: number, labelTxt: string, valLines: string[]) => {
        pdf.setFillColor(250, 250, 252);
        pdf.rect(cx, y, cw, rowH, 'F');
        pdf.setDrawColor(228, 228, 233);
        pdf.setLineWidth(0.2);
        pdf.rect(cx, y, cw, rowH);

        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(110, 110, 120);
        pdf.text(labelTxt, cx + 3, y + 4.5);

        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(12, 12, 16);
        valLines.forEach((ln, li) => pdf.text(ln, cx + 3, y + 9.5 + li * 4.5));
      };

      drawCell(MARGIN, right ? COL_W : CONTENT_W, left.label, leftLines);
      if (right) drawCell(MARGIN + COL_W + COL_GAP, COL_W, right.label, rightLines);

      y += rowH + 2;
    }
    scalarBuf.length = 0;
    y += 1;
  };

  // ── Field rendering ──────────────────────────────────────────────────────
  const allData: Record<string, any> = {
    ...(typeof report.data === 'object' && report.data !== null ? report.data as object : {}),
    ...report,
  };

  const reportDateUK = formatDateUK(report.date);

  // ── Score Block (rendered prominently before all other body fields) ──────
  const hasPctScore   = typeof allData.overallScore === 'number';
  const hasPointScore = typeof allData.actualPoints === 'number' && typeof allData.maxPoints === 'number';
  if (hasPctScore || hasPointScore) {
    let scoreText: string;
    let complianceLevel: string;
    if (hasPctScore) {
      const pct = allData.overallScore as number;
      scoreText      = `${pct}%`;
      complianceLevel = pct >= 90 ? 'EXCELLENT' : pct >= 75 ? 'GOOD' : pct >= 50 ? 'FAIR' : 'ACTION REQUIRED';
    } else {
      const actual = allData.actualPoints as number;
      const max    = allData.maxPoints    as number;
      const pct    = max > 0 ? Math.round((actual / max) * 100) : 0;
      scoreText      = `${actual} / ${max}  (${pct}%)`;
      complianceLevel = String(allData.rating || (pct >= 90 ? 'EXCELLENT' : pct >= 75 ? 'GOOD' : pct >= 50 ? 'FAIR' : 'POOR'));
    }
    const BOX_H = 22;
    checkBreak(BOX_H + 6);
    // Dark background box
    pdf.setFillColor(28, 28, 32);
    pdf.rect(MARGIN, y, CONTENT_W, BOX_H, 'F');
    // Yellow left accent bar
    pdf.setFillColor(255, 215, 0);
    pdf.rect(MARGIN, y, 3, BOX_H, 'F');
    // Score label
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(160, 160, 170);
    pdf.text('OVERALL SCORE', MARGIN + 7, y + 6.5);
    // Score value (large, yellow)
    pdf.setFontSize(15);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 215, 0);
    pdf.text(scoreText, MARGIN + 7, y + 16.5);
    // Compliance label (right)
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(160, 160, 170);
    const compLabel = 'COMPLIANCE LEVEL';
    const compLabelW = pdf.getTextWidth(compLabel);
    pdf.text(compLabel, MARGIN + CONTENT_W - compLabelW - 6, y + 6.5);
    // Compliance value (right, white bold)
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    const levelW = pdf.getTextWidth(complianceLevel);
    pdf.text(complianceLevel, MARGIN + CONTENT_W - levelW - 6, y + 16.5);
    y += BOX_H + 5;
    thinRule();
  }

  // ── Executive Summary (rendered prominently before all other fields) ─────
  const execSummaryText: string = displayVal(
    allData.executiveSummary ?? ''
  );
  if (execSummaryText) {
    sectionHeading('Executive Summary');
    // Render as a styled block (light yellow tint, full-width)
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    const execLines = pdf.splitTextToSize(execSummaryText, CONTENT_W - 10) as string[];
    const execBoxH = execLines.length * 5.0 + 10;
    checkBreak(execBoxH);
    pdf.setFillColor(255, 252, 230);
    pdf.rect(MARGIN, y, CONTENT_W, execBoxH, 'F');
    pdf.setDrawColor(255, 215, 0);
    pdf.setLineWidth(0.5);
    pdf.rect(MARGIN, y, CONTENT_W, execBoxH);
    pdf.setTextColor(30, 30, 35);
    execLines.forEach((ln, li) => pdf.text(ln, MARGIN + 5, y + 7 + li * 5.0));
    y += execBoxH + 4;
    thinRule();
  }

  for (const [key, value] of Object.entries(allData)) {
    if (SKIP_KEYS.has(key)) continue;
    if (value === null || value === undefined || value === '') continue;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) continue;
    if (reportDateUK && typeof value === 'string' && displayVal(value) === reportDateUK) continue;

    const label = humanLabel(key);

    // ── Scalar ──────────────────────────────────────────────────────────
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      const val = displayVal(value);
      if (!val) continue;
      scalarBuf.push({ label, val });

    // ── Array ────────────────────────────────────────────────────────────
    } else if (Array.isArray(value) && value.length > 0) {
      flushScalars();
      sectionHeading(label);

      if (typeof value[0] === 'object' && value[0] !== null) {
        // Skip signature, note and other non-data columns universally
        const SKIP_TABLE_COLS = new Set(['id', 'key', 'signature', 'note']);
        const rawHeaders = Object.keys(value[0]).filter(h => !SKIP_TABLE_COLS.has(h));
        if (rawHeaders.length === 0) { thinRule(); continue; }

        // ── Detect "sections with nested items" pattern ──────────────────────
        // e.g. audit: [{ title, items:[{question,answer,comment}] }]
        //      hs-mini: [{ title, questions:[{question,score,comments}] }]
        const nestedArrayKey = rawHeaders.find(
          h => Array.isArray(value[0][h]) && value[0][h].length > 0 && typeof value[0][h][0] === 'object'
        );
        const isNestedSections = !!nestedArrayKey && rawHeaders.includes('title');

        if (isNestedSections) {
          value.forEach((section: any) => {
            const sectionTitle: string = String(section.title || '');
            const nestedItems: any[] = section[nestedArrayKey] ?? [];
            if (nestedItems.length === 0) return;

            // Sub-section heading
            checkBreak(12);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(60, 60, 80);
            pdf.text(sectionTitle, MARGIN + 4, y + 5);
            y += 9;

            const SKIP_NESTED_COLS = new Set(['id', 'key', 'signature', 'note']);
            const nHeaders0 = Object.keys(nestedItems[0]).filter(h => !SKIP_NESTED_COLS.has(h));
            const answerKey = nHeaders0.includes('answer') ? 'answer'
              : nHeaders0.includes('score') ? 'score' : null;
            const qKeyN = nHeaders0.find((h: string) => ['question', 'item', 'label'].includes(h));
            const isNestedChecklist = !!qKeyN && !!answerKey;

            let nHeaders: string[];
            let nColWidths: number[];
            if (isNestedChecklist) {
              const commentKey = nHeaders0.includes('comment') ? 'comment'
                : nHeaders0.includes('notes') ? 'notes'
                : nHeaders0.includes('comments') ? 'comments' : null;
              nHeaders   = [qKeyN!, answerKey!, ...(commentKey ? [commentKey] : [])];
              nColWidths = commentKey
                ? [CONTENT_W * 0.56, CONTENT_W * 0.18, CONTENT_W * 0.26]
                : [CONTENT_W * 0.73, CONTENT_W * 0.27];
            } else {
              nHeaders   = nHeaders0.filter(h => !Array.isArray(nestedItems[0][h]) && typeof nestedItems[0][h] !== 'object');
              // Smart widths: wider col for long-text first columns
              nColWidths = (() => { const lk=['description','hazard','action','observation','details','task','finding','issue']; const f=lk.some(k=>nHeaders[0]?.toLowerCase().includes(k)); return f&&nHeaders.length===2?[CONTENT_W*0.65,CONTENT_W*0.35]:f&&nHeaders.length===3?[CONTENT_W*0.55,CONTENT_W*0.23,CONTENT_W*0.22]:nHeaders.map(()=>CONTENT_W/Math.max(nHeaders.length,1)); })();
            }

            if (nHeaders.length === 0) return;

            // Table header row
            checkBreak(9);
            pdf.setFillColor(28, 28, 35);
            pdf.rect(MARGIN, y, CONTENT_W, 7, 'F');
            pdf.setFontSize(6.5);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(255, 255, 255);
            let ncx = MARGIN;
            nHeaders.forEach((h, i) => {
              pdf.text(humanLabel(h).toUpperCase(), ncx + 2.5, y + 4.8);
              ncx += nColWidths[i];
            });
            y += 7;

            // Table data rows
            nestedItems.forEach((row: any, ri: number) => {
              pdf.setFontSize(7.5);
              pdf.setFont('helvetica', 'normal');
              let rowH = 7;
              nHeaders.forEach((h, i) => {
                const cellVal = displayVal(row[h] ?? '');
                const cellLines = pdf.splitTextToSize(cellVal, nColWidths[i] - 5) as string[];
                rowH = Math.max(rowH, cellLines.length * 4.3 + 4);
              });

              checkBreak(rowH);
              pdf.setFillColor(ri % 2 === 0 ? 255 : 246, ri % 2 === 0 ? 255 : 247, ri % 2 === 0 ? 255 : 251);
              pdf.rect(MARGIN, y, CONTENT_W, rowH, 'F');
              pdf.setDrawColor(213, 213, 218);
              pdf.setLineWidth(0.2);
              pdf.rect(MARGIN, y, CONTENT_W, rowH);

              ncx = MARGIN;
              nHeaders.forEach((h, i) => {
                const raw = displayVal(row[h] ?? '');
                // Answer column: empty → N/A
                const cellVal = h === answerKey && !raw ? 'N/A' : raw;
                const cellLines = pdf.splitTextToSize(cellVal, nColWidths[i] - 5) as string[];
                const isShortAnswer = h === answerKey && cellLines.length === 1 && cellVal.length <= 6;
                if (h === answerKey && cellVal) {
                  const lc = cellVal.toLowerCase();
                  if      (lc === 'yes' || lc === '1') pdf.setFillColor(210, 244, 210);
                  else if (lc === 'no'  || lc === '0') pdf.setFillColor(252, 218, 218);
                  else                                  pdf.setFillColor(238, 238, 245);
                  pdf.rect(isShortAnswer ? ncx + 1 : ncx, y + (isShortAnswer ? 1 : 0), nColWidths[i] - (isShortAnswer ? 2 : 0), rowH - (isShortAnswer ? 2 : 0), 'F');
                  pdf.setFontSize(7.5);
                  pdf.setFont('helvetica', 'bold');
                  pdf.setTextColor(18, 18, 22);
                  if (isShortAnswer) {
                    pdf.text(cellVal, ncx + nColWidths[i] / 2, y + rowH / 2 + 2.5, { align: 'center' });
                  } else {
                    cellLines.forEach((ln, li) => pdf.text(ln, ncx + 2.5, y + 4.5 + li * 4.3));
                  }
                } else {
                  pdf.setFontSize(7.5);
                  pdf.setFont('helvetica', 'normal');
                  pdf.setTextColor(18, 18, 22);
                  cellLines.forEach((ln, li) => pdf.text(ln, ncx + 2.5, y + 4.5 + li * 4.3));
                }
                if (i < nHeaders.length - 1) {
                  pdf.setDrawColor(200, 200, 207);
                  pdf.setLineWidth(0.2);
                  pdf.line(ncx + nColWidths[i], y, ncx + nColWidths[i], y + rowH);
                }
                ncx += nColWidths[i];
              });
              y += rowH;
            });
            y += 4;
          });
          thinRule();
          continue;
        }

        // ── Standard checklist / table rendering ────────────────────────────
        // Detect checklist pattern: question/item/label + answer columns
        const qKeyStd = rawHeaders.find(h => ['question', 'item', 'label'].includes(h));
        const pdfAnswerKey = rawHeaders.includes('answer') ? 'answer'
          : rawHeaders.includes('score') ? 'score' : null;
        const isChecklist = !!qKeyStd && !!pdfAnswerKey;
        let headers: string[];
        let colWidths: number[];
        let commentKeyStd: string | null = null;

        if (isChecklist) {
          commentKeyStd = rawHeaders.includes('comment') ? 'comment'
            : rawHeaders.includes('notes') ? 'notes'
            : rawHeaders.includes('comments') ? 'comments' : null;
          headers   = [qKeyStd!, pdfAnswerKey!, ...(commentKeyStd ? [commentKeyStd] : [])];
          colWidths = commentKeyStd
            ? [CONTENT_W * 0.56, CONTENT_W * 0.18, CONTENT_W * 0.26]
            : [CONTENT_W * 0.73, CONTENT_W * 0.27];
        } else {
          // Only include scalar columns — skip nested arrays/objects
          headers   = rawHeaders.filter(h => !Array.isArray(value[0][h]) && typeof value[0][h] !== 'object');
          // Smart widths: wider col for long-text first columns
          colWidths = (() => { const lk=['description','hazard','action','observation','details','task','finding','issue']; const f=lk.some(k=>headers[0]?.toLowerCase().includes(k)); return f&&headers.length===2?[CONTENT_W*0.65,CONTENT_W*0.35]:f&&headers.length===3?[CONTENT_W*0.55,CONTENT_W*0.23,CONTENT_W*0.22]:headers.map(()=>CONTENT_W/Math.max(headers.length,1)); })();
        }

        if (headers.length === 0) { thinRule(); continue; }

        // Table header row
        checkBreak(9);
        pdf.setFillColor(28, 28, 35);
        pdf.rect(MARGIN, y, CONTENT_W, 7, 'F');
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        let cx = MARGIN;
        headers.forEach((h, i) => {
          pdf.text(humanLabel(h).toUpperCase(), cx + 2.5, y + 4.8);
          cx += colWidths[i];
        });
        y += 7;

        // Table data rows
        value.forEach((row, ri) => {
          // Pre-resolve cell values with note→answer promotion
          const answerRaw = isChecklist ? displayVal(row[pdfAnswerKey!] ?? '') : '';
          const notesRaw  = isChecklist && commentKeyStd ? displayVal(row[commentKeyStd] ?? '') : '';
          const resolveCell = (h: string): string => {
            if (isChecklist && h === pdfAnswerKey) {
              return answerRaw || notesRaw || 'N/A'; // promote notes if answer empty; fallback N/A
            }
            if (isChecklist && h === commentKeyStd && !answerRaw && notesRaw) {
              return ''; // value was promoted to answer column — suppress here
            }
            const raw = displayVal(row[h] ?? '');
            return h === pdfAnswerKey && !raw ? 'N/A' : raw;
          };

          // Calculate row height from ALL columns' content
          pdf.setFontSize(7.5);
          pdf.setFont('helvetica', 'normal');
          let rowH = 7;
          headers.forEach((h, i) => {
            const cellVal = resolveCell(h);
            const cellLines = pdf.splitTextToSize(cellVal, colWidths[i] - 5) as string[];
            rowH = Math.max(rowH, cellLines.length * 4.3 + 4);
          });

          checkBreak(rowH);

          pdf.setFillColor(ri % 2 === 0 ? 255 : 246, ri % 2 === 0 ? 255 : 247, ri % 2 === 0 ? 255 : 251);
          pdf.rect(MARGIN, y, CONTENT_W, rowH, 'F');
          pdf.setDrawColor(213, 213, 218);
          pdf.setLineWidth(0.2);
          pdf.rect(MARGIN, y, CONTENT_W, rowH);

          cx = MARGIN;
          headers.forEach((h, i) => {
            const cellVal = resolveCell(h);

            const answerLines = pdf.splitTextToSize(cellVal, colWidths[i] - 5) as string[];
            const isShortAnswer = h === pdfAnswerKey && answerLines.length === 1 && cellVal.length <= 6;
            if (isShortAnswer) {
              // Short Yes/No/score — color badge centered
              const lc = cellVal.toLowerCase();
              if      (lc === 'yes') pdf.setFillColor(210, 244, 210);
              else if (lc === 'no')  pdf.setFillColor(252, 218, 218);
              else                    pdf.setFillColor(238, 238, 245);
              pdf.rect(cx + 1, y + 1, colWidths[i] - 2, rowH - 2, 'F');
              pdf.setFontSize(7.5);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(18, 18, 22);
              pdf.text(cellVal, cx + colWidths[i] / 2, y + rowH / 2 + 2.5, { align: 'center' });
            } else {
              // Long text or non-answer column — wrap and align top-left
              if (h === pdfAnswerKey && cellVal) {
                const lc = cellVal.toLowerCase();
                if      (lc === 'yes') pdf.setFillColor(210, 244, 210);
                else if (lc === 'no')  pdf.setFillColor(252, 218, 218);
                else                    pdf.setFillColor(238, 238, 245);
                pdf.rect(cx, y, colWidths[i], rowH, 'F');
                pdf.setFont('helvetica', 'bold');
              } else {
                pdf.setFont('helvetica', 'normal');
              }
              pdf.setFontSize(7.5);
              pdf.setTextColor(18, 18, 22);
              const wrappedLines = pdf.splitTextToSize(cellVal, colWidths[i] - 5) as string[];
              wrappedLines.forEach((ln, li) => pdf.text(ln, cx + 2.5, y + 4.5 + li * 4.3));
            }

            if (i < headers.length - 1) {
              pdf.setDrawColor(200, 200, 207);
              pdf.setLineWidth(0.2);
              pdf.line(cx + colWidths[i], y, cx + colWidths[i], y + rowH);
            }
            cx += colWidths[i];
          });
          y += rowH;
        });
        y += 4;

      } else {
        // Simple string array — bullet list
        value.forEach(item => {
          const txt   = `\u2022  ${displayVal(item)}`;
          const lines = pdf.splitTextToSize(txt, CONTENT_W - 8) as string[];
          checkBreak(lines.length * 4.8 + 2);
          pdf.setFontSize(8.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(18, 18, 22);
          pdf.text(lines, MARGIN + 4, y);
          y += lines.length * 4.8 + 1.5;
        });
        y += 3;
      }
      thinRule();

    // ── Object ────────────────────────────────────────────────────────────
    } else if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value).filter(([, v]) => v !== null && v !== undefined && v !== '');
      if (entries.length === 0) continue;

      // ── Boolean checkbox map — only show selected (true) items as bullets ──
      const isBoolMap = entries.every(([, v]) => typeof v === 'boolean');
      if (isBoolMap) {
        const selected = entries.filter(([, v]) => v === true);
        if (selected.length === 0) continue;
        flushScalars();
        sectionHeading(label);
        selected.forEach(([k]) => {
          const txt = `\u2022  ${k}`;
          const lines = pdf.splitTextToSize(txt, CONTENT_W - 8) as string[];
          checkBreak(lines.length * 4.8 + 2);
          pdf.setFontSize(8.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(18, 18, 22);
          pdf.text(lines, MARGIN + 4, y);
          y += lines.length * 4.8 + 1.5;
        });
        y += 3;
        thinRule();
        continue;
      }

      flushScalars();
      sectionHeading(label);

      // Render object sub-fields in the same 2-col grid (skip signature/note sub-fields)
      const SKIP_OBJ_KEYS = new Set(['signature', 'note', 'id', 'key']);
      const objBuf: Array<{ label: string; val: string }> = [];
      entries.forEach(([k, v]) => {
        if (SKIP_OBJ_KEYS.has(k)) return;
        const sv = displayVal(v as any);
        if (sv) objBuf.push({ label: humanLabel(k), val: sv });
      });

      for (let i = 0; i < objBuf.length; i += 2) {
        const left  = objBuf[i];
        const right = objBuf[i + 1] ?? null;
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'normal');
        const lw  = right ? COL_W - 6 : CONTENT_W - 6;
        const lls = pdf.splitTextToSize(left.val, lw) as string[];
        const rls: string[] = right ? (pdf.splitTextToSize(right.val, COL_W - 6) as string[]) : [];
        const rowH = Math.max(5 + lls.length * 4.5 + 4, right ? 5 + rls.length * 4.5 + 4 : 0, 12);
        checkBreak(rowH);

        const drawSub = (cx: number, cw: number, lbl: string, vls: string[]) => {
          pdf.setFillColor(250, 250, 252);
          pdf.rect(cx, y, cw, rowH, 'F');
          pdf.setDrawColor(228, 228, 233);
          pdf.setLineWidth(0.2);
          pdf.rect(cx, y, cw, rowH);
          pdf.setFontSize(6.5);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(110, 110, 120);
          pdf.text(lbl, cx + 3, y + 4.5);
          pdf.setFontSize(8.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(12, 12, 16);
          vls.forEach((ln, li) => pdf.text(ln, cx + 3, y + 9.5 + li * 4.5));
        };

        drawSub(MARGIN, right ? COL_W : CONTENT_W, left.label, lls);
        if (right) drawSub(MARGIN + COL_W + COL_GAP, COL_W, right.label, rls);
        y += rowH + 2;
      }
      y += 2;
      thinRule();
    }
  }

  // Flush any remaining scalars
  flushScalars();

  // ── Photographs ───────────────────────────────────────────────────────────
  const reportPhotos: PhotoAttachment[] = Array.isArray(report.photos) ? (report.photos as PhotoAttachment[]) : [];
  if (reportPhotos.length > 0) {
    thinRule();
    sectionHeading('Photographs');

    const PHOTOS_PER_ROW = 2;
    const PHOTO_GAP      = 4;   // mm between columns
    const slotW          = (CONTENT_W - PHOTO_GAP) / PHOTOS_PER_ROW;
    const MAX_PHOTO_H    = 65;  // mm — max height per photo

    for (let i = 0; i < reportPhotos.length; i += PHOTOS_PER_ROW) {
      const row = reportPhotos.slice(i, i + PHOTOS_PER_ROW);

      // Calculate each image's rendered dimensions (maintain aspect ratio)
      const rowData = row.map(photo => {
        let imgW = slotW;
        let imgH = MAX_PHOTO_H;
        try {
          const props = pdf.getImageProperties(photo.dataUrl);
          const ar    = props.width / props.height;
          imgH = slotW / ar;
          if (imgH > MAX_PHOTO_H) { imgH = MAX_PHOTO_H; imgW = MAX_PHOTO_H * ar; }
          else imgW = slotW;
        } catch { /* use defaults */ }
        return { photo, imgW, imgH };
      });

      const rowH     = Math.max(...rowData.map(d => d.imgH));
      const hasCap   = rowData.some(d => !!d.photo.caption);
      const captionH = hasCap ? 7 : 0;

      checkBreak(rowH + captionH + 6);

      rowData.forEach(({ photo, imgW, imgH }, j) => {
        const slotX = MARGIN + j * (slotW + PHOTO_GAP);
        const xOff  = slotX + (slotW - imgW) / 2; // center horizontally in slot
        const yOff  = y + (rowH - imgH) / 2;        // center vertically in slot

        // Slot background + border
        pdf.setFillColor(245, 245, 248);
        pdf.setDrawColor(210, 210, 215);
        pdf.setLineWidth(0.3);
        pdf.rect(slotX, y, slotW, rowH, 'FD');

        try {
          pdf.addImage(photo.dataUrl, 'JPEG', xOff, yOff, imgW, imgH, undefined, 'FAST');
        } catch {
          // Draw placeholder if image fails
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(160, 160, 170);
          pdf.text('Image unavailable', slotX + slotW / 2, y + rowH / 2, { align: 'center' });
        }

        if (photo.caption) {
          pdf.setFontSize(6.5);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(80, 80, 90);
          const captLines = pdf.splitTextToSize(photo.caption, slotW - 2) as string[];
          pdf.text(captLines[0], slotX, y + rowH + 5);
        }
      });

      y += rowH + captionH + 6;
    }
    thinRule();
  }

  // ── Per-page footer ───────────────────────────────────────────────────────
  const totalPages = (pdf.internal as any).pages.length - 1;
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    const fY = pageHeight - 10;
    pdf.setDrawColor(208, 208, 213);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, fY - 4, pageWidth - MARGIN, fY - 4);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(148, 148, 155);
    const fContact = [branding.address, branding.phone, branding.email].filter(Boolean).join('  \u00b7  ');
    pdf.text(`${branding.companyName}  \u00b7  ${fContact}`, MARGIN, fY);
    pdf.text(
      `Generated ${new Date().toLocaleDateString('en-GB')}  |  Page ${p} of ${totalPages}  |  Ref: ${shortRef(report.id)}`,
      pageWidth - MARGIN,
      fY,
      { align: 'right' }
    );
  }

  pdf.save(`${makeReportFileName(report)}.pdf`);
};

// ---------------------------------------------------------------------------
// Programmatic Word — wrapper around exportToWord for saved Report objects
// ---------------------------------------------------------------------------

export const exportSavedReportToWord = async (
  report: Record<string, any>,
  branding: BrandingSettings = DEFAULT_BRANDING
) => {
  const rawTitle = String(report.title || '');
  const cleanTitle = rawTitle
    .replace(/\bundefined\b/gi, '')
    .replace(/\bnull\b/gi, '')
    .replace(/\d{4}-\d{2}-\d{2}/g, iso => formatDateUK(iso))
    .replace(/^[-\s\u2013:]+/, '')
    .replace(/[-\u2013:]+\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const safeTitle = cleanTitle || `${report.type || 'Report'} \u2013 ${formatDateUK(report.date)}`;
  const { id: _id, authorId: _a, ...data } = report;
  const fileName = makeReportFileName(report);
  await exportToWord(safeTitle, data, fileName, branding);
};


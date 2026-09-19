import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

const EMERALD = [5, 150, 105];
const SLATE_800 = [30, 41, 59];
const SLATE_600 = [71, 85, 105];
const SLATE_500 = [100, 116, 139];
const LINE = [226, 232, 240];

const parseDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
};

/**
 * Builds the PDF and returns the jsPDF instance (useful for testing).
 */
export function buildItemPdf({ item, userProfile, type }) {
    const isPrescription = type === 'Prescription';
    const doctorName = item.doctorId?.name || 'N/A';
    const doctorSpecialization = item.doctorId?.specialization || 'N/A';
    const dateObj = parseDate(item.completedAt || item.requestedAt || item.date);
    const displayDate = dateObj ? format(dateObj, 'MMMM d, yyyy') : 'N/A';
    const reportTitle = item.testName || item.title || 'Untitled';

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 48;
    const contentW = pageW - margin * 2;
    let y = margin;

    const ensureSpace = (needed) => {
        if (y + needed > pageH - margin - 20) {
            doc.addPage();
            y = margin;
        }
    };

    // Draws (wrapped) text at the current y and moves y down
    const write = (str, { size = 11, bold = false, color = SLATE_600, x = margin, indent = 0, gap = 4 } = {}) => {
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(size);
        doc.setTextColor(...color);
        const lineH = size * 1.4;
        const lines = doc.splitTextToSize(String(str ?? ''), contentW - indent);
        lines.forEach((line) => {
            ensureSpace(lineH);
            doc.text(line, x + indent, y + size);
            y += lineH;
        });
        y += gap;
    };

    const rule = () => {
        doc.setDrawColor(...LINE);
        doc.setLineWidth(1);
        doc.line(margin, y, pageW - margin, y);
        y += 12;
    };

    // ---------- Header ----------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...SLATE_800);
    doc.text(`${type} Details`, margin, y + 20);

    doc.setTextColor(...EMERALD);
    doc.setFontSize(18);
    doc.text('Curely', pageW - margin, y + 20, { align: 'right' });
    y += 30;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...SLATE_500);
    doc.text(`Issued on ${displayDate}`, margin, y + 10);
    y += 22;
    rule();
    y += 4;

    // ---------- Patient / Provider ----------
    const column = (lines, x, align) => {
        let cy = y;
        lines.forEach(({ text, size, bold, color }) => {
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            doc.setFontSize(size);
            doc.setTextColor(...color);
            doc.splitTextToSize(String(text ?? ''), contentW / 2 - 10).forEach((l) => {
                doc.text(l, x, cy + size, { align });
                cy += size * 1.45;
            });
        });
        return cy;
    };

    const leftEnd = column(
        [
            { text: 'Patient', size: 10, color: SLATE_500 },
            { text: userProfile?.name || 'N/A', size: 12, bold: true, color: SLATE_800 },
            { text: `Med ID: ${userProfile?.med_id || 'N/A'}`, size: 10, color: SLATE_600 },
        ],
        margin,
        'left'
    );
    const rightEnd = column(
        [
            { text: 'Provider', size: 10, color: SLATE_500 },
            { text: `Dr. ${doctorName}`, size: 12, bold: true, color: SLATE_800 },
            { text: doctorSpecialization, size: 10, color: SLATE_600 },
        ],
        pageW - margin,
        'right'
    );
    y = Math.max(leftEnd, rightEnd) + 12;
    rule();
    y += 6;

    // ---------- Body ----------
    if (isPrescription) {
        write('Medicines', { size: 13, bold: true, color: SLATE_800, gap: 8 });

        const medicines = Array.isArray(item.medicines) ? item.medicines : [];
        if (medicines.length === 0) {
            write('No medicines listed.', { size: 11 });
        }
        medicines.forEach((med, i) => {
            const head = `${i + 1}. ${med.name || 'Unnamed'}${med.dosage ? ` (${med.dosage})` : ''}`;
            write(head, { size: 12, bold: true, color: SLATE_800, gap: 1 });
            if (med.instructions) {
                write(`- ${med.instructions}`, { size: 11, indent: 16, gap: 8 });
            } else {
                y += 6;
            }
        });

        if (item.notes) {
            y += 6;
            write('Notes', { size: 13, bold: true, color: SLATE_800, gap: 6 });
            write(item.notes, { size: 11 });
        }
    } else {
        write(`Report: ${reportTitle}`, { size: 13, bold: true, color: SLATE_800, gap: 8 });
        write('Summary:', { size: 11, bold: true, gap: 2 });
        write(item.summary || 'No summary provided.', { size: 11, color: SLATE_800, gap: 10 });

        if (item.fileUrl) {
            ensureSpace(16);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(...EMERALD);
            doc.textWithLink('View Attached File', margin, y + 11, { url: item.fileUrl });
            y += 20;
        }
    }

    // ---------- Footer on every page ----------
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...SLATE_500);
        doc.text('Generated by Curely', margin, pageH - 28);
        doc.text(`Page ${p} of ${pageCount}`, pageW - margin, pageH - 28, { align: 'right' });
    }

    return doc;
}

/**
 * Builds the PDF and triggers a real file download in the browser.
 */
export function downloadItemPdf({ item, userProfile, type }) {
    const doc = buildItemPdf({ item, userProfile, type });
    const dateObj = parseDate(item.completedAt || item.requestedAt || item.date) || new Date();
    const fileName = `${type}_${format(dateObj, 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
}
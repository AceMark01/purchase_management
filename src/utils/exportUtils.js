import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from './formatters';

export const exportToExcel = (data, columns, filename = 'export') => {
  const rows = data.map((row) =>
    columns.reduce((acc, col) => {
      acc[col.header] = row[col.key] ?? '';
      return acc;
    }, {})
  );
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (data, columns, title = 'Report', filename = 'export') => {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated: ${formatDate(new Date())}`, 14, 22);
  autoTable(doc, {
    startY: 28,
    head: [columns.map((c) => c.header)],
    body: data.map((row) => columns.map((c) => row[c.key] ?? '')),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [25, 118, 210], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  doc.save(`${filename}.pdf`);
};

export const printTable = (data, columns, title = 'Report') => {
  const rows = data.map((row) =>
    `<tr>${columns.map((c) => `<td>${row[c.key] ?? ''}</td>`).join('')}</tr>`
  ).join('');
  const html = `
    <html><head><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #ddd;padding:6px;text-align:left}
    th{background:#1976d2;color:#fff}
    tr:nth-child(even){background:#f5f5f5}
    h2{color:#1976d2}</style></head>
    <body><h2>${title}</h2>
    <p>Generated: ${formatDate(new Date())}</p>
    <table><thead><tr>${columns.map((c) => `<th>${c.header}</th>`).join('')}</tr></thead>
    <tbody>${rows}</tbody></table></body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.print();
};

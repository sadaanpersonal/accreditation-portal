import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type Cell = string | number;
export interface TableData { headers: string[]; rows: Cell[][] }

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCsv(filename: string, { headers, rows }: TableData) {
  const esc = (v: Cell) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map(r => r.map(esc).join(",")).join("\n");
  triggerDownload(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
}

export function exportXlsx(filename: string, { headers, rows }: TableData, sheet = "Data") {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportPdf(filename: string, title: string, { headers, rows }: TableData) {
  const doc = new jsPDF({ orientation: headers.length > 5 ? "landscape" : "portrait" });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()} · ${rows.length} records`, 14, 22);
  autoTable(doc, {
    head: [headers],
    body: rows.map(r => r.map(c => String(c ?? ""))),
    startY: 27,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [107, 15, 43], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 245, 247] },
  });
  doc.save(`${filename}.pdf`);
}

export type ExportFormat = "csv" | "xlsx" | "pdf";

export function runExport(format: ExportFormat, filename: string, title: string, data: TableData) {
  if (format === "csv") exportCsv(filename, data);
  else if (format === "xlsx") exportXlsx(filename, data);
  else exportPdf(filename, title, data);
}

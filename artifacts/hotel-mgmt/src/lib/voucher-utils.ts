const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  let str = "";
  if (h) str += ones[h] + " Hundred";
  if (r) str += (h ? " " : "") + twoDigits(r);
  return str;
}

export function numberToWords(num: number): string {
  if (num === 0) return "Zero Rupees Only";

  const isNegative = num < 0;
  num = Math.abs(num);
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  const units = [
    { value: 10000000, name: "Crore" },
    { value: 100000, name: "Lakh" },
    { value: 1000, name: "Thousand" },
    { value: 100, name: "Hundred" },
  ];

  let words = "";
  let remaining = rupees;

  for (const unit of units) {
    const count = Math.floor(remaining / unit.value);
    if (count > 0) {
      words += threeDigits(count) + " " + unit.name + " ";
      remaining %= unit.value;
    }
  }

  if (remaining > 0) {
    words += twoDigits(remaining);
  }

  words = words.trim();

  let result = "";
  if (isNegative) result += "Minus ";
  result += words + " Rupees";
  if (paise > 0) {
    result += " and " + twoDigits(paise) + " Paise";
  }
  result += " Only";

  return result;
}

export function formatVoucherDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function generateVoucherNumber(type: "payment" | "receipt", lastNumber?: string): string {
  const prefix = type === "receipt" ? "RV" : "PV";
  if (!lastNumber) return `${prefix}-000001`;
  const match = lastNumber.match(/-(\d+)/);
  if (!match) return `${prefix}-000001`;
  const next = parseInt(match[1]) + 1;
  return `${prefix}-${String(next).padStart(6, "0")}`;
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const csv = [
    headers.join(","),
    ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToExcel(filename: string, headers: string[], rows: (string | number)[][]): void {
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head><meta charset="utf-8"></head>
    <body><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

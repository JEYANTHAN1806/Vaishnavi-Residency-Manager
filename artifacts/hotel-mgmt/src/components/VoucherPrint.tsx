import { formatVoucherDate } from "@/lib/voucher-utils";

export interface VoucherPrintData {
  voucherNumber: string;
  type: "payment" | "receipt";
  name: string;
  reason: string;
  amount: number;
  amountInWords: string | null;
  date: string;
  approvedBy: string | null;
  receivedBy: string | null;
  remarks: string | null;
}

function VoucherHalf({ data, label }: { data: VoucherPrintData; label: string }) {
  const isPayment = data.type === "payment";
  return (
    <div className="voucher-half">
      <div className="voucher-header">
        <div className="hotel-name">Vaishnavi Residency</div>
        <div className="voucher-title">{isPayment ? "PAYMENT VOUCHER" : "RECEIPT VOUCHER"}</div>
        <div className="voucher-label">{label}</div>
      </div>
      <div className="voucher-meta">
        <div><span className="meta-label">Voucher No:</span> {data.voucherNumber}</div>
        <div><span className="meta-label">Date:</span> {formatVoucherDate(data.date)}</div>
      </div>
      <table className="voucher-table">
        <tbody>
          <tr>
            <td className="field-label">{isPayment ? "Paid To" : "Received From"}</td>
            <td className="field-value">{data.name}</td>
          </tr>
          <tr>
            <td className="field-label">Reason</td>
            <td className="field-value">{data.reason}</td>
          </tr>
          <tr>
            <td className="field-label">Amount (in figures)</td>
            <td className="field-value">₹ {data.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td className="field-label">Amount (in words)</td>
            <td className="field-value">{data.amountInWords || "—"}</td>
          </tr>
          {data.remarks && (
            <tr>
              <td className="field-label">Remarks</td>
              <td className="field-value">{data.remarks}</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="voucher-signatures">
        <div className="sig-block">
          <div className="sig-line"></div>
          <div className="sig-label">{isPayment ? "Approved By" : "Received By"}</div>
          <div className="sig-name">{isPayment ? data.approvedBy || "" : data.receivedBy || ""}</div>
        </div>
        <div className="sig-block">
          <div className="sig-line"></div>
          <div className="sig-label">{isPayment ? "Received By" : "Authorized By"}</div>
          <div className="sig-name">{isPayment ? data.receivedBy || "" : data.approvedBy || ""}</div>
        </div>
      </div>
    </div>
  );
}

export function VoucherPrintDocument({ data }: { data: VoucherPrintData }) {
  return (
    <div className="voucher-document">
      <VoucherHalf data={data} label="ORIGINAL — FOR OFFICE COPY" />
      <div className="voucher-divider"></div>
      <VoucherHalf data={data} label="DUPLICATE — FOR PARTY COPY" />
    </div>
  );
}

export function printVoucher(data: VoucherPrintData): void {
  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) return;

  const doc = printWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Voucher ${data.voucherNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; color: #1a1a1a; padding: 20px; }
        .voucher-document { width: 210mm; min-height: 297mm; margin: 0 auto; display: flex; flex-direction: column; }
        .voucher-half { padding: 20px 10mm; flex: 1; display: flex; flex-direction: column; }
        .voucher-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .hotel-name { font-size: 22px; font-weight: bold; letter-spacing: 1px; }
        .voucher-title { font-size: 16px; font-weight: bold; margin-top: 4px; text-transform: uppercase; }
        .voucher-label { font-size: 10px; color: #666; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
        .voucher-meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; }
        .meta-label { font-weight: bold; }
        .voucher-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .voucher-table td { padding: 8px 12px; border: 1px solid #ccc; font-size: 12px; }
        .field-label { width: 35%; font-weight: bold; background: #f5f5f5; }
        .field-value { width: 65%; }
        .voucher-signatures { display: flex; justify-content: space-between; margin-top: auto; padding-top: 40px; }
        .sig-block { text-align: center; width: 200px; }
        .sig-line { border-top: 1px solid #333; margin-bottom: 4px; }
        .sig-label { font-size: 11px; font-weight: bold; }
        .sig-name { font-size: 11px; color: #555; margin-top: 2px; }
        .voucher-divider { border-top: 1px dashed #aaa; margin: 0 10mm; }
        @media print {
          body { padding: 0; }
          .voucher-document { width: 210mm; }
          @page { size: A4; margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="voucher-document">
        <div class="voucher-half">
          <div class="voucher-header">
            <div class="hotel-name">Vaishnavi Residency</div>
            <div class="voucher-title">${data.type === "payment" ? "PAYMENT VOUCHER" : "RECEIPT VOUCHER"}</div>
            <div class="voucher-label">ORIGINAL — FOR OFFICE COPY</div>
          </div>
          <div class="voucher-meta">
            <div><span class="meta-label">Voucher No:</span> ${data.voucherNumber}</div>
            <div><span class="meta-label">Date:</span> ${formatVoucherDate(data.date)}</div>
          </div>
          <table class="voucher-table">
            <tr><td class="field-label">${data.type === "payment" ? "Paid To" : "Received From"}</td><td class="field-value">${data.name}</td></tr>
            <tr><td class="field-label">Reason</td><td class="field-value">${data.reason}</td></tr>
            <tr><td class="field-label">Amount (in figures)</td><td class="field-value">₹ ${data.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
            <tr><td class="field-label">Amount (in words)</td><td class="field-value">${data.amountInWords || "—"}</td></tr>
            ${data.remarks ? `<tr><td class="field-label">Remarks</td><td class="field-value">${data.remarks}</td></tr>` : ""}
          </table>
          <div class="voucher-signatures">
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="sig-label">${data.type === "payment" ? "Approved By" : "Received By"}</div>
              <div class="sig-name">${data.type === "payment" ? data.approvedBy || "" : data.receivedBy || ""}</div>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="sig-label">${data.type === "payment" ? "Received By" : "Authorized By"}</div>
              <div class="sig-name">${data.type === "payment" ? data.receivedBy || "" : data.approvedBy || ""}</div>
            </div>
          </div>
        </div>
        <div class="voucher-divider"></div>
        <div class="voucher-half">
          <div class="voucher-header">
            <div class="hotel-name">Vaishnavi Residency</div>
            <div class="voucher-title">${data.type === "payment" ? "PAYMENT VOUCHER" : "RECEIPT VOUCHER"}</div>
            <div class="voucher-label">DUPLICATE — FOR PARTY COPY</div>
          </div>
          <div class="voucher-meta">
            <div><span class="meta-label">Voucher No:</span> ${data.voucherNumber}</div>
            <div><span class="meta-label">Date:</span> ${formatVoucherDate(data.date)}</div>
          </div>
          <table class="voucher-table">
            <tr><td class="field-label">${data.type === "payment" ? "Paid To" : "Received From"}</td><td class="field-value">${data.name}</td></tr>
            <tr><td class="field-label">Reason</td><td class="field-value">${data.reason}</td></tr>
            <tr><td class="field-label">Amount (in figures)</td><td class="field-value">₹ ${data.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
            <tr><td class="field-label">Amount (in words)</td><td class="field-value">${data.amountInWords || "—"}</td></tr>
            ${data.remarks ? `<tr><td class="field-label">Remarks</td><td class="field-value">${data.remarks}</td></tr>` : ""}
          </table>
          <div class="voucher-signatures">
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="sig-label">${data.type === "payment" ? "Approved By" : "Received By"}</div>
              <div class="sig-name">${data.type === "payment" ? data.approvedBy || "" : data.receivedBy || ""}</div>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="sig-label">${data.type === "payment" ? "Received By" : "Authorized By"}</div>
              <div class="sig-name">${data.type === "payment" ? data.receivedBy || "" : data.approvedBy || ""}</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
  doc.close();
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}

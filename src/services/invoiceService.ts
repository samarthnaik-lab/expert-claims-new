import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Function to convert number to words (unchanged)
function convertToWords(n: number): string {
  if (n === 0) return "Zero";
  const units = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const multiplier = ["","Thousand","Million","Billion"];
  let res = "";
  let group = 0;
  while (n > 0) {
    if (n % 1000 !== 0) {
      let value = n % 1000;
      let temp = "";
      if (value >= 100) { temp = units[Math.floor(value / 100)] + " Hundred "; value %= 100; }
      if (value >= 20) { temp += tens[Math.floor(value / 10)] + " "; value %= 10; }
      if (value > 0) temp += units[value] + " ";
      temp += multiplier[group] + " ";
      res = temp + res;
    }
    n = Math.floor(n / 1000);
    group++;
  }
  return res.trim();
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  companyDetails: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gstNumber: string;
    panNumber: string;
    phone: string;
    email: string;
  };
  customerDetails: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gstNumber?: string;
    panNumber?: string;
    phone?: string;
    email?: string;
  };
  shipToDetails: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  caseDetails: {
    description: string;
    caseNumber: string;
  };
  totals: {
    subtotal: number;
    cgstTotal: number;
    sgstTotal: number;
    igstTotal: number;
    grandTotal: number;
  };
  paymentTerms: string;
  notes: string;
}

const defaultCompanyDetails = {
  name: "Expert Claim Solutions India Pvt Ltd.",
  address: "Plot No. 12, Road No. 1, Dharmareddy Colony, Phase II, Vasanth Nagar, Kukatpally",
  city: "Hyderabad",
  state: "Telangana",
  pincode: "500 085",
  gstNumber: "36AAHCE7798M1ZO",
  panNumber: "AAHCE7798M",
  phone: "+91-22-12345678",
  email: "billing@expertclaims.com"
};

export const generateInvoiceNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV/${year}/${month}/${day}/${randomNum}`;
};

export const prepareInvoiceData = (paymentStage: any, caseData: any, customerData: any): InvoiceData => {
  const amount = parseFloat(paymentStage?.phase_amount || '0');
  const subtotal = amount;
  
  // Company GSTIN: 36AAHCE7798M1ZO (State code: 36 = Telangana)
  const companyGSTIN = defaultCompanyDetails.gstNumber;
  const customerGSTIN = customerData?.gstin || customerData?.gstNumber || '';
  
  // Extract first two digits (state code) from GSTINs
  const companyStateCode = companyGSTIN.substring(0, 2);
  const customerStateCode = customerGSTIN.length >= 2 ? customerGSTIN.substring(0, 2) : '';
  
  // Determine if same state or different state
  const isSameState = customerStateCode && companyStateCode === customerStateCode;
  
  // Calculate taxes based on state
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  
  if (isSameState) {
    // Same state: Use CGST and SGST (9% each)
    const cgstRate = 0.09;
    const sgstRate = 0.09;
    cgstTotal = subtotal * cgstRate;
    sgstTotal = subtotal * sgstRate;
  } else {
    // Different state: Use IGST (18%)
    const igstRate = 0.18;
    igstTotal = subtotal * igstRate;
  }
  
  const grandTotal = subtotal + cgstTotal + sgstTotal + igstTotal;

  return {
    invoiceNumber: generateInvoiceNumber(),
    invoiceDate: new Date().toLocaleDateString('en-GB'),
    companyDetails: defaultCompanyDetails,
    customerDetails: {
      name: customerData?.customer_name || 'Customer',
      address: customerData?.address || '456 Corporate Plaza, Business District',
      city: customerData?.city || 'Delhi',
      state: customerData?.state || 'Delhi',
      pincode: customerData?.pincode || '110001',
      gstNumber: customerData?.gstin || customerData?.gst_number,
      panNumber: customerData?.pan || customerData?.pan_number,
      phone: customerData?.mobile_number,
      email: customerData?.email_address
    },
    shipToDetails: {
      name: customerData?.customer_name || 'Customer',
      address: customerData?.address || 'Address not available',
      city: customerData?.city || 'City not available',
      state: customerData?.state || 'State not available',
      pincode: customerData?.pincode || '000000'
    },
    caseDetails: {
      description: paymentStage?.phase_name || 'Service Description',
      caseNumber: caseData?.case_number || 'N/A'
    },
    totals: { subtotal, cgstTotal, sgstTotal, igstTotal, grandTotal },
    paymentTerms: 'Payment due within 30 days of invoice date.',
    notes: 'Thank you for your business!'
  };
};

// Create invoice HTML template (signature removed)
export const createInvoiceHTML = (data: InvoiceData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invoice ${data.invoiceNumber}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;color:#333;background:#fff}
  .invoice-container{width:800px;margin:0 auto;padding:15px;font-size:14px}
  .company-logo{width:100%;max-height:140px;object-fit:contain;display:block;margin-bottom:6px}
  .title-line{border-bottom:1px solid #333;margin-bottom:4px}
  .invoice-title{text-align:center;font-size:22px;font-weight:700;margin-bottom:15px;color:#333}
  table{width:100%;border-collapse:collapse;table-layout:fixed;font-weight:bold}
  th,td{border:1px solid #333;padding:8px;vertical-align:middle}
  thead th{background:#f0f0f0;font-weight:bold;font-size:12px}
  .bg-gray{background:#f0f0f0}
  .text-right{text-align:right}
  .text-center{text-align:center}
  .footer-bar{background:#dc2626;height:2px;margin:10px 0 5px 0}
  .footer-info{text-align:center;font-size:11px;color:#333;line-height:1.1}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
  <div class="invoice-container">
    <img src="https://expert-claims-g8p9.vercel.app/leaders/invoice_image.png" class="company-logo" alt="Logo" />
    <div class="title-line"></div>
    <div class="invoice-title">INVOICE</div>

    <!-- FIRST table: header + parties (50/50) -->
   <table style="margin-bottom:0; border-bottom:none;">

      <colgroup>
        <col style="width:50%"><col style="width:50%">
      </colgroup>
      <tbody>
        <tr style="height:40px;">
          <td class="bg-gray" style="text-align:left; "> 
            <div style="display:flex; align-items:center; height:100%; margin-top:-8px"> 
                INVOICE No: ${data.invoiceNumber} 
            </div>
        </td>
        <td class="bg-gray" style="text-align:right; "> 
            <div style="display:flex; align-items:center; height:100%; margin-top:-8px"> 
                Date: ${data.invoiceDate}
            </div>
        </td>
        </tr>
        <tr class="bg-gray" style="height:40px;">
        <th style="text-align:left; padding-left:8px; padding-top:0px">
            <div style="display:flex; align-items:center; height:100%; margin-top:-8px">Service Receiver</div>
        </th>
        <th style="text-align:left; padding-left:8px; padding-top:0px">
            <div style="display:flex; align-items:center; height:100%; margin-top:-8px">Service Provider</div>
        </th>
        </tr>
        <tr>
          <td style="font-weight:bold">
            ${data.customerDetails.name || ''},<br/>
            ${data.customerDetails.address || ''},<br/>
            ${data.customerDetails.city || ''}<br/>
            ${data.customerDetails.pincode || ''}<br/>
            ${data.customerDetails.state || ''}
          </td>
          <td style="font-weight:bold">
            ${data.companyDetails.name},<br/>
            Plot No. 12, Road No. 1,<br/>
            Dharmareddy Colony,<br/>
            Phase II, Vasanth Nagar, Kukatpally,<br/>
            Hyderabad – 500 085<br/>
            Telangana
          </td>
        </tr>
        <tr>
          <td>GSTIN: ${data.customerDetails.gstNumber || 'N/A'}</td>
          <td>GSTIN: ${data.companyDetails.gstNumber}</td>
        </tr>
        <tr>
          <td>PAN: ${data.customerDetails.panNumber || 'N/A'}</td>
          <td>PAN: ${data.companyDetails.panNumber}</td>
        </tr>
        <tr>
          <td></td>
          <td>SAC Code 997169</td>
        </tr>
      </tbody>
    </table>

    <!-- SECOND table: amounts (immediately adjacent, no extra spacing) -->
    <table style="margin-top:0;">
      <colgroup>
        <col style="width:10%"><col style="width:40%"><col style="width:25%"><col style="width:25%">
      </colgroup>
      <thead>
        <tr class="bg-gray">
          <th>Sl. No.</th>
          <th>Description of Service</th>
          <th></th>
          <th>Professional Fee</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center">1</td>
          <td>${data.caseDetails.description}</td>
          <td class="text-center">Taxable Value</td>
          <td class="text-right">${data.totals.subtotal.toLocaleString('en-IN')}</td>
        </tr>
        ${data.totals.cgstTotal > 0 ? `
        <tr>
          <td></td><td></td>
          <td class="text-center">CGST @9%</td>
          <td class="text-right">${data.totals.cgstTotal.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td></td><td></td>
          <td class="text-center">SGST @9%</td>
          <td class="text-right">${data.totals.sgstTotal.toLocaleString('en-IN')}</td>
        </tr>
        ` : ''}
        ${data.totals.igstTotal > 0 ? `
        <tr>
          <td></td><td></td>
          <td class="text-center">IGST @18%</td>
          <td class="text-right">${data.totals.igstTotal.toLocaleString('en-IN')}</td>
        </tr>
        ` : ''}
        <tr>
          <td></td><td></td>
          <td class="text-center">Gross Amount</td>
          <td class="text-right">${data.totals.grandTotal.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td colspan="4" class="text-center">Amount in Words: ${convertToWords(Math.floor(data.totals.grandTotal))} Rupees Only</td>
        </tr>
      </tbody>
    </table>

    <div style="">
      <div class="font-bold underline">Bank Acct:</div>
      <div class="font-bold">Account No. 42310776320</div>
      <div class="font-bold">Name of Bank: State Bank of India</div>
      <div class="font-bold">Name of Branch: Madeenaguda, Hyderabad</div>
      <div class="font-bold">IFSC Code: SBIN0018655</div>
    </div>

    <div style="width: 100%; display: flex; justify-content: flex-end; margin-top: 40px;">
        <div style="text-align: center; padding: 10px 20px; width: 240px;">
            <div style="font-weight: bold; margin-bottom: 8px;">For ${data.companyDetails.name}</div>
            <div style="margin: 16px 0;">
            <img 
                src="https://expert-claims-g8p9.vercel.app/leaders/signature_stamp.png" 
                alt="Company Stamp" 
                style="width: 480px; height: 120px; object-fit: contain;"
            />
            </div>
            <div style="border-top: 1px solid #000; margin: 8px 0;"></div>
            <div style="font-weight: bold;">Authorized Signatory</div>
        </div>
    </div>

    <div class="footer-bar"></div>
    <div class="footer-info">
      <div>Head Off: ${data.companyDetails.address}, ${data.companyDetails.city} - ${data.companyDetails.pincode}</div>
      <div>Regd Office: Flat No 403, Apex Sai Srinivasam, Rama Krishna Nagar, Madeenaguda, Hyderabad-500 050</div>
      <div>E-Mail Id: support@expertclaims.co.in | Mob No. +919985060600</div>
    </div>
  </div>
</body>
</html>
  `;
};

// Generate PDF using jsPDF and html2canvas, forcing single page by scaling to fit
export const generateAndDownloadInvoice = async (
  paymentStage: any,
  caseData: any,
  customerData: any
): Promise<void> => {
  try {
    const invoiceData = prepareInvoiceData(paymentStage, caseData, customerData);
    const htmlContent = createInvoiceHTML(invoiceData);

    // render hidden DOM to capture
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '800px';
    document.body.appendChild(tempDiv);

    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    document.body.removeChild(tempDiv);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidthMm = 210;
    const pageHeightMm = 295; // approximate printable a4 height in mm (leaving small margin)
    // convert canvas px to mm using a standard: 1px = 0.264583 mm (at 96 DPI)
    const pxToMm = (px: number) => px * 0.264583;
    const imgWidthMm = pxToMm(canvas.width);
    const imgHeightMm = pxToMm(canvas.height);

    // If image is taller than page, scale down proportionally
    let renderWidth = pageWidthMm;
    let renderHeight = (imgHeightMm * renderWidth) / imgWidthMm;
    if (renderHeight > pageHeightMm) {
      const scale = pageHeightMm / renderHeight;
      renderWidth = renderWidth * scale;
      renderHeight = renderHeight * scale;
    }

    // center horizontally by computing x offset
    const xOffset = (pageWidthMm - renderWidth) / 2;
    const yOffset = 0; // start at top; centering vertically on page would cause white margins top/bottom — keep top 0

    pdf.addImage(imgData, 'PNG', xOffset, yOffset, renderWidth, renderHeight);
    pdf.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    printInvoice(paymentStage, caseData, customerData);
  }
};

// Fallback print function (opens in new window)
export const printInvoice = (
  paymentStage: any,
  caseData: any,
  customerData: any
): void => {
  try {
    const invoiceData = prepareInvoiceData(paymentStage, caseData, customerData);
    const htmlContent = createInvoiceHTML(invoiceData);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  } catch (error) {
    console.error('Error printing invoice:', error);
  }
};


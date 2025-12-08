import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Printer, ArrowLeft } from 'lucide-react';
import { generateAndDownloadInvoice, printInvoice, InvoiceData } from '@/services/invoiceService';

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

const InvoicePreview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (location.state?.invoiceData) {
      setInvoiceData(location.state.invoiceData);
    } else {
      navigate('/');
    }
    setIsLoading(false);
  }, [location.state, navigate]);

  const handleDownloadPDF = async () => {
    if (location.state?.paymentStage && location.state?.caseData && location.state?.customerData) {
      await generateAndDownloadInvoice(location.state.paymentStage, location.state.caseData, location.state.customerData);
    }
  };

  const handlePrint = () => {
    if (location.state?.paymentStage && location.state?.caseData && location.state?.customerData) {
      printInvoice(location.state.paymentStage, location.state.caseData, location.state.customerData);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice preview...</p>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No invoice data available</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Invoice Preview</h1>
          <div className="flex space-x-3">
            <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handlePrint} variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        {/* Invoice Preview */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="invoice-preview bg-white text-sm max-w-4xl mx-auto">
              {/* Header with Logo */}
              <div className="mb-4">
                <img
                  src="public/leaders/invoice_image .png"
                  alt="Company Logo"
                  className="w-20 h-16 object-contain"
                />
              </div>

              <div className="border-b border-gray-800 mb-1"></div>
              <div className="text-center text-xl font-bold mb-4">INVOICE</div>

              {/* FIRST TABLE: header + parties in ONE table with colgroup 50/50 */}
              <div className="mb-0">
                <table className="w-full border-collapse border border-gray-800 text-sm" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '50%' }} />
                    <col style={{ width: '50%' }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      <td className="border border-gray-800 p-3 bg-gray-100 text-left align-middle font-bold">INVOICE No: {invoiceData.invoiceNumber}</td>
                      <td className="border border-gray-800 p-3 bg-gray-100 text-right align-middle font-bold">Date: {invoiceData.invoiceDate}</td>
                    </tr>
<tr className="bg-gray-100 h-12">
  <th className="border border-gray-800 border-r-0 text-left font-bold text-sm">
    <div className="flex items-center h-full pl-2">Service Receiver</div>
  </th>
  <th className="border border-gray-800 border-l-0 text-left font-bold text-sm">
    <div className="flex items-center h-full pl-2">Service Provider</div>
  </th>
</tr>







                    <tr>
                      <td className="border border-gray-800 border-r-0 p-2 align-top text-left font-bold text-sm">
                        <div>{invoiceData.customerDetails.name},</div>
                        <div>{invoiceData.customerDetails.address},</div>
                        <div>{invoiceData.customerDetails.city}</div>
                        <div>{invoiceData.customerDetails.pincode}</div>
                        <div>{invoiceData.customerDetails.state}</div>
                      </td>
                      <td className="border border-gray-800 border-l-0 p-2 align-top text-left font-bold text-sm">
                        <div>{invoiceData.companyDetails.name},</div>
                        <div>Plot No. 12, Road No. 1,</div>
                        <div>Dharmareddy Colony,</div>
                        <div>Phase II, Vasanth Nagar, Kukatpally,</div>
                        <div>Hyderabad – 500 085</div>
                        <div>Telangana</div>
                      </td>
                    </tr>

                    <tr>
                      <td className="border border-gray-800 border-r-0 p-2 align-top font-bold text-sm">GSTIN {invoiceData.customerDetails.gstNumber || 'N/A'}</td>
                      <td className="border border-gray-800 border-l-0 p-2 align-top font-bold text-sm">GSTIN {invoiceData.companyDetails.gstNumber}</td>
                    </tr>

                    <tr>
                      <td className="border border-gray-800 border-r-0 p-2 align-top font-bold text-sm">PAN {invoiceData.customerDetails.panNumber || 'N/A'}</td>
                      <td className="border border-gray-800 border-l-0 p-2 align-top font-bold text-sm">PAN {invoiceData.companyDetails.panNumber}</td>
                    </tr>

                    <tr>
                      <td className="border border-gray-800 border-r-0 p-2 align-top font-bold text-sm"></td>
                      <td className="border border-gray-800 border-l-0 p-2 align-top font-bold text-sm">SAC Code 997169</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SECOND TABLE: amounts  */}
              <div className="mb-0 mt-0">
              <table className="w-full border-collapse border-t border-x border-gray-800 text-sm" style={{ tableLayout: 'fixed' }}>


                  <colgroup>
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '40%' }} />
                    <col style={{ width: '25%' }} />
                    <col style={{ width: '25%' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-800 p-1 text-left font-bold">Sl. No.</th>
                      <th className="border border-gray-800 p-1 text-left font-bold">Description of Service</th>
                      <th className="border border-gray-800 p-1 text-left font-bold"></th>
                      <th className="border border-gray-800 p-1 text-left font-bold">Professional Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-800 p-2 text-center align-middle h-6 font-bold text-sm">1</td>
                      <td className="border border-gray-800 p-2 text-left align-middle h-6 font-bold text-sm">{invoiceData.caseDetails.description}</td>
                      <td className="border border-gray-800 p-2 text-center align-middle h-6 font-bold text-sm">Taxable Value</td>
                      <td className="border border-gray-800 p-2 text-right align-middle h-6 font-bold text-sm">{invoiceData.totals.subtotal.toLocaleString('en-IN')}</td>
                    </tr>

                    <tr>
                      <td className="border border-gray-800 p-2"></td>
                      <td className="border border-gray-800 p-2"></td>
                      <td className="border border-gray-800 p-2 text-center font-bold">CGST @9%</td>
                      <td className="border border-gray-800 p-2 text-right font-bold">{invoiceData.totals.cgstTotal.toLocaleString('en-IN')}</td>
                    </tr>

                    <tr>
                      <td className="border border-gray-800 p-2"></td>
                      <td className="border border-gray-800 p-2"></td>
                      <td className="border border-gray-800 p-2 text-center font-bold">SGST @9%</td>
                      <td className="border border-gray-800 p-2 text-right font-bold">{invoiceData.totals.sgstTotal.toLocaleString('en-IN')}</td>
                    </tr>

                    <tr>
                      <td className="border border-gray-800 p-2"></td>
                      <td className="border border-gray-800 p-2"></td>
                      <td className="border border-gray-800 p-2 text-center font-bold">IGST @18%</td>
                      <td className="border border-gray-800 p-2 text-right font-bold">0</td>
                    </tr>

                    <tr>
                      <td className="border border-gray-800 p-2"></td>
                      <td className="border border-gray-800 p-2"></td>
                      <td className="border border-gray-800 p-2 text-center font-bold">Gross Amount</td>
                      <td className="border border-gray-800 p-2 text-right font-bold">{invoiceData.totals.grandTotal.toLocaleString('en-IN')}</td>
                    </tr>

                    <tr>
                      <td className="border border-gray-800  text-center font-bold" colSpan={4}>
                        Amount in Words: {convertToWords(Math.floor(invoiceData.totals.grandTotal))} Rupees Only
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bank Details */}
              <div className="mb-60">
                <div className="font-bold underline mb-1 text-sm">Bank Acct:</div>
                <div className="text-sm space-y-0.5 font-bold">
                  <div className="font-bold">Account No. 42310776320</div>
                  <div className="font-bold">Name of Bank: State Bank of India</div>
                  <div className="font-bold">Name of Branch: Madeenaguda, Hyderabad</div>
                  <div className="font-bold">IFSC Code: SBIN0018655</div>
                </div>
              </div>

              {/* SIGNATURE SECTION  */}

              {/* Footer */}
              <div className="bg-red-600 h-0.5 my-3"></div>
              <div className="text-sm text-gray-800 space-y-0.5 text-center">
                <div>Head Off Plot No. 12 Road No. 1, Dharmareddy Colony, Phase II, Vasanth Nagar, Kukatpally, Hyderabad-500085</div>
                <div>Regd Office: Flat No 403, Apex Sai Srinivasam, Rama Krishna Nagar, Madeenaguda, Hyderabad-500 050</div>
                <div>E-Mail Id: support@expertclaims.co.in: Mob No.+919985060600</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoicePreview;

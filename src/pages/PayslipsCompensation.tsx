
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Calendar, DollarSign } from 'lucide-react';

const PayslipsCompensation = () => {
  const navigate = useNavigate();

  const mockPayslips = [
    {
      id: 'PAY-2024-06',
      fileName: 'Payslip_June_2024.pdf',
      month: 'June 2024',
      fileSize: '245 KB',
      uploadDate: '2024-06-30',
      status: 'available'
    },
    {
      id: 'PAY-2024-05',
      fileName: 'Payslip_May_2024.pdf',
      month: 'May 2024',
      fileSize: '238 KB',
      uploadDate: '2024-05-31',
      status: 'available'
    },
    {
      id: 'PAY-2024-04',
      fileName: 'Payslip_April_2024.pdf',
      month: 'April 2024',
      fileSize: '241 KB',
      uploadDate: '2024-04-30',
      status: 'available'
    }
  ];

  const mockCompensationLetters = [
    {
      id: 'COMP-2024-001',
      fileName: 'Annual_Salary_Revision_2024.pdf',
      title: 'Annual Salary Revision 2024',
      fileSize: '156 KB',
      uploadDate: '2024-01-15',
      status: 'available'
    },
    {
      id: 'COMP-2023-002',
      fileName: 'Performance_Bonus_Letter.pdf',
      title: 'Performance Bonus Letter',
      fileSize: '189 KB',
      uploadDate: '2023-12-20',
      status: 'available'
    },
    {
      id: 'COMP-2023-001',
      fileName: 'Joining_Offer_Letter.pdf',
      title: 'Joining Offer Letter',
      fileSize: '203 KB',
      uploadDate: '2023-06-10',
      status: 'available'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = (file: any, type: string) => {
    // In a real application, this would trigger the actual file download
    console.log(`Downloading ${type}: ${file.fileName}`);
    // For demo purposes, we'll just show an alert
    alert(`Download started for ${file.fileName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-primary-500 backdrop-blur-md shadow-sm border-b border-primary-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 border-2 border-gray-300 hover:border-primary-500 rounded-xl transition-all duration-300"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Payslips & Compensation
                </h1>
                <p className="text-sm text-white/80 font-medium">Download your payslips and compensation documents</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="payslips" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-1">
            <TabsTrigger value="payslips" className="rounded-lg font-semibold">Payslips</TabsTrigger>
            <TabsTrigger value="compensation" className="rounded-lg font-semibold">Compensation Letters</TabsTrigger>
          </TabsList>

          <TabsContent value="payslips" className="space-y-4">
            <div className="grid gap-4">
              {mockPayslips.map((payslip) => (
                <Card key={payslip.id} className="border-none shadow-xl bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{payslip.fileName}</h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>{payslip.month}</span>
                            <span>•</span>
                            <span>{payslip.fileSize}</span>
                            <span>•</span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {payslip.uploadDate}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={`${getStatusColor(payslip.status)} px-3 py-1 rounded-full font-medium`}>
                          {payslip.status}
                        </Badge>
                        <Button 
                          size="sm" 
                          onClick={() => handleDownload(payslip, 'payslip')}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="compensation" className="space-y-4">
            <div className="grid gap-4">
              {mockCompensationLetters.map((letter) => (
                <Card key={letter.id} className="border-none shadow-xl bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-emerald-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{letter.fileName}</h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>{letter.title}</span>
                            <span>•</span>
                            <span>{letter.fileSize}</span>
                            <span>•</span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {letter.uploadDate}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={`${getStatusColor(letter.status)} px-3 py-1 rounded-full font-medium`}>
                          {letter.status}
                        </Badge>
                        <Button 
                          size="sm" 
                          onClick={() => handleDownload(letter, 'compensation')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-300"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PayslipsCompensation;

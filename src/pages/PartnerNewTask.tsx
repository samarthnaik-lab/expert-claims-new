import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, FileText, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { CaseTypeService, CaseType } from "@/services/caseTypeService";
import {
  TaskService,
  TaskCreateRequest,
  TaskCustomer,
} from "@/services/taskService";
import mammoth from "mammoth";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const PartnerNewTask = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    task_summary: "",
    description: "",
    caseType: "",
    comments: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [isLoadingCaseTypes, setIsLoadingCaseTypes] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [customDocumentType, setCustomDocumentType] = useState("");
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Document types for partners
  const documentTypes = [
    { id: "1", name: "Insurance Policy", isMandatory: false },
    { id: "2", name: "Other", isMandatory: false },
  ];

  // Case types for partners
  const insuranceCaseTypes = [
    { case_type_id: 1, case_type_name: "Fire Insurance" },
    { case_type_id: 2, case_type_name: "Industrial All Risks Insurance" },
    { case_type_id: 3, case_type_name: "Marine Insurance" },
    { case_type_id: 4, case_type_name: "Engineering Insurance" },
    { case_type_id: 5, case_type_name: "Liability Insurance" }
  ];

  // Fetch case types on component mount
  useEffect(() => {
    fetchCaseTypes();
  }, []);

  const fetchCaseTypes = async () => {
    setIsLoadingCaseTypes(true);
    try {

        // Get session details for headers
        // const sessionStr = localStorage.getItem('expertclaims_session');
        // let sessionId = '';
        // let jwtToken = '';
  
        // if (sessionStr) {
        //   const session = JSON.parse(sessionStr);
        //   sessionId = session.sessionId || '';
        //   jwtToken = session.jwtToken || '';
        // }
  
        // // Use fallback values if session not available
        // sessionId = sessionId || 'efd005c8-d9a1-4cfa-adeb-1ca2a7f13775';
        // jwtToken = jwtToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjM0IiwiaWF0IjoxNzU2NTUwODUwfQ.Kmh5wQS9CXpRK0TmBXlJJhGlfr9ulMx8ou5nCk7th8g';
  
        // const result = await CaseTypeService.getCaseTypes(sessionId, jwtToken);
        // setCaseTypes(result);
      // Use hardcoded insurance case types


      setCaseTypes(insuranceCaseTypes);
    } catch (error) {
      console.error("Error setting case types:", error);
      toast({
        title: "Error",
        description: "Failed to load case types",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCaseTypes(false);
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Function to convert Word document to PDF
  const convertWordToPDF = async (file: File): Promise<File> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Check if it's a Word document
        const isWordDoc = 
          file.type === 'application/msword' || 
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.name.endsWith('.doc') || 
          file.name.endsWith('.docx');

        if (!isWordDoc) {
          // Not a Word document, return as is
          resolve(file);
          return;
        }

        toast({
          title: "Converting...",
          description: "Converting Word document to PDF...",
        });

        // Read the file as array buffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Convert Word document to HTML using mammoth
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        
        // Create a temporary div to render the HTML
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '210mm'; // A4 width
        tempDiv.style.padding = '20mm';
        tempDiv.style.fontSize = '12pt';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        tempDiv.innerHTML = html;
        document.body.appendChild(tempDiv);

        // Wait a bit for the content to render
        await new Promise(resolve => setTimeout(resolve, 100));

        // Convert HTML to canvas
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          logging: false,
        });

        // Remove temporary div
        document.body.removeChild(tempDiv);

        // Convert canvas to PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Convert PDF to Blob and then to File
        const pdfBlob = pdf.output('blob');
        const pdfFile = new File(
          [pdfBlob],
          file.name.replace(/\.(doc|docx)$/i, '.pdf'),
          { type: 'application/pdf' }
        );

        toast({
          title: "Converted",
          description: "Word document converted to PDF successfully",
        });

        resolve(pdfFile);
      } catch (error) {
        console.error('Error converting Word to PDF:', error);
        toast({
          title: "Conversion Error",
          description: "Failed to convert Word document. Original file will be used.",
          variant: "destructive",
        });
        // Return original file if conversion fails
        resolve(file);
      }
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Document type is only required if user is uploading files
    if (!selectedDocumentType) {
      toast({
        title: "Error",
        description: "Please select a document type before uploading files",
        variant: "destructive",
      });
      return;
    }
    
    const files = Array.from(e.target.files || []);
    
    // Convert Word documents to PDF
    const convertedFiles = await Promise.all(
      files.map(async (file) => {
        const isWordDoc = 
          file.type === 'application/msword' || 
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.name.endsWith('.doc') || 
          file.name.endsWith('.docx');
        
        if (isWordDoc) {
          return await convertWordToPDF(file);
        }
        return file;
      })
    );
    
    setSelectedFiles((prev) => [...prev, ...convertedFiles]);
    toast({
      title: "Files Added",
      description: `${files.length} file(s) have been added${files.some(f => f.type.includes('word') || f.name.endsWith('.doc') || f.name.endsWith('.docx')) ? ' (Word files converted to PDF)' : ''}`,
    });
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    // Document type is only required if user is uploading files
    if (!selectedDocumentType) {
      toast({
        title: "Error",
        description: "Please select a document type before uploading files",
        variant: "destructive",
      });
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      
      // Validate file types
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      const invalidFiles = files.filter(file => !validTypes.includes(file.type));
      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid File Type",
          description: "Please upload PDF, JPG, PNG, DOC, DOCX, or TXT files only",
          variant: "destructive",
        });
        return;
      }

      // Convert Word documents to PDF
      const convertedFiles = await Promise.all(
        files.map(async (file) => {
          const isWordDoc = 
            file.type === 'application/msword' || 
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.name.endsWith('.doc') || 
            file.name.endsWith('.docx');
          
          if (isWordDoc) {
            return await convertWordToPDF(file);
          }
          return file;
        })
      );

      setSelectedFiles((prev) => [...prev, ...convertedFiles]);
      toast({
        title: "Files Added",
        description: `${files.length} file(s) have been added${files.some(f => f.type.includes('word') || f.name.endsWith('.doc') || f.name.endsWith('.docx')) ? ' (Word files converted to PDF)' : ''}`,
      });
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getPartnerFullName = (): string => {
    try {
      // Get partner details from localStorage (partner-status-check API response)
      const partnerDetailsStr = localStorage.getItem("partner_details");
      if (partnerDetailsStr) {
        const partnerDetails = JSON.parse(partnerDetailsStr);
        console.log("Partner details from localStorage:", partnerDetails);
        
        // Access the nested structure: partner_details.data.partner_info
        const partnerInfo = partnerDetails?.data?.partner_info;
        if (partnerInfo) {
          const firstName = partnerInfo.first_name || 'Sam';
          const lastName = partnerInfo.last_name || 'Naik';
          const fullName = `${firstName} ${lastName}`; // "Sam Naik"
          
          console.log("Partner full name:", fullName);
          return fullName;
        }
      }

      console.log("No partner name found, using fallback");
      return 'Sam Naik';
    } catch (error) {
      console.error('Error getting partner name:', error);
      return 'Sam Naik';
    }
  };

  const getDocumentTypeName = (): string => {
    if (selectedDocumentType === "2" && customDocumentType.trim()) {
      return customDocumentType.trim();
    }
    const documentType = documentTypes.find(type => type.id === selectedDocumentType);
    return documentType ? documentType.name : "Unknown";
  };

  const createTaskData = (): TaskCreateRequest => {
    const selectedCaseType = caseTypes.find(
      (type) => type.case_type_name === formData.caseType
    );
    const caseTypeId = selectedCaseType
      ? selectedCaseType.case_type_id.toString()
      : formData.caseType;

    const partnerFullName = getPartnerFullName(); // Get partner's full name

    const taskData = {
      case_Summary: formData.task_summary,
      case_description: formData.description,
      caseType: caseTypeId,
      assignedTo: "1", // Default assignment
      priority: "medium",
      ticket_Stage: "analysis",
      partner_id: "",
      dueDate: "",
      stakeholders: [],
      customer: {
        firstName: "",
        lastName: "",
      } as TaskCustomer,
      comments: formData.comments,
      internal: "false",
      payments: [],
      updatedby_name: partnerFullName, // Partner's full name (e.g., "Sam Naik")
      createdby_name: partnerFullName, // Partner's full name (e.g., "Sam Naik")
    };

    return taskData;
  };

  const handleSubmitClick = () => {
    setShowSubmitConfirmation(true);
  };

  const handleSubmitConfirm = async (submitAnother: boolean) => {
    setShowSubmitConfirmation(false);
    
    // Call handleSubmit and check if it was successful
    const success = await handleSubmit();
    
    // Only proceed if submission was successful
    if (!success) {
      return; // Stay on the same page if validation failed
    }
    
    if (submitAnother) {
      // Submit the policy and stay on the same page
      toast({
        title: "Policy Submitted",
        description: "Policy submitted successfully. You can submit another policy.",
      });
      return;
    }
    
    // Submit the policy and navigate to dashboard
    navigate("/partner-dashboard");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (!formData.task_summary.trim()) {
        toast({
          title: "Error",
          description: "Task summary is required",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return false;
      }

      if (!formData.caseType || formData.caseType.trim() === "") {
        toast({
          title: "Error",
          description: "Service Type field is required. Please select a service type.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return false;
      }

      // Document type validation is optional - only validate if user has selected a document type
      if (selectedDocumentType && selectedDocumentType === "2" && !customDocumentType.trim()) {
        toast({
          title: "Error",
          description: "Please specify the document type name",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return false;
      }

      const taskData = createTaskData();
      console.log("Partner task data:", taskData);

      // Get session data
      const sessionStr = localStorage.getItem("expertclaims_session");
      const session = sessionStr ? JSON.parse(sessionStr) : {};
      const sessionId = session.sessionId || "fddc661a-dfb4-4896-b7b1-448e1adf7bc2";
      const jwtToken = session.jwtToken || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiIsInBhc3N3b3JkIjoiIiwiaWF0IjoxNzU2NTQ3MjAzfQ.rW9zIfo1-B_Wu2bfJ8cPai0DGZLfaapRE7kLt2dkCBc";

      const result = await TaskService.createTask(taskData, sessionId, jwtToken);
      console.log("Task creation result:", result);

      // Call partner backlog entry API
      try {
        // Get case type ID
        const selectedCaseType = caseTypes.find(
          (type) => type.case_type_name === formData.caseType
        );
        const caseTypeId = selectedCaseType ? selectedCaseType.case_type_id : null;

        // Get partner details from the API called earlier
        let partnerDetails = null;
        const partnerDetailsStr = localStorage.getItem("partner_details");
        if (partnerDetailsStr) {
          try {
            partnerDetails = JSON.parse(partnerDetailsStr);
            console.log("Using partner details from API:", partnerDetails);
          } catch (error) {
            console.error("Error parsing partner details:", error);
          }
        }

        // Get logged in user details from localStorage
        let loggedInUserId = "";
        let loggedInPartnerId = "";
        
        const possibleKeys = [
          "expertclaims_user_details",
          "expertclaims_session", 
          "user_details",
          "session"
        ];
        
        for (const key of possibleKeys) {
          const dataStr = localStorage.getItem(key);
          if (dataStr) {
            try {
              const data = JSON.parse(dataStr);
              const userData = Array.isArray(data) ? data[0] : data;
              
              if (userData) {
                loggedInUserId = userData.user_id || userData.id || userData.userId || userData.partner_id || "";
                loggedInPartnerId = userData.partner_id || userData.partnerId || userData.id || "";
                
                if (loggedInUserId || loggedInPartnerId) {
                  console.log("Found user data:", { loggedInUserId, loggedInPartnerId });
                  break;
                }
              }
            } catch (error) {
              console.error(`Error parsing ${key}:`, error);
            }
          }
        }

        // Use partner details from API if available, otherwise use session data
        const partnerId = parseInt(partnerDetails?.partner_id || partnerDetails?.user_id || loggedInPartnerId || "3");
        const createdBy = parseInt(loggedInUserId || partnerDetails?.user_id || partnerDetails?.partner_id || "3");
        const updatedBy = parseInt(loggedInUserId || partnerDetails?.user_id || partnerDetails?.partner_id || "3");

        // Create FormData to send everything as form data (including binary files)
        const formDataPayload = new FormData();
        
        // Get partner full name and extract first/last name
        const partnerFullName = getPartnerFullName();
        const nameParts = partnerFullName.trim().split(/\s+/);
        const customerFirstName = nameParts[0] || "John";
        const customerLastName = nameParts.slice(1).join(" ") || "Doe";
        
        // Add all the backlog data as form fields (matching curl command exactly)
        formDataPayload.append("case_type_id", caseTypeId?.toString() || "1");
        formDataPayload.append("task_summary", formData.task_summary || "");
        formDataPayload.append("case_description", formData.description || "");
        formDataPayload.append("backlog_referring_partner_id", partnerId.toString());
        formDataPayload.append("backlog_referral_date", new Date().toISOString().split('T')[0]);
        formDataPayload.append("created_by", createdBy.toString());
        formDataPayload.append("updated_by", updatedBy.toString());
        formDataPayload.append("department", "partner");
        formDataPayload.append("comment_text", formData.comments || "");
        formDataPayload.append("customer_first_name", customerFirstName);
        formDataPayload.append("customer_last_name", customerLastName);
        formDataPayload.append("document_count", selectedFiles.length.toString());
        formDataPayload.append("selected_document_type", selectedDocumentType || "");
        formDataPayload.append("selected_document_type_name", selectedDocumentType ? getDocumentTypeName() : "");
        
        // Add partner name fields
        formDataPayload.append("createdby_name", partnerFullName);
        formDataPayload.append("updatedby_name", partnerFullName);
        formDataPayload.append("partner_name", partnerFullName);

        // Add documents as binary files
        selectedFiles.forEach((file, index) => {
          formDataPayload.append(`document_${index}`, file);
          formDataPayload.append(`document_${index}_name`, file.name);
          formDataPayload.append(`document_${index}_type`, selectedDocumentType || "");
          formDataPayload.append(`document_${index}_type_name`, getDocumentTypeName());
        });

        console.log("Sending FormData with binary documents:", {
          case_type_id: caseTypeId,
          backlog_referring_partner_id: partnerId,
          document_count: selectedFiles.length,
          customer_first_name: customerFirstName,
          customer_last_name: customerLastName,
          partner_name: partnerFullName,
          files: selectedFiles.map(f => f.name)
        });

        const backlogResponse = await fetch(
          "http://localhost:3000/api/partnerbacklogentry",
          {
            method: "POST",
            // Don't set Content-Type header - browser will set it automatically with boundary for FormData
            body: formDataPayload,
          }
        );

        if (backlogResponse.ok) {
          const responseData = await backlogResponse.json();
          console.log("Partner backlog entry created successfully:", responseData);
        } else {
          const errorData = await backlogResponse.text();
          console.error("Failed to create partner backlog entry:", backlogResponse.status, errorData);
        }
      } catch (backlogError) {
        console.error("Error creating partner backlog entry:", backlogError);
      }

      // Return true to indicate successful submission
      return true;
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-500 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg rounded-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
            <CardTitle className="text-2xl font-bold">Upload Document </CardTitle>
            <Button
              variant="outline"
              onClick={() => navigate("/partner-dashboard")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardHeader>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Fill in the details below to Upload  Policy.
          </CardDescription>
          <CardContent className="space-y-6">
            {/* Task Summary */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="task_summary">Policy Summary *</Label>
                <Input
                  type="text"
                  id="task_summary"
                  name="task_summary"
                  value={formData.task_summary}
                  onChange={handleInputChange}
                  placeholder="Enter a brief summary of the task"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter a detailed description of the task"
                  rows={4}
                />
              </div>
            </div>

            {/* Case Type */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="caseType">Service Type *</Label>
                <Select
                  value={formData.caseType}
                  onValueChange={(value) => handleSelectChange("caseType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCaseTypes ? (
                      <SelectItem value="loading" disabled>
                        Loading case types...
                      </SelectItem>
                    ) : caseTypes.length > 0 ? (
                      caseTypes
                        .filter((type) => type && type.case_type_name && type.case_type_name.trim() !== "")
                        .map((type) => (
                          <SelectItem key={type.case_type_id} value={type.case_type_name}>
                            {type.case_type_name}
                          </SelectItem>
                        ))
                    ) : (
                      <SelectItem value="no-types" disabled>
                        No case types available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            

            {/* Document Type Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Document Type (Optional)</h3>
              <div>
                <Label htmlFor="documentType">Select Document Type</Label>
                <Select
                  value={selectedDocumentType}
                  onValueChange={(value) => {
                    setSelectedDocumentType(value);
                    if (value !== "2") {
                      setCustomDocumentType("");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} {type.isMandatory && <span className="text-red-500">*</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Custom Document Type Input - Show only when "Other" is selected */}
              {selectedDocumentType === "2" && (
                <div>
                  <Label htmlFor="customDocumentType">Specify Document Type *</Label>
                  <Input
                    type="text"
                    id="customDocumentType"
                    value={customDocumentType}
                    onChange={(e) => setCustomDocumentType(e.target.value)}
                    placeholder="Enter the document type name"
                    required
                  />
                </div>
              )}
            </div>





            {/* Upload Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Upload Documents (Optional) {selectedDocumentType && `- ${getDocumentTypeName()}`}
              </h3>
              <div className="space-y-4">
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                    dragActive
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-300 bg-gray-50/50 hover:border-primary-500"
                  }`}
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full">
                      <Upload className={`h-6 w-6 ${dragActive ? "text-primary-600" : "text-primary-600"}`} />
                    </div>
                    <div>
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-primary-600 hover:text-primary-700 font-medium">
                          {dragActive ? "Drop files here" : "Click to upload documents"}
                        </span>
                        <span className="text-gray-500 ml-2">{dragActive ? "" : "or drag and drop"}</span>
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      PDF, DOC, DOCX, JPG, PNG, TXT files are supported
                    </p>
                  </div>
                </div>



                {/* Comments */}
<div className="space-y-4">
              <div>
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  placeholder="Enter any additional comments"
                  rows={4}
                />
              </div>
            </div>


                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">
                      Selected Files: {formData.caseType && `(${formData.caseType})`}
                    </h4>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full">
                              <FileText className="h-4 w-4 text-primary-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button
                variant="outline"
                onClick={() => navigate("/partner-dashboard")}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitClick}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
              >
                {isSubmitting ? "Submitting Task..." : "Submit Task"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Submit Task
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Is there any other policy document you have to submit?
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => handleSubmitConfirm(false)}
                    className="flex-1"
                  >
                    No, Go to Dashboard
                  </Button>
                  <Button
                    onClick={() => handleSubmitConfirm(true)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Yes, Submit Another
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerNewTask;

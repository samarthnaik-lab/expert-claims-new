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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, X, Upload, FileText, ArrowLeft, Check, ChevronsUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { useAuth } from "@/contexts/AuthContext";
import { CaseTypeService, CaseType } from "@/services/caseTypeService";
import { EmployeeService, Employee } from "@/services/employeeService";
import { DocumentService, Document } from "@/services/documentService";
import { CustomerService, Customer } from "@/services/customerService";
import {
  TaskService,
  TaskCreateRequest,
  TaskStakeholder,
  TaskCustomer,
  TaskPayment,
} from "@/services/taskService";
import mammoth from "mammoth";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Password hashing function (same as Login.tsx)
const hashPassword = (password: string): string => {
  let hash = 0;
  if (password.length === 0) return hash.toString();

  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // force 32-bit int
  }

  // Expand the hash by repeating/mixing and encoding
  const base = Math.abs(hash).toString(36);
  const longHash = Array(8) // repeat 8x for length
    .fill(base)
    .map((b, i) => b + ((hash >> i) & 0xff).toString(36))
    .join("");

  return `$2b$10$${longHash}`;
};

type TaskStatus = "new" | "in_progress" | "completed" | "cancelled";
type TicketStage =
  | "analysis"
  | "development"
  | "testing"
  | "deployment"
  | "closed"
  | "review"
  | "approval";
type TaskPriority = "low" | "medium" | "high" | "urgent";

interface Stakeholder {
  id: string;
  name: string;
  contact: string;
  contact_email: string;
  role: string;
  notes: string;
}

interface Comment {
  id: string;
  text: string;
  isInternal: boolean;
}

interface PaymentStage {
  id: string;
  phase: string;
  point_when_payment_to_be_received: string;
  to_be_paid_date: string;
  amount: number;
  phase_name: string;
  case_type: string;
  phase_amount: number;
  due_date: string;
  status: string;
  payment_date: string | null;
  payment_method: string | null;
  transaction_reference: string | null;
  invoice_number: string | null;
  notes: string;
  created_by: number;
  created_time: string;
}

interface PaymentFormData {
  phase: string;
  point_when_payment_to_be_received: string;
  to_be_paid_date: string;
  amount: number;
  phase_name: string;
  case_type: string;
  phase_amount: number;
  due_date: string;
  status: string;
  payment_date: string | null;
  payment_method: string | null;
  transaction_reference: string | null;
  invoice_number: string | null;
  notes: string;
}

interface User {
  id: string;
  full_name: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

// Static payment phases for all case types
const staticPaymentPhases = [
  "Agreement with the party",
  "Filing case with Ombudsman",
  "Claim settlement (on receipt of claim amount by the party)",
];

const NewTask = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    task_summary: "",
    service_amount: "",
    claims_amount: "",
    priority: "medium" as TaskPriority,
    ticket_stage: "Under process",
    current_status: "new" as TaskStatus,
    due_date: "",
    assigned_to: "",
    customer_id: "",
    reviewer_id: "",
    approver_id: "",
    estimatedDuration: "",
    caseType: "",
    partner_id: "",
    selectedDocuments: [] as string[],
  });
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [newStakeholder, setNewStakeholder] = useState({
    name: "",
    contact: "",
    contact_email: "",
    role: "",
    notes: "",
  });
  const [comment, setComment] = useState({ text: "", isInternal: false });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [languageComboboxOpen, setLanguageComboboxOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [hideCustomerDropdown, setHideCustomerDropdown] = useState(false);
  const [newCustomer, setNewCustomer] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    emergency_contact: string;
    gender: string;
    age: string;
    address: string;
    customer_type: string;
    source: string;
    partner: string;
    communication_preference: string;
    language_preference: string;
    notes: string;
    role: string;
    gstin: string;
    pan_number: string;
    state: string;
    pincode: string;
    claims_number: string;
  }>({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    emergency_contact: "",
    gender: "",
    age: "",
    address: "",
    customer_type: "",
    source: "",
    partner: "",
    communication_preference: "",
    language_preference: "",
    notes: "",
    role: "",
    gstin: "",
    pan_number: "",
    state: "",
    pincode: "",
    claims_number: "",
  });
  const mockPartners = [
    { id: "p1", name: "Acme Insurance" },
    { id: "p2", name: "Global Brokers" },
    { id: "p3", name: "Sunrise Associates" },
  ];
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [documentTypes, setDocumentTypes] = useState<{ [key: string]: string }>(
    {}
  );
  const [customDocumentNames, setCustomDocumentNames] = useState<{
    [key: string]: string;
  }>({});
  const [isOtherDocumentSelected, setIsOtherDocumentSelected] = useState(false);
  const [otherDocumentName, setOtherDocumentName] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentStages, setPaymentStages] = useState<PaymentStage[]>([]);
  const [newPayment, setNewPayment] = useState<PaymentFormData>({
    phase: "",
    point_when_payment_to_be_received: "",
    to_be_paid_date: "",
    amount: 0,
    phase_name: "",
    case_type: "",
    phase_amount: 0,
    due_date: "",
    status: "pending",
    payment_date: null,
    payment_method: null,
    transaction_reference: null,
    invoice_number: null,
    notes: "",
  });
  const [partners, setPartners] = useState<
    Array<{
      partner_id: number;
      user_id: number;
      first_name: string;
      last_name: string;
    }>
  >([]);
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [isLoadingCaseTypes, setIsLoadingCaseTypes] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [documentUploads, setDocumentUploads] = useState<{
    [key: string]: { file: File | null };
  }>({});
  const [documentCategories, setDocumentCategories] = useState<{
    [key: string]: number;
  }>({});
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { session, userDetails } = useAuth();
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [dragActive, setDragActive] = useState<{ [key: string]: boolean }>({});

  // Mock authentication state for development/testing
  const mockAuth = {
    session: {
      sessionId: "mock-session-id",
      jwtToken: "mock-jwt-token",
      userId: "mock-user-id",
      userRole: "employee",
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    },
    userDetails: {
      id: "mock-user-id",
      full_name: "Mock User",
      email: "mock@example.com",
      role: "employee",
    },
  };

  // Use mock auth if real auth is not available
  const effectiveSession = session || mockAuth.session;
  const effectiveUserDetails = userDetails || mockAuth.userDetails;

  // Determine the appropriate dashboard based on user role
  const getDashboardRoute = () => {
    console.log("getDashboardRoute called");
    console.log("location.state:", location.state);
    console.log("document.referrer:", document.referrer);
    console.log("session:", session);
    console.log("userDetails:", userDetails);

    // Check if we came from a specific dashboard
    if (location.state?.from === "admin-dashboard") {
      console.log("Returning admin-dashboard from location.state");
      return "/admin-dashboard";
    }

    if (location.state?.from === "employee-dashboard") {
      console.log("Returning employee-dashboard from location.state");
      return "/employee-dashboard";
    }

    // Check referrer for dashboard paths
    const referrer = document.referrer;
    if (referrer.includes("/admin-dashboard")) {
      console.log("Returning admin-dashboard from referrer");
      return "/admin-dashboard";
    }

    if (referrer.includes("/employee-dashboard")) {
      console.log("Returning employee-dashboard from referrer");
      return "/employee-dashboard";
    }

    // Check user role from session or user details
    const userRole = effectiveSession?.userRole || effectiveUserDetails?.role;
    console.log("User role determined:", userRole);

    if (userRole === "admin") {
      console.log("Returning admin-dashboard from user role");
      return "/admin-dashboard";
    } else if (userRole === "employee" || userRole === "hr") {
      console.log("Returning employee-dashboard from user role:", userRole);
      return "/employee-dashboard";
    }

    // Default to employee dashboard if role is not clear
    // This ensures we always have a valid route
    console.log("Returning default employee-dashboard");
    return "/employee-dashboard";
  };

  useEffect(() => {
    console.log("NewTask component mounted");
    console.log("Auth context state:", {
      session,
      userDetails,
      isAuthenticated: session !== null,
    });
    console.log("Effective auth state:", {
      effectiveSession,
      effectiveUserDetails,
    });

    console.log("Starting to fetch data...");
    fetchCurrentUser();
    fetchUsers();
    fetchCustomers();
    fetchCaseTypes();
    fetchPartners();
    // Documents will be fetched when a case type is selected
    // Customers will be fetched on component mount

    // Auto-populate role from localStorage
    const storedUserDetails = localStorage.getItem("expertclaims_user_details");
    if (storedUserDetails) {
      try {
        const parsedUserDetails = JSON.parse(storedUserDetails);
        if (parsedUserDetails.role) {
          setNewCustomer((prev) => ({ ...prev, role: parsedUserDetails.role }));
          console.log(
            "Auto-populated role from localStorage:",
            parsedUserDetails.role
          );
        }
      } catch (error) {
        console.error("Error parsing user details from localStorage:", error);
      }
    }
  }, []);

  // Debug: Log customers state changes
  useEffect(() => {
    console.log("Customers state updated:", customers);
  }, [customers]);

  // Monitor document categories state changes
  useEffect(() => {
    console.log("Document categories state updated:", documentCategories);
  }, [documentCategories]);

  // Debug: Log customer dropdown rendering
  useEffect(() => {
    console.log("Customer dropdown rendering with customers:", customers);
    console.log("Current formData.customer_id:", formData.customer_id);
  }, [customers, formData.customer_id]);

  // Debug: Log stakeholders state changes
  useEffect(() => {
    console.log("Stakeholders state updated:", stakeholders);
  }, [stakeholders]);

  const fetchCurrentUser = async () => {
    // Mock current user data
    setCurrentUserId("mock-user-1");
  };
  const fetchPartners = async () => {
    setIsLoadingPartners(true);
    try {
      const response = await fetch(
        "http://localhost:3000/support/getpartner",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result)) {
          setPartners(result);
        } else {
          console.error("Partners API returned unexpected format:", result);
          setPartners([]);
        }
      } else {
        console.error("Failed to fetch partners:", response.status);
        setPartners([]);
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
      setPartners([]);
    } finally {
      setIsLoadingPartners(false);
    }
  };
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      // Use effective session data or fallback to mock data
      const sessionId =
        effectiveSession?.sessionId || "fddc661a-dfb4-4896-b7b1-448e1adf7bc2";
      const jwtToken =
        effectiveSession?.jwtToken ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k";

      const employeesData = await EmployeeService.getEmployees(
        sessionId,
        jwtToken
      );
      console.log("Received employees from API:", employeesData);

      // Transform employee data to match the User interface
      const transformedUsers = employeesData.map((employee) => ({
        id: employee.employee_id.toString(),
        full_name: employee.employee_name,
      }));

      console.log("Transformed users:", transformedUsers);
      setUsers(transformedUsers);
    } catch (error: any) {
      console.error("Error fetching employees:", error);

      let errorMessage = "Failed to load employees";
      if (error?.message) {
        if (
          error.message.includes("Invalid data") ||
          error.message.includes("invalid data")
        ) {
          errorMessage = "Invalid data received from server";
        } else if (error.message.includes("Network")) {
          errorMessage = "Network error while loading employees";
        } else if (
          error.message.includes("Unauthorized") ||
          error.message.includes("401")
        ) {
          errorMessage = "Authentication failed while loading employees";
        } else {
          errorMessage = `Failed to load employees: ${error.message}`;
        }
      }

      toast({
        title: "Warning",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      console.log("Starting to fetch customers...");

      // Use effective session data or fallback to mock data
      const sessionId =
        effectiveSession?.sessionId || "fddc661a-dfb4-4896-b7b1-448e1adf7bc2";
      const jwtToken =
        effectiveSession?.jwtToken ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBhYmFzZSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k";

      console.log("Using session ID:", sessionId);
      console.log("Using JWT token:", jwtToken);

      const customersData = await CustomerService.getCustomers(
        sessionId,
        jwtToken
      );
      console.log("Received customers from API:", customersData);

      // Filter out any invalid customers and clean up the data
      const validCustomers = customersData
        .filter(
          (customer) =>
            customer &&
            customer.customer_id &&
            customer.customer_name &&
            customer.customer_name.trim() !== ""
        )
        .map((customer) => ({
          ...customer,
          customer_name: customer.customer_name.trim(), // Remove trailing spaces
        }));

      console.log("Filtered and cleaned customers:", validCustomers);
      setCustomers(validCustomers);
    } catch (error: any) {
      console.error("Error fetching customers:", error);

      let errorMessage = "Failed to load customers";
      if (error?.message) {
        if (
          error.message.includes("Invalid data") ||
          error.message.includes("invalid data")
        ) {
          errorMessage = "Invalid data received from server";
        } else if (error.message.includes("Network")) {
          errorMessage = "Network error while loading customers";
        } else if (
          error.message.includes("Unauthorized") ||
          error.message.includes("401")
        ) {
          errorMessage = "Authentication failed while loading customers";
        } else {
          errorMessage = `Failed to load customers: ${error.message}`;
        }
      }

      toast({
        title: "Warning",
        description: errorMessage,
        variant: "destructive",
      });

      // Set empty array if API fails
      setCustomers([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const fetchCaseTypes = async () => {
    setIsLoadingCaseTypes(true);
    try {
      // Use effective session data or fallback to mock data
      const sessionId =
        effectiveSession?.sessionId || "fddc661a-dfb4-4896-b7b1-448e1adf7bc2";
      const jwtToken =
        effectiveSession?.jwtToken ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k";

      const caseTypesData = await CaseTypeService.getCaseTypes(
        sessionId,
        jwtToken
      );
      console.log("Received case types from API:", caseTypesData);

      // Filter out any invalid case types and clean up the data
      const validCaseTypes = caseTypesData
        .filter(
          (type) =>
            type &&
            type.case_type_id &&
            type.case_type_name &&
            type.case_type_name.trim() !== ""
        )
        .map((type) => ({
          ...type,
          case_type_name: type.case_type_name.trim(), // Remove trailing spaces
        }));

      console.log("Filtered and cleaned case types:", validCaseTypes);
      setCaseTypes(validCaseTypes);
    } catch (error: any) {
      console.error("Error fetching case types:", error);

      let errorMessage = "Failed to load case types";
      if (error?.message) {
        if (
          error.message.includes("Invalid data") ||
          error.message.includes("invalid data")
        ) {
          errorMessage = "Invalid data received from server";
        } else if (error.message.includes("Network")) {
          errorMessage = "Network error while loading case types";
        } else if (
          error.message.includes("Unauthorized") ||
          error.message.includes("401")
        ) {
          errorMessage = "Authentication failed while loading case types";
        } else {
          errorMessage = `Failed to load case types: ${error.message}`;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingCaseTypes(false);
    }
  };

  const fetchDocuments = async (caseTypeId: number) => {
    setIsLoadingDocuments(true);
    try {
      // Use effective session data or fallback to mock data
      const sessionId =
        effectiveSession?.sessionId || "fddc661a-dfb4-4896-b7b1-448e1adf7bc2";
      const jwtToken =
        effectiveSession?.jwtToken ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBhYmFzZSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k";

      const documentsData = await DocumentService.getDocumentsByCaseType(
        caseTypeId,
        sessionId,
        jwtToken
      );
      console.log("Received documents from API:", documentsData);

      // Filter out any invalid documents and clean up the data
      const validDocuments = documentsData
        .filter(
          (doc) => doc && doc.document_name && doc.document_name.trim() !== ""
        )
        .map((doc) => ({
          ...doc,
          document_name: doc.document_name.trim(), // Remove trailing spaces
        }));

      console.log("Filtered and cleaned documents:", validDocuments);
      
      // Only add "Other" to the documents list if it doesn't exist and isOtherDocumentSelected is false
      // (This prevents "Other" from being re-added after it was removed following a successful API call)
      const hasOther = validDocuments.some(
        (doc) => doc.document_name && doc.document_name.trim().toLowerCase() === "other"
      );
      
      if (!hasOther && !isOtherDocumentSelected) {
        validDocuments.push({
          document_id: 0, // Placeholder ID for "Other"
          document_name: "Other",
          category_id: 0, // Will be set from fetchDocumentCategories
          case_type_id: caseTypeId,
        } as Document);
        console.log("Added 'Other' to documents list");
      }
      
      setDocuments(validDocuments);

      // Create document categories mapping from the documents data itself
      const categories: { [key: string]: number } = {};
      validDocuments.forEach((doc) => {
        if (doc.document_name && doc.category_id) {
          categories[doc.document_name] = doc.category_id;
          console.log(
            `Mapped document: "${doc.document_name}" -> category_id: ${doc.category_id}`
          );
        }
      });
      
      // Always ensure "Other" has a category_id (use 0 as default if not set)
      if (!categories["Other"]) {
        categories["Other"] = 0;
        console.log("Added 'Other' to document categories with default category_id: 0");
      }
      
      console.log("Document categories mapped from documents:", categories);
      setDocumentCategories(categories);
    } catch (error: any) {
      console.error("Error fetching documents:", error);

      let errorMessage = "Failed to load documents for this case type";
      if (error?.message) {
        if (
          error.message.includes("Invalid data") ||
          error.message.includes("invalid data")
        ) {
          errorMessage = "Invalid data received from server";
        } else if (error.message.includes("Network")) {
          errorMessage = "Network error while loading documents";
        } else if (
          error.message.includes("Unauthorized") ||
          error.message.includes("401")
        ) {
          errorMessage = "Authentication failed while loading documents";
        } else {
          errorMessage = `Failed to load documents: ${error.message}`;
        }
      }

      toast({
        title: "Warning",
        description: errorMessage,
        variant: "destructive",
      });

      // Even if API fails, ensure "Other" is available
      setDocuments([
        {
          document_id: 0,
          document_name: "Other",
          category_id: 0,
          case_type_id: caseTypeId,
        } as Document,
      ]);
      setDocumentCategories({ "Other": 0 });
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const fetchDocumentCategories = async (caseTypeId: number, skipAddingOther: boolean = false) => {
    try {
      console.log("Fetching document categories for case type:", caseTypeId);

      const response = await fetch(
        `http://localhost:3000/support/getdocumentcategories?case_type_id=${caseTypeId}`,
        {
          method: "GET",
          headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Document categories response:", data);

        // Extract categories from the response
        const categories: { [key: string]: number } = {};
        
        // Update documents list from API response
        const updatedDocuments: Document[] = [];
        
        if (data && data.length > 0 && data[0].body) {
          data[0].body.forEach((item: any) => {
            if (item.document_name && item.category_id) {
              categories[item.document_name] = item.category_id;
              
              // Add to documents list if not "Other" or if skipAddingOther is false
              if (item.document_name.trim().toLowerCase() !== "other" || !skipAddingOther) {
                updatedDocuments.push({
                  document_id: item.document_id || 0,
                  document_name: item.document_name.trim(),
                  category_id: item.category_id,
                  case_type_id: caseTypeId,
                } as Document);
              }
            }
          });
        }

        // Update documents list with new documents from API (excluding "Other" if skipAddingOther is true)
        if (updatedDocuments.length > 0) {
          setDocuments((prev) => {
            // Remove documents that are in the API response (they will be replaced)
            const existingDocNames = updatedDocuments.map(doc => doc.document_name.toLowerCase());
            const filteredPrev = prev.filter(doc => 
              !existingDocNames.includes(doc.document_name.toLowerCase())
            );
            // Combine filtered previous documents with new ones from API
            return [...filteredPrev, ...updatedDocuments];
          });
        }

        // Only add "Other" to categories if skipAddingOther is false
        if (!skipAddingOther && !categories["Other"]) {
          // Try to find a category_id from the response, or use 0 as default
          const otherCategoryId = data && data.length > 0 && data[0].body && data[0].body.length > 0
            ? data[0].body[0].category_id || 0
            : 0;
          categories["Other"] = otherCategoryId;
          console.log("Added 'Other' to document categories with category_id:", otherCategoryId);
        }

        console.log("Document categories mapped:", categories);
        setDocumentCategories(categories);
      } else {
        console.error("Failed to fetch document categories:", response.status);
        // Even on error, ensure "Other" is in categories only if skipAddingOther is false
        if (!skipAddingOther) {
          setDocumentCategories((prev) => ({
            ...prev,
            "Other": prev["Other"] || 0,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching document categories:", error);
    }
  };

  const handleAddPayment = () => {
    // Validate required fields
    if (!newPayment.phase || !newPayment.due_date) {
      toast({
        title: "Error",
        description: "Please fill all required fields (Phase and Due Date)",
        variant: "destructive",
      });
      return;
    }

    // Get employee_id from localStorage
    const userDetailsStr = localStorage.getItem("expertclaims_user_details");
    let employeeId = 1; // Default fallback

    if (userDetailsStr) {
      try {
        const userDetails = JSON.parse(userDetailsStr);
        employeeId = userDetails.employee_id || 1;
        console.log("Employee ID from localStorage:", employeeId);
      } catch (error) {
        console.error("Error parsing user details from localStorage:", error);
      }
    }

    const paymentStage: PaymentStage = {
      id: Date.now().toString(),
      phase: newPayment.phase,
      point_when_payment_to_be_received: "", // Not used in API
      to_be_paid_date: "", // Not used in API
      amount: 0, // Not used in API
      phase_name: newPayment.phase_name,
      case_type: "", // Not used in API
      phase_amount: newPayment.phase_amount, // Not used in API
      due_date: newPayment.due_date,
      status: "", // Not used in API
      payment_date: null, // Not used in API
      payment_method: null, // Not used in API
      transaction_reference: null, // Not used in API
      invoice_number: null, // Not used in API
      notes: "", // Not used in API
      created_by: employeeId,
      created_time: new Date().toISOString(),
    };

    setPaymentStages([...paymentStages, paymentStage]);
    setNewPayment({
      phase: "",
      point_when_payment_to_be_received: "",
      to_be_paid_date: "",
      amount: 0,
      phase_name: "",
      case_type: "",
      phase_amount: 0,
      due_date: "",
      status: "pending",
      payment_date: null,
      payment_method: null,
      transaction_reference: null,
      invoice_number: null,
      notes: "",
    });
    setShowPaymentForm(false);

    toast({
      title: "Success",
      description: "Payment stage added successfully",
    });
  };

  const handleRemovePayment = (id: string) => {
    setPaymentStages(paymentStages.filter((payment) => payment.id !== id));
  };

  const getTotalAmount = () => {
    return paymentStages.reduce(
      (total, payment) => total + payment.phase_amount,
      0
    );
  };

  const getAvailablePhases = () => {
    const usedPhases = paymentStages.map((p) => p.phase);
    const availablePhases = staticPaymentPhases
      .filter(
        (phase) => phase && phase.trim() !== "" && !usedPhases.includes(phase)
      )
      .map((phase) => ({ phase, point_when_payment_to_be_received: "" }));
    console.log("Available phases:", availablePhases);
    return availablePhases;
  };

  const handleCreateCustomer = async () => {
    try {
      const fullName =
        `${newCustomer.first_name} ${newCustomer.last_name}`.trim();
      if (
        !newCustomer.first_name.trim() ||
        !newCustomer.last_name.trim() ||
        !newCustomer.mobile.trim() ||
        newCustomer.mobile.length !== 10
      ) {
        toast({
          title: "Error",
          description:
            "Customer name and mobile number (10 digits) are required",
          variant: "destructive",
        });
        return;
      }

      // Simulate customer creation delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create mock customer data with all fields including new ones
      const mockCustomerData = {
        id: `customer-${Date.now()}`,
        full_name: fullName,
        email: newCustomer.email || "",
        role: "customer", // Set role statically to 'customer'
        mobile: newCustomer.mobile,
        emergency_contact: newCustomer.emergency_contact,
        gender: newCustomer.gender,
        age: newCustomer.age,
        address: newCustomer.address,
        customer_type: newCustomer.customer_type,
        source: newCustomer.source,
        partner: newCustomer.partner,
        communication_preference: newCustomer.communication_preference,
        language_preference: newCustomer.language_preference,
        notes: newCustomer.notes,
        gstin: newCustomer.gstin || "",
        pan_number: newCustomer.pan_number || "",
        state: newCustomer.state || "",
        pincode: newCustomer.pincode || "",
        claims_number: newCustomer.claims_number || "",
      };

      console.log("Mock customer created with all fields:", mockCustomerData);
      console.log("Role from localStorage:", newCustomer.role);

      setFormData((prev) => ({ ...prev, customer_id: mockCustomerData.id }));
      setCreateCustomerOpen(false);
      toast({
        title: "Customer created",
        description: `${mockCustomerData.full_name} (${mockCustomerData.email}) with role: ${mockCustomerData.role}`,
      });
    } catch (err) {
      console.error("Unexpected error creating customer:", err);
      toast({
        title: "Error",
        description: "Unexpected error creating customer",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCaseTypeChange = (caseType: string) => {
    console.log("Case type changed to:", caseType);

    // Clean the case type name to remove any trailing spaces
    const cleanCaseType = caseType.trim();
    console.log("Cleaned case type:", cleanCaseType);

    setFormData((prev) => ({
      ...prev,
      caseType: cleanCaseType,
      selectedDocuments: [], // Reset selected documents when case type changes
    }));
    setDocumentUploads({}); // Reset document uploads

    // Find the case type ID and fetch documents
    const selectedCaseType = caseTypes.find(
      (type) => type.case_type_name.trim() === cleanCaseType
    );
    if (selectedCaseType) {
      console.log("Found case type ID:", selectedCaseType.case_type_id);
      fetchDocuments(selectedCaseType.case_type_id);
      // Also fetch document categories to ensure "Other" is included
      fetchDocumentCategories(selectedCaseType.case_type_id);
    } else {
      console.log("Case type not found, clearing documents");
      setDocuments([]);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    console.log("Customer changed to:", customerId);

    const selectedCustomer = customers.find(
      (customer) => customer.customer_id.toString() === customerId
    );
    if (selectedCustomer) {
      console.log("Selected customer:", selectedCustomer);
      setFormData((prev) => ({
        ...prev,
        customer_id: customerId,
      }));

      // Add customer_id to the customer array
      const customerWithId = {
        ...selectedCustomer,
        customer_id: selectedCustomer.customer_id,
      };
      console.log("Customer with ID added:", customerWithId);
    }
  };

  const getSelectedCustomerName = () => {
    if (!formData.customer_id) return "";
    const selectedCustomer = customers.find(
      (customer) => customer.customer_id.toString() === formData.customer_id
    );
    return selectedCustomer ? selectedCustomer.customer_name : "";
  };

  const splitCustomerName = (fullName: string) => {
    const nameParts = fullName.trim().split(" ");
    if (nameParts.length === 1) {
      return { firstName: nameParts[0], lastName: "" };
    } else if (nameParts.length === 2) {
      return { firstName: nameParts[0], lastName: nameParts[1] };
    } else {
      return {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" "),
      };
    }
  };

  const createTaskData = (): TaskCreateRequest => {
    // Get selected customer data
    const selectedCustomer = customers.find(
      (customer) => customer.customer_id.toString() === formData.customer_id
    );
    const customerNameParts = selectedCustomer
      ? splitCustomerName(selectedCustomer.customer_name)
      : { firstName: "", lastName: "" };

    console.log("Selected customer:", selectedCustomer);
    console.log("Customer name parts:", customerNameParts);
    console.log("Current stakeholders:", stakeholders);

    // Transform stakeholders data
    console.log("Raw stakeholders from state:", stakeholders);

    const taskStakeholders: TaskStakeholder[] = stakeholders.map(
      (stakeholder) => ({
        name: stakeholder.name,
        contactEmail: stakeholder.contact_email || stakeholder.contact, // Use contact_email if available, fallback to contact
        role: stakeholder.role,
        notes: stakeholder.notes,
      })
    );

    console.log("Transformed stakeholders:", taskStakeholders);

    // Ensure stakeholders are properly formatted for API
    if (taskStakeholders.length > 0) {
      console.log(
        "Stakeholders will be sent in payload:",
        JSON.stringify(taskStakeholders, null, 2)
      );
    } else {
      console.log("No stakeholders to send in payload");
    }

    // Create customer data
    let customerData: TaskCustomer;

    if (selectedCustomer) {
      // Use existing customer - split name and create minimal data
      customerData = {
        customer_id: selectedCustomer.customer_id,
        firstName: customerNameParts.firstName,
        lastName: customerNameParts.lastName,
        email: "",
        mobileNumber: "",
        emergencyContact: "",
        gender: "",
        age: 0,
        address: "",
        customerType: "",
        communicationPreference: "",
        source: "",
        partner: "",
        languagePreference: "",
        notes: "",
        claims_number: "",
        role: "customer",
        gstin: "",
        pan: "",
        state: "",
        pincode: "",
      };
    } else {
      // Use new customer data if available
      customerData = {
        firstName: newCustomer.first_name,
        lastName: newCustomer.last_name,
        email: newCustomer.email || "",
        mobileNumber: newCustomer.mobile,
        emergencyContact: newCustomer.emergency_contact,
        gender: newCustomer.gender,
        age: parseInt(newCustomer.age) || 0,
        address: newCustomer.address,
        customerType: newCustomer.customer_type,
        communicationPreference: newCustomer.communication_preference,
        source: newCustomer.source,
        partner: newCustomer.partner,
        languagePreference: newCustomer.language_preference,
        notes: newCustomer.notes,
        role: "customer", // Set role statically to 'customer'
        gstin: newCustomer.gstin || "",
        pan: newCustomer.pan_number || "",
        state: newCustomer.state || "",
        pincode: newCustomer.pincode || "",
        claims_number: newCustomer.claims_number || "",
      };
    }

    console.log("Customer data prepared:", customerData);

    // Find the case type ID from the selected case type name
    const selectedCaseType = caseTypes.find(
      (type) => type.case_type_name === formData.caseType
    );
    const caseTypeId = selectedCaseType
      ? selectedCaseType.case_type_id.toString()
      : formData.caseType;

    console.log("Selected case type name:", formData.caseType);
    console.log("Found case type object:", selectedCaseType);
    console.log("Case type ID to be sent:", caseTypeId);

    // Get employee_id from localStorage for payment data
    const userDetailsStr = localStorage.getItem("expertclaims_user_details");
    let employeeId = 1; // Default fallback

    if (userDetailsStr) {
      try {
        const userDetails = JSON.parse(userDetailsStr);
        employeeId = userDetails.employee_id || 1;
        console.log(
          "Employee ID from localStorage for task creation:",
          employeeId
        );
      } catch (error) {
        console.error("Error parsing user details from localStorage:", error);
      }
    }

    // Transform payment stages data - send all payments as an array with only required fields
    const taskPayments = paymentStages.map((payment) => ({
      phase_name: payment.phase_name,
      due_date: payment.due_date,
      phase_amount: payment.phase_amount,
      created_by: employeeId,
    }));

    console.log("Payment data to be sent:", taskPayments);

    const taskData = {
      case_Summary: formData.task_summary,
      case_description: formData.description,
      service_amount: formData.service_amount ? parseFloat(formData.service_amount) : null,
      claims_amount: formData.claims_amount ? parseFloat(formData.claims_amount) : null,
      caseType: caseTypeId, // Pass the ID instead of the name
      assignedTo: formData.assigned_to,
      priority: formData.priority,
      ticket_Stage: formData.ticket_stage,
      partner_id: formData.partner_id,
      dueDate: formData.due_date,
      stakeholders: taskStakeholders,
      customer: customerData,
      comments: comment.text,
      internal: comment.isInternal ? "true" : "false",
      payments: taskPayments,
      referring_partner_id: formData.partner_id, // Use the selected partner ID
      referral_date: new Date().toISOString().split('T')[0], // Today's date
      case_value: paymentStages.reduce((sum, payment) => sum + (payment.phase_amount || 0), 0), // Total of all payments
    };

    console.log("Final task data:", taskData);
    return taskData;
  };

  const handleDocumentSelection = (
    documentName: string,
    isSelected: boolean
  ) => {
    // Check if "Other" is being selected or deselected
    if (documentName === "Other") {
      setIsOtherDocumentSelected(isSelected);
      if (!isSelected) {
        // Clear the custom document name when "Other" is unchecked
        setOtherDocumentName("");
        // Remove "Other" from selected documents
        setFormData((prev) => ({
          ...prev,
          selectedDocuments: prev.selectedDocuments.filter((doc) => doc !== "Other"),
        }));
      } else {
        // Add "Other" to selected documents
        setFormData((prev) => ({
          ...prev,
          selectedDocuments: [...prev.selectedDocuments, "Other"],
        }));
      }
    } else {
      // For other documents, use the normal selection logic
      setFormData((prev) => ({
        ...prev,
        selectedDocuments: isSelected
          ? [...prev.selectedDocuments, documentName]
          : prev.selectedDocuments.filter((doc) => doc !== documentName),
      }));
    }
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

  const handleDocumentUpload = async (documentName: string, file: File | null) => {
    if (!file) {
    setDocumentUploads((prev) => ({
      ...prev,
      [documentName]: {
        ...prev[documentName],
          file: null,
        },
      }));
      return;
    }

    // Check if it's a Word document and convert to PDF
    const isWordDoc = 
      file.type === 'application/msword' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.doc') || 
      file.name.endsWith('.docx');

    let fileToUpload = file;

    if (isWordDoc) {
      try {
        fileToUpload = await convertWordToPDF(file);
      } catch (error) {
        console.error('Error during Word to PDF conversion:', error);
        // Continue with original file if conversion fails
      }
    }

    setDocumentUploads((prev) => ({
      ...prev,
      [documentName]: {
        ...prev[documentName],
        file: fileToUpload,
      },
    }));
  };

  const handleDragEnter = (e: React.DragEvent, documentName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive((prev) => ({ ...prev, [documentName]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, documentName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive((prev) => ({ ...prev, [documentName]: false }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent, documentName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive((prev) => ({ ...prev, [documentName]: false }));

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      // Validate file type
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF, JPG, PNG, DOC, or DOCX file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      await handleDocumentUpload(documentName, file);
      toast({
        title: "File Added",
        description: `${file.name} has been added for ${documentName}${file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx') ? ' (converted to PDF)' : ''}`,
      });
    }
  };

  const handleDocumentTypeChange = (
    documentName: string,
    documentType: string
  ) => {
    setDocumentTypes((prev) => ({
      ...prev,
      [documentName]: documentType,
    }));

    // Reset custom document name if not "Other"
    if (documentType !== "Other") {
      setCustomDocumentNames((prev) => {
        const newState = { ...prev };
        delete newState[documentName];
        return newState;
      });
    }
  };

  const handleCustomDocumentNameChange = (
    documentName: string,
    customName: string
  ) => {
    setCustomDocumentNames((prev) => ({
      ...prev,
      [documentName]: customName,
    }));
  };

  const createDocumentCategory = async (documentName: string) => {
    if (!documentName || documentName.trim() === "") {
      return;
    }

    // Find the selected case type to get case_type_id
    const selectedCaseType = caseTypes.find(
      (type) => type.case_type_name.trim() === formData.caseType.trim()
    );

    if (!selectedCaseType) {
      console.error("Case type not found for document category creation");
      toast({
        title: "Error",
        description: "Please select a case type first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get session data
      const sessionId =
        effectiveSession?.sessionId || "fddc661a-dfb4-4896-b7b1-448e1adf7bc2";
      const jwtToken =
        effectiveSession?.jwtToken ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k";

      console.log("Creating document category with:", {
        case_type_id: selectedCaseType.case_type_id.toString(),
        document_name: documentName.trim(),
      });

      const response = await fetch(
        "https://n8n.srv952553.hstgr.cloud/webhook/documentcatagorycreation",
        {
          method: "POST",
          headers: {
            accept: "*/*",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
            apikey:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws",
            authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws",
            "cache-control": "no-cache",
            "content-type": "application/json",
            jwt_token: jwtToken,
            origin: "http://localhost:8080",
            pragma: "no-cache",
            session_id: sessionId,
          },
          body: JSON.stringify({
            case_type_id: selectedCaseType.case_type_id.toString(),
            document_name: documentName.trim(),
          }),
        }
      );

      // Parse response
      let result;
      try {
        const responseText = await response.text();
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        result = {};
      }

      if (response.ok) {
        console.log("Document category created successfully:", result);
        
        // Update document categories with the new category_id if returned
        const categoryId = result.category_id || result.data?.category_id || result.body?.category_id;
        if (categoryId) {
          setDocumentCategories((prev) => ({
            ...prev,
            [documentName.trim()]: categoryId,
          }));
          console.log(
            `Updated document category for "${documentName}" with category_id: ${categoryId}`
          );
        }

        // Show success message
        toast({
          title: "Success",
          description: `Document category "${documentName}" created successfully`,
        });

        // Remove "Other" from documents list
        setDocuments((prev) => 
          prev.filter((doc) => doc.document_name !== "Other")
        );

        // Uncheck "Other" checkbox and clear the input
        setIsOtherDocumentSelected(false);
        setOtherDocumentName("");
        setCustomDocumentNames((prev) => {
          const newState = { ...prev };
          delete newState["Other"];
          return newState;
        });

        // Remove "Other" from selected documents if it was selected
        setFormData((prev) => ({
          ...prev,
          selectedDocuments: prev.selectedDocuments.filter((doc) => doc !== "Other"),
        }));

        // Refresh documents list to include the new document
        if (selectedCaseType) {
          // Fetch document categories first (this will also update documents list)
          // Pass skipAddingOther=true to prevent "Other" from being added back
          fetchDocumentCategories(selectedCaseType.case_type_id, true);
          // Also fetch documents to ensure we have the complete list
          fetchDocuments(selectedCaseType.case_type_id);
        }
      } else {
        // Check for error message in response
        let errorMessage = "Failed to create document category";
        if (result.message || result.error || result.status) {
          errorMessage = result.message || result.error || `Status: ${result.status}`;
        } else if (result.status_code) {
          errorMessage = `Error ${result.status_code}: ${result.message || "Failed to create document category"}`;
        }

        console.error(
          "Failed to create document category:",
          response.status,
          result
        );
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating document category:", error);
      toast({
        title: "Error",
        description: "Error creating document category. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addStakeholder = () => {
    console.log("Adding stakeholder with data:", newStakeholder);
    console.log("Current stakeholders before adding:", stakeholders);

    if (
      newStakeholder.name.trim() &&
      newStakeholder.contact_email.trim() &&
      newStakeholder.role.trim()
    ) {
      const newStakeholderWithId = {
        ...newStakeholder,
        id: Date.now().toString(),
      };
      console.log("New stakeholder to add:", newStakeholderWithId);

      setStakeholders((prev) => {
        const updatedStakeholders = [...prev, newStakeholderWithId];
        console.log("Updated stakeholders after adding:", updatedStakeholders);
        return updatedStakeholders;
      });

      setNewStakeholder({
        name: "",
        contact: "",
        contact_email: "",
        role: "",
        notes: "",
      });
      console.log("Stakeholder added successfully!");
    } else {
      console.log("Validation failed:", {
        name: newStakeholder.name.trim(),
        contact_email: newStakeholder.contact_email.trim(),
        role: newStakeholder.role.trim(),
      });
    }
  };

  const removeStakeholder = (id: string) => {
    setStakeholders((prev) =>
      prev.filter((stakeholder) => stakeholder.id !== id)
    );
  };

  const clearComment = () => {
    setComment({ text: "", isInternal: false });
  };

  const uploadDocuments = async (caseId: string) => {
    if (!caseId) {
      console.error("No case ID available for document upload");
      return;
    }

    // Get employee_id from localStorage
    const userDetailsStr = localStorage.getItem("expertclaims_user_details");
    let employeeId = "";

    if (userDetailsStr) {
      try {
        const userDetails = JSON.parse(userDetailsStr);

        const details = Array.isArray(userDetails)
          ? userDetails[0]
          : userDetails;

        employeeId = details?.employee_id?.toString() || "";
        console.log("Employee ID from localStorage:", employeeId);
      } catch (error) {
        console.error("Error parsing user details from localStorage:", error);
      }
    }

    if (!employeeId) {
      console.error("No employee ID found in localStorage");
      toast({
        title: "Error",
        description: "Employee ID not found. Cannot upload documents.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingDocuments(true);
    const uploadPromises: Promise<any>[] = [];
    let uploadCount = 0;

    try {
      console.log("Selected documents:", formData.selectedDocuments);
      console.log("Available document categories:", documentCategories);
      console.log("Document uploads:", documentUploads);

      // Upload each selected document
      for (const documentName of formData.selectedDocuments) {
        const file = documentUploads[documentName]?.file;
        console.log(`Processing document: ${documentName}, File:`, file);

        if (file) {
          // Use custom document name if "Other" is selected
          const actualDocumentName = documentName === "Other" && customDocumentNames["Other"]
            ? customDocumentNames["Other"]
            : documentName;

          let categoryId = documentCategories[actualDocumentName] || documentCategories[documentName];
          console.log(
            `Looking for category ID for document: "${actualDocumentName}"`
          );
          console.log(`Available categories:`, Object.keys(documentCategories));
          console.log(`Found category ID: ${categoryId}`);

          // If category ID is not found, create it by calling the API
          if (!categoryId && categoryId !== 0) {
            console.warn(`No category ID found for document: ${actualDocumentName}. Creating category...`);
            
            // Get case_type_id from the selected case type
            const selectedCaseType = caseTypes.find(
              (type) => type.case_type_name.trim() === formData.caseType.trim()
            );
            
            if (!selectedCaseType) {
              console.error("Case type not found. Cannot create category.");
              toast({
                title: "Error",
                description: `Case type not found. Cannot create category for document: ${actualDocumentName}.`,
                variant: "destructive",
              });
              continue;
            }

            try {
              // Call the API to create the category
              const createCategoryResponse = await fetch(
                'https://n8n.srv952553.hstgr.cloud/webhook/insertcatagory',
                {
                  method: 'POST',
                  headers: {
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
                    'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
                    'content-type': 'application/json',
                  },
                  body: JSON.stringify({
                    case_type_id: selectedCaseType.case_type_id,
                    document_type: actualDocumentName
                  })
                }
              );

              if (createCategoryResponse.ok) {
                const categoryData = await createCategoryResponse.json();
                console.log('Category created successfully:', categoryData);
                
                // Extract category_id from response
                // The response structure may vary, so we try different possible fields
                categoryId = categoryData?.category_id || 
                            categoryData?.data?.category_id || 
                            categoryData?.body?.category_id ||
                            categoryData?.id ||
                            categoryData?.[0]?.category_id ||
                            categoryData?.[0]?.id;

                if (categoryId !== undefined && categoryId !== null) {
                  // Update documentCategories state for future use
                  setDocumentCategories((prev) => ({
                    ...prev,
                    [actualDocumentName]: categoryId,
                  }));
                  
                  // Also add to documents list if not already there
                  const docExists = documents.some(
                    (doc) => doc.document_name && doc.document_name.trim() === actualDocumentName.trim()
                  );
                  
                  if (!docExists) {
                    setDocuments((prev) => [
                      ...prev,
                      {
                        document_id: 0,
                        document_name: actualDocumentName,
                        category_id: categoryId,
                        case_type_id: selectedCaseType.case_type_id,
                      } as Document
                    ]);
                  }
                  
                  console.log(`Category created with ID: ${categoryId} for document: ${actualDocumentName}`);
                } else {
                  throw new Error('Category ID not found in API response');
                }
              } else {
                const errorText = await createCategoryResponse.text();
                throw new Error(`Failed to create category: ${createCategoryResponse.status} - ${errorText}`);
              }
            } catch (error: any) {
              console.error('Error creating category:', error);
              toast({
                title: "Error",
                description: `Failed to create category for document: ${actualDocumentName}. ${error.message || 'Please try again.'}`,
                variant: "destructive",
              });
              continue;
            }
          }

          console.log(
            `Uploading document: ${actualDocumentName}, Category ID: ${categoryId}, Case ID: ${caseId}, Employee ID: ${employeeId}`
          );

          const formData = new FormData();
          formData.append("data", file);
          formData.append("case_id", caseId);
          formData.append("category_id", categoryId.toString());
          formData.append("is_customer_visible", "false"); // Admin/employee uploads are not customer visible by default

          const uploadPromise = fetch(
            "http://localhost:3000/api/upload",
            {
              method: "POST",
              headers: {
                apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws",
                Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws",
                // Don't set Content-Type for FormData - browser will set it automatically with boundary
              },
              body: formData,
            }
          )
            .then(async (response) => {
              if (response.ok) {
                const result = await response.json();
                console.log(
                  `Document ${actualDocumentName} uploaded successfully:`,
                  result
                );
                uploadCount++;
                return { success: true, documentName: actualDocumentName, result };
              } else {
                const errorText = await response.text();
                console.error(
                  `Failed to upload document ${actualDocumentName}:`,
                  response.status,
                  errorText
                );
                return {
                  success: false,
                  documentName: actualDocumentName,
                  error: `HTTP ${response.status}: ${errorText}`,
                };
              }
            })
            .catch((error) => {
              console.error(`Error uploading document ${actualDocumentName}:`, error);
              return { success: false, documentName: actualDocumentName, error: error.message };
            });

          uploadPromises.push(uploadPromise);
        }
      }

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);

      // Check results
      const successfulUploads = results.filter((r) => r.success);
      const failedUploads = results.filter((r) => !r.success);

      console.log(
        `Upload completed: ${successfulUploads.length} successful, ${failedUploads.length} failed`
      );

      if (successfulUploads.length > 0) {
        toast({
          title: "Success",
          description: `${successfulUploads.length} document(s) uploaded successfully`,
        });
      }

      if (failedUploads.length > 0) {
        const failedNames = failedUploads.map((f) => f.documentName).join(", ");
        toast({
          title: "Warning",
          description: `Failed to upload: ${failedNames}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during document upload process:", error);
      toast({
        title: "Error",
        description: "Failed to upload documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingDocuments(false);
    }
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
        return;
      }

      if (!formData.service_amount || !formData.service_amount.trim()) {
        toast({
          title: "Error",
          description: "Service amount is required",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!formData.due_date) {
        toast({
          title: "Error",
          description: "Due date is required",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!formData.customer_id) {
        toast({
          title: "Error",
          description: "Customer selection is required",
          variant: "destructive",
        });
        return;
      }

      if (!currentUserId) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      console.log("Starting task creation...");

      // Create task data for API
      const taskData = createTaskData();
      console.log("Task data prepared:", taskData);
      console.log(
        "Final API payload being sent:",
        JSON.stringify(taskData, null, 2)
      );

      // Get session data
      const sessionId =
        effectiveSession?.sessionId || "fddc661a-dfb4-4896-b7b1-448e1adf7bc2";
      const jwtToken =
        effectiveSession?.jwtToken ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k";

      // Call the task creation API
      const result = await TaskService.createTask(
        taskData,
        sessionId,
        jwtToken
      );
      console.log("Task creation API response:", result);
      console.log("Full response object:", JSON.stringify(result, null, 2));

      // Extract case_id from the result (allow non-numeric IDs like ECSI-25-217, TASK-1765525486667)
      let caseId: string | null = null;
      if (result && typeof result === "object") {
        const resultObj = result as any;
        
        // Handle array response format: [{"message":"...", "case_id":"ECSI-25-217"}]
        if (Array.isArray(resultObj) && resultObj.length > 0) {
          const firstItem = resultObj[0];
          if (firstItem?.case_id) {
            caseId = String(firstItem.case_id);
            console.log("Found case_id in array response:", caseId);
          }
        }
        // Handle object response format
        else if (!Array.isArray(resultObj)) {
          // Check for different possible response formats
          // Priority: case_id (from API response) > taskId > id
          if (resultObj.case_id) {
            caseId = String(resultObj.case_id);
            console.log("Found case_id in response:", caseId);
          } else if (resultObj.taskId) {
            caseId = String(resultObj.taskId);
            console.log("Found taskId in response:", caseId);
          } else if (resultObj.id) {
            caseId = String(resultObj.id);
            console.log("Found id in response:", caseId);
          } else if (resultObj.data?.case_id) {
            // Handle nested response format
            caseId = String(resultObj.data.case_id);
            console.log("Found case_id in nested data:", caseId);
          }
        }
      }

      if (!caseId) {
        console.error("Failed to extract case_id from API response:", result);
        toast({
          title: "Warning",
          description: "Task created but case ID not found in response. Documents may not upload correctly.",
          variant: "destructive",
        });
      }

      console.log("Final extracted case ID for upload:", caseId);
      setCreatedCaseId(caseId);

      if (caseId) {
        toast({
          title: "Success",
          description: `Task created successfully! Case ID: ${caseId}`,
        });

        // Upload documents if any are selected and case ID is available
        if (formData.selectedDocuments.length > 0) {
          console.log("Starting document upload process with case_id:", caseId);
          toast({
            title: "Uploading Documents",
            description: "Please wait while documents are being uploaded...",
          });

          await uploadDocuments(caseId);
        }
      } else {
        toast({
          title: "Error",
          description: "Task created but case ID is missing. Please check the response.",
          variant: "destructive",
        });
      }

      // Show a success message with navigation options
      toast({
        title: "Task Created!",
        description:
          "Your task has been created successfully. You can now navigate to the dashboard.",
      });
      toast({
        title: "Navigation",
        description:
          "Click 'Back to Dashboard' button if automatic navigation fails.",
      });

      // Navigate to the dashboard instead of task details since we're in mock mode
      try {
        const dashboardRoute = getDashboardRoute();
        console.log("Navigating to dashboard route:", dashboardRoute);
        navigate(dashboardRoute);

        // Add a fallback navigation in case the first one fails
        setTimeout(() => {
          if (window.location.pathname === "/new-task") {
            console.log(
              "Navigation may have failed, trying fallback to employee dashboard"
            );
            navigate("/employee-dashboard", { replace: true });
          }
        }, 2000);
      } catch (error) {
        console.error("Navigation error:", error);
        // Fallback navigation to employee dashboard
        navigate("/employee-dashboard");
      }
    } catch (error: any) {
      console.error("Error creating task:", error);

      // Handle different types of errors
      let errorMessage = "An unexpected error occurred";
      let errorTitle = "Error";

      if (error?.message) {
        // Check for specific error messages
        if (
          error.message.includes("Invalid data") ||
          error.message.includes("invalid data")
        ) {
          errorMessage =
            "Invalid data provided. Please check your input and try again.";
          errorTitle = "Invalid Data";
        } else if (error.message.includes("HTTP error")) {
          errorMessage = "Server error occurred. Please try again later.";
          errorTitle = "Server Error";
        } else if (error.message.includes("Network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
          errorTitle = "Network Error";
        } else if (
          error.message.includes("Unauthorized") ||
          error.message.includes("401")
        ) {
          errorMessage = "Authentication failed. Please log in again.";
          errorTitle = "Authentication Error";
        } else if (
          error.message.includes("Forbidden") ||
          error.message.includes("403")
        ) {
          errorMessage = "You don't have permission to perform this action.";
          errorTitle = "Permission Denied";
        } else if (
          error.message.includes("Not Found") ||
          error.message.includes("404")
        ) {
          errorMessage = "The requested resource was not found.";
          errorTitle = "Not Found";
        } else if (
          error.message.includes("Validation") ||
          error.message.includes("validation")
        ) {
          errorMessage = "Please check your input data and try again.";
          errorTitle = "Validation Error";
        } else {
          // Use the actual error message if it's meaningful
          errorMessage = error.message;
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-500 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg rounded-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
            <CardTitle className="text-2xl font-bold">
              Create New Task
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => {
                try {
                  const route = getDashboardRoute();
                  console.log("Manual navigation to:", route);
                  navigate(route);
                } catch (error) {
                  console.error("Manual navigation error:", error);
                  navigate("/employee-dashboard");
                }
              }}
              className="bg-white border-2 border-gray-300 hover:border-primary-500 hover:bg-gray-50 text-black"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardHeader>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Fill in the details below to create a new task.
          </CardDescription>
          <CardContent className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="summary">Task Summary *</Label>
                  <Input
                    type="text"
                    id="task_summary"
                    name="task_summary"
                    value={formData.task_summary}
                    onChange={handleInputChange}
                    placeholder="Enter a brief summary of the task"
                  />
                </div>
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service_amount">Service Amount (₹) *</Label>
                  <Input
                    type="number"
                    id="service_amount"
                    name="service_amount"
                    value={formData.service_amount}
                    onChange={handleInputChange}
                    placeholder="Enter service amount"
                  />
                </div>
                <div>
                  <Label htmlFor="claims_amount">Claims Amount (₹)</Label>
                  <Input
                    type="number"
                    id="claims_amount"
                    name="claims_amount"
                    value={formData.claims_amount}
                    onChange={handleInputChange}
                    placeholder="Enter claims amount"
                  />
                </div>
              </div>
            </div>

            {/* Case Type & Document Selection Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Case Type & Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Case Type *</Label>
                  <Select
                    value={formData.caseType}
                    onValueChange={handleCaseTypeChange}
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
                          .filter(
                            (type) =>
                              type &&
                              type.case_type_name &&
                              type.case_type_name.trim() !== ""
                          )
                          .map((type) => {
                            // Double-check to ensure we never have empty values
                            if (
                              !type.case_type_name ||
                              type.case_type_name.trim() === ""
                            ) {
                              console.warn(
                                "Skipping case type with empty name:",
                                type
                              );
                              return null;
                            }
                            return (
                              <SelectItem
                                key={type.case_type_id}
                                value={type.case_type_name}
                              >
                                {type.case_type_name}
                              </SelectItem>
                            );
                          })
                          .filter(Boolean) // Remove any null values
                      ) : (
                        <SelectItem value="no-types" disabled>
                          No case types available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Partner dropdown - only show when source is "Referral" */}
              {/* {formData.source === 'Referral' && ( */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="partner_id">Partner</Label>
                  <Select
                    value={formData.partner_id}
                    onValueChange={(value) =>
                      handleSelectChange("partner_id", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={"Select partner"} />
                    </SelectTrigger>
                    <SelectContent>
                      {partners.map((partner) => (
                        <SelectItem
                          key={partner.partner_id}
                          value={partner.partner_id.toString()}
                        >
                          {partner.first_name} {partner.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* )} */}

              {formData.caseType && (
                <div>
                  <Label>Document List *</Label>
                  <div className="space-y-2">
                    {isLoadingDocuments ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                        <span className="text-sm text-gray-500">
                          Loading documents...
                        </span>
                      </div>
                    ) : documents.length > 0 ? (
                      <>
                        {/* Render all documents except "Other" first */}
                        {documents
                          .filter((doc) => doc.document_name?.toLowerCase() !== "other")
                          .map((document) => (
                            <div
                              key={document.document_name}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="checkbox"
                                id={document.document_name}
                                checked={formData.selectedDocuments.includes(
                                  document.document_name
                                )}
                                onChange={(e) =>
                                  handleDocumentSelection(
                                    document.document_name,
                                    e.target.checked
                                  )
                                }
                                className="rounded border-gray-300"
                              />
                              <Label
                                htmlFor={document.document_name}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {document.document_name}
                              </Label>
                            </div>
                          ))}
                        {/* Render "Other" checkbox at the end */}
                        {documents
                          .filter((doc) => doc.document_name?.toLowerCase() === "other")
                          .map((document) => (
                            <div
                              key={document.document_name}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="checkbox"
                                id={document.document_name}
                                checked={formData.selectedDocuments.includes(
                                  document.document_name
                                )}
                                onChange={(e) =>
                                  handleDocumentSelection(
                                    document.document_name,
                                    e.target.checked
                                  )
                                }
                                className="rounded border-gray-300"
                              />
                              <Label
                                htmlFor={document.document_name}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {document.document_name}
                              </Label>
                            </div>
                          ))}
                        {/* Input field for "Other" document name */}
                        {isOtherDocumentSelected && (
                          <div className="ml-6 mt-2 space-y-2">
                            <div className="flex items-center space-x-2">
                              <Input
                                type="text"
                                value={otherDocumentName}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setOtherDocumentName(value);
                                  // Update custom document name
                                  setCustomDocumentNames((prev) => ({
                                    ...prev,
                                    "Other": value,
                                  }));
                                }}
                                onKeyDown={(e) => {
                                  // Call API when user presses Enter
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const value = otherDocumentName.trim();
                                    if (value && value !== "") {
                                      createDocumentCategory(value);
                                    }
                                  }
                                }}
                                placeholder="Enter custom document name"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                onClick={() => {
                                  const value = otherDocumentName.trim();
                                  if (value && value !== "") {
                                    createDocumentCategory(value);
                                  } else {
                                    toast({
                                      title: "Error",
                                      description: "Please enter a document name",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                className="bg-primary-500 hover:bg-primary-600 text-white"
                              >
                                Submit
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">
                        No documents available for this case type
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Assignment Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Assignment & Review
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Assigned To</Label>
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) =>
                      handleSelectChange("assigned_to", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingUsers ? (
                        <SelectItem value="loading" disabled>
                          Loading employees...
                        </SelectItem>
                      ) : users.length > 0 ? (
                        users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-users" disabled>
                          No employees available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Customer</Label>
                  <div className="flex items-center space-x-3">
                    {!hideCustomerDropdown ? (
                      <Select
                        value={formData.customer_id || ""}
                        onValueChange={handleCustomerChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingCustomers ? (
                            <SelectItem value="loading" disabled>
                              Loading customers...
                            </SelectItem>
                          ) : customers.length > 0 ? (
                            customers.map((customer) => (
                              <SelectItem
                                key={customer.customer_id}
                                value={customer.customer_id.toString()}
                              >
                                {customer.customer_name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-customers" disabled>
                              No customers available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="w-full p-3 border rounded-md bg-gray-50">
                        <span className="text-sm font-medium">
                          {newCustomer.first_name} {newCustomer.last_name}
                        </span>
                      </div>
                    )}
                    <Dialog
                      open={createCustomerOpen}
                      onOpenChange={(open) => {
                        setCreateCustomerOpen(open);
                        if (open) {
                          // Hide the customer dropdown when dialog opens
                          setHideCustomerDropdown(true);
                          // Log the current role when dialog opens
                          console.log(
                            "Create customer dialog opened with role:",
                            newCustomer.role
                          );
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-white border-2 border-gray-300 hover:border-primary-500 hover:bg-gray-50 text-black"
                        >
                          Create New Customer
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-4xl w-[96vw] p-0">
                        <DialogHeader>
                          <DialogTitle className="px-4 sm:px-6 pt-4">
                            Create New Customer
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4 px-4 sm:px-6 max-h-[75vh] overflow-y-auto">
                          <div className="rounded-lg border bg-white p-4 sm:p-5 shadow-sm">
                            <h4 className="text-lg font-semibold mb-4">
                              Basic Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div>
                                <Label>First Name *</Label>
                                <Input
                                  value={newCustomer.first_name}
                                  onChange={(e) =>
                                    setNewCustomer({
                                      ...newCustomer,
                                      first_name: e.target.value,
                                    })
                                  }
                                  placeholder="Enter first name"
                                />
                              </div>
                              <div>
                                <Label>Last Name *</Label>
                                <Input
                                  value={newCustomer.last_name}
                                  onChange={(e) =>
                                    setNewCustomer({
                                      ...newCustomer,
                                      last_name: e.target.value,
                                    })
                                  }
                                  placeholder="Enter last name"
                                />
                              </div>
                              <div>
                                <Label>Email Address </Label>
                                <Input
                                  type="email"
                                  value={newCustomer.email}
                                  onChange={(e) =>
                                    setNewCustomer({
                                      ...newCustomer,
                                      email: e.target.value,
                                    })
                                  }
                                  placeholder="customer@example.com"
                                />
                              </div>
                              <div>
                                <Label>Mobile Number *</Label>
                                <Input
                                  value={newCustomer.mobile}
                                  onChange={(e) =>
                                    setNewCustomer({
                                      ...newCustomer,
                                      mobile: e.target.value,
                                    })
                                  }
                                  placeholder="Enter mobile number"
                                  maxLength={10}
                                  minLength={10}
                                />
                              </div>
                              <div>
                                <Label>Emergency Contact</Label>
                                <Input
                                  value={newCustomer.emergency_contact}
                                  onChange={(e) =>
                                    setNewCustomer({
                                      ...newCustomer,
                                      emergency_contact: e.target.value,
                                    })
                                  }
                                  placeholder="Enter emergency contact"
                                  maxLength={10}
                                  minLength={10}
                                />
                              </div>
                              <div>
                                <Label>Gender</Label>
                                <Select
                                  value={newCustomer.gender}
                                  onValueChange={(v) =>
                                    setNewCustomer({
                                      ...newCustomer,
                                      gender: v,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">
                                      Female
                                    </SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Age</Label>
                                <Input
                                  value={newCustomer.age}
                                  onChange={(e) =>
                                    setNewCustomer({
                                      ...newCustomer,
                                      age: e.target.value,
                                    })
                                  }
                                  placeholder="Enter age"
                                />
                              </div>
                              <div>
                                <Label>Claims Number</Label>
                                <Input
                                  value={newCustomer.claims_number}
                                  onChange={(e) =>
                                    setNewCustomer({
                                      ...newCustomer,
                                      claims_number: e.target.value,
                                    })
                                  }
                                  placeholder="Enter claim number"
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <Label>Address</Label>
                              <Input
                                value={newCustomer.address}
                                onChange={(e) =>
                                  setNewCustomer({
                                    ...newCustomer,
                                    address: e.target.value,
                                  })
                                }
                                placeholder="Enter address"
                              />
                            </div>
                          </div>
                          <div className="rounded-lg border bg-white p-4 sm:p-5 shadow-sm">
                            <h4 className="text-lg font-semibold mb-4">
                              Customer Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div>
                                <Label>Customer Type</Label>
                                <Select
                                  value={newCustomer.customer_type}
                                  onValueChange={(v) =>
                                    setNewCustomer({
                                      ...newCustomer,
                                      customer_type: v,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select customer type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Individual">
                                      Individual
                                    </SelectItem>
                                    <SelectItem value="Corporate">
                                      Corporate
                                    </SelectItem>
                                    <SelectItem value="Enterprise">
                                      Enterprise
                                    </SelectItem>
                                    <SelectItem value="Government">
                                      Government
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Communication Preferences</Label>
                                <Select
                                  value={newCustomer.communication_preference}
                                  onValueChange={(v) =>
                                    setNewCustomer({
                                      ...newCustomer,
                                      communication_preference: v,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select communication preference" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Email">Email</SelectItem>
                                    <SelectItem value="Phone">Phone</SelectItem>
                                    <SelectItem value="SMS">SMS</SelectItem>
                                    <SelectItem value="WhatsApp">
                                      WhatsApp
                                    </SelectItem>
                                    <SelectItem value="Postal Mail">
                                      Postal Mail
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Source</Label>
                                <Select
                                  value={newCustomer.source}  
                                  onValueChange={(v) =>
                                    setNewCustomer({
                                      ...newCustomer,
                                      source: v,
                                      partner:
                                        v === "Referral"
                                          ? newCustomer.partner
                                          : "",
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select source" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Website">
                                      Website
                                    </SelectItem>
                                    <SelectItem value="Referral">
                                      Referral
                                    </SelectItem>
                                    <SelectItem value="Social Media">
                                      Social Media
                                    </SelectItem>
                                    <SelectItem value="Advertisement">
                                      Advertisement
                                    </SelectItem>
                                    <SelectItem value="Direct Contact">
                                      Direct Contact
                                    </SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {/* {newCustomer.source === 'Referral' && ( */}
                              <div>
                                <Label>Partner</Label>
                                <Select
                                  value={newCustomer.partner}
                                  onValueChange={(v) =>
                                    setNewCustomer({
                                      ...newCustomer,
                                      partner: v,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select partner" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {isLoadingPartners ? (
                                      <SelectItem value="loading" disabled>
                                        Loading partners...
                                      </SelectItem>
                                    ) : partners.length > 0 ? (
                                      partners.map((partner) => (
                                        <SelectItem key={partner.partner_id} value={`${partner.first_name} ${partner.last_name}`}>
                                          {partner.first_name} {partner.last_name}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="no-pa.rtners" disabled>
                                        No partners available
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              {/* )} */}
                              <div>
                                <Label>Language Preference</Label>
                                <Popover open={languageComboboxOpen} onOpenChange={setLanguageComboboxOpen}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={languageComboboxOpen}
                                      className="w-full justify-between mt-1"
                                    >
                                      {newCustomer.language_preference || "Select language or type to add new..."}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command shouldFilter={false}>
                                      <CommandInput 
                                        placeholder="Search language or type new language name..." 
                                        value={newCustomer.language_preference}
                                        onValueChange={(value) => setNewCustomer(prev => ({ ...prev, language_preference: value }))}
                                      />
                                      <CommandList>
                                        <CommandGroup>
                                          {newCustomer.language_preference && 
                                           newCustomer.language_preference.trim() !== '' && 
                                           newCustomer.language_preference.trim().toLowerCase() !== "telugu" &&
                                           newCustomer.language_preference.trim().toLowerCase() !== "english" &&
                                           newCustomer.language_preference.trim().toLowerCase() !== "hindi" &&
                                           newCustomer.language_preference.trim().toLowerCase() !== "kannada" &&
                                           newCustomer.language_preference.trim().toLowerCase() !== "tamil" && (
                                            <CommandItem
                                              value={newCustomer.language_preference}
                                              onSelect={() => {
                                                setNewCustomer(prev => ({ ...prev, language_preference: newCustomer.language_preference }));
                                                setLanguageComboboxOpen(false);
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  "opacity-100"
                                                )}
                                              />
                                              {newCustomer.language_preference} 
                                            </CommandItem>
                                          )}
                                          <CommandItem
                                            value="Telugu"
                                            onSelect={() => {
                                              setNewCustomer(prev => ({ ...prev, language_preference: "Telugu" }));
                                              setLanguageComboboxOpen(false);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                newCustomer.language_preference?.trim().toLowerCase() === "telugu" ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            Telugu
                                          </CommandItem>
                                          <CommandItem
                                            value="English"
                                            onSelect={() => {
                                              setNewCustomer(prev => ({ ...prev, language_preference: "English" }));
                                              setLanguageComboboxOpen(false);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                newCustomer.language_preference?.trim().toLowerCase() === "english" ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            English
                                          </CommandItem>
                                          <CommandItem
                                            value="Hindi"
                                            onSelect={() => {
                                              setNewCustomer(prev => ({ ...prev, language_preference: "Hindi" }));
                                              setLanguageComboboxOpen(false);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                newCustomer.language_preference?.trim().toLowerCase() === "hindi" ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            Hindi
                                          </CommandItem>
                                          <CommandItem
                                            value="Kannada"
                                            onSelect={() => {
                                              setNewCustomer(prev => ({ ...prev, language_preference: "Kannada" }));
                                              setLanguageComboboxOpen(false);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                newCustomer.language_preference?.trim().toLowerCase() === "kannada" ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            Kannada
                                          </CommandItem>
                                          <CommandItem
                                            value="Tamil"
                                            onSelect={() => {
                                              setNewCustomer(prev => ({ ...prev, language_preference: "Tamil" }));
                                              setLanguageComboboxOpen(false);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                newCustomer.language_preference?.trim().toLowerCase() === "tamil" ? "opacity-100" : "opacity-0"
                                              )}
                                            />
                                            Tamil
                                          </CommandItem>
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                            <div className="mt-4">
                              <Label>Notes</Label>
                              <Textarea
                                value={newCustomer.notes}
                                onChange={(e) =>
                                  setNewCustomer({
                                    ...newCustomer,
                                    notes: e.target.value,
                                  })
                                }
                                placeholder="Any additional notes"
                                rows={4}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                              <div>
                                <Label>GSTIN</Label>
                                <Input
                                  value={newCustomer.gstin}
                                  onChange={(e) => {
                                    const value = e.target.value.toUpperCase().replace(/\s/g, '');
                                    setNewCustomer({
                                      ...newCustomer,
                                      gstin: value,
                                    });
                                  }}
                                  placeholder="Enter 15-character GSTIN"
                                  maxLength={15}
                                  style={{ textTransform: 'uppercase' }}
                                />
                              </div>

                              <div>
                                <Label>PAN</Label>
                                <Input
                                  value={newCustomer.pan_number}
                                  onChange={(e) => {
                                    const value = e.target.value.toUpperCase().replace(/\s/g, '');
                                    setNewCustomer({
                                      ...newCustomer,
                                      pan_number: value,
                                    });
                                  }}
                                  placeholder="Enter 10-character PAN"
                                  maxLength={10}
                                  style={{ textTransform: 'uppercase' }}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                              <div>
                                <Label>State</Label>
                                <Input
                                  value={newCustomer.state}
                                  onChange={(e) =>
                                    setNewCustomer({
                                      ...newCustomer,
                                      state: e.target.value,
                                    })
                                  }
                                  placeholder="Enter state"
                                />
                              </div>

                              <div>
                                <Label>Pincode</Label>
                                <Input
                                  value={newCustomer.pincode}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^\d*$/.test(value) && value.length <= 6) {
                                      setNewCustomer({
                                        ...newCustomer,
                                        pincode: value,
                                      });
                                    }
                                  }}
                                  placeholder="Enter 6-digit pincode"
                                  maxLength={6}
                                  inputMode="numeric"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <DialogFooter className="px-4 sm:px-6 pb-4">
                          <Button
                            variant="outline"
                            onClick={() => setCreateCustomerOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCreateCustomer}
                            className="bg-white border-2 border-gray-300 hover:border-primary-500 hover:bg-gray-50 text-black"
                          >
                            Create Customer
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                {formData.ticket_stage === "review" && (
                  <div>
                    <Label>Reviewer</Label>
                    <Select
                      value={formData.reviewer_id}
                      onValueChange={(value) =>
                        handleSelectChange("reviewer_id", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reviewer" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.ticket_stage === "approval" && (
                  <div>
                    <Label>Approver</Label>
                    <Select
                      value={formData.approver_id}
                      onValueChange={(value) =>
                        handleSelectChange("approver_id", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select approver" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Priority & Status Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Priority & Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      handleSelectChange("priority", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">low</SelectItem>
                      <SelectItem value="medium">medium</SelectItem>
                      <SelectItem value="high">high</SelectItem>
                      <SelectItem value="critical">critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ticket Stage</Label>
                  <Select
                    value={formData.ticket_stage}
                    onValueChange={(value) =>
                      handleSelectChange("ticket_stage", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Under Evaluation">
                        Under Evaluation
                      </SelectItem>
                      <SelectItem value="Evaluation under review">
                        Evaluation under review
                      </SelectItem>
                      <SelectItem value="Evaluated">Evaluated</SelectItem>
                      <SelectItem value="Agreement pending">
                        Agreement pending
                      </SelectItem>
                      <SelectItem value="1st Instalment Pending">
                        1st Instalment Pending
                      </SelectItem>
                      <SelectItem value="Pending with grievance cell of insurance company">
                        Pending with grievance cell of insurance company
                      </SelectItem>
                      <SelectItem value="Pending with Ombudsman">
                        Pending with Ombudsman
                      </SelectItem>
                      <SelectItem value="Under Litigation/Consumer Forum">
                        Under Litigation/Consumer Forum
                      </SelectItem>
                      <SelectItem value="Under Arbitration">
                        Under Arbitration
                      </SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Partner Payment Pending">
                        Partner Payment Pending
                      </SelectItem>
                      <SelectItem value="Partner Payment Done">
                        Partner Payment Done
                      </SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                      <SelectItem value="on hold">on hold</SelectItem>
                      <SelectItem defaultChecked value="Under process">
                        Under process
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Assign Date *</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      due_date: e.target.value,
                    }))
                  }
                  className="w-full"
                />
              </div>
            </div>

            {formData.caseType === "commercial-insurance" && (
              <div className="space-y-2">
                <Label>Stakeholders</Label>
                <div className="space-y-2">
                  {stakeholders.map((stakeholder) => (
                    <Badge
                      key={stakeholder.id}
                      variant="secondary"
                      className="flex items-center justify-between w-full rounded-full"
                    >
                      {stakeholder.name} - {stakeholder.role} (
                      {stakeholder.contact})
                      {stakeholder.contact_email &&
                        ` | ${stakeholder.contact_email}`}
                      {stakeholder.notes && ` | Notes: ${stakeholder.notes}`}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full hover:bg-gray-200"
                        onClick={() => removeStakeholder(stakeholder.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </Badge>
                  ))}
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="text"
                      placeholder="Name"
                      value={newStakeholder.name}
                      onChange={(e) =>
                        setNewStakeholder({
                          ...newStakeholder,
                          name: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="text"
                      placeholder="Contact"
                      value={newStakeholder.contact}
                      onChange={(e) =>
                        setNewStakeholder({
                          ...newStakeholder,
                          contact: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="email"
                      placeholder="Contact Email"
                      value={newStakeholder.contact_email}
                      onChange={(e) =>
                        setNewStakeholder({
                          ...newStakeholder,
                          contact_email: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="text"
                      placeholder="Role"
                      value={newStakeholder.role}
                      onChange={(e) =>
                        setNewStakeholder({
                          ...newStakeholder,
                          role: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Textarea
                    placeholder="Notes (optional)"
                    value={newStakeholder.notes}
                    onChange={(e) =>
                      setNewStakeholder({
                        ...newStakeholder,
                        notes: e.target.value,
                      })
                    }
                    rows={2}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full bg-white border-2 border-gray-300 hover:border-primary-500 hover:bg-gray-50 text-black"
                    onClick={addStakeholder}
                  >
                    Add Stakeholder <Plus className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Comment</Label>
              <div className="space-y-2">
                <Textarea
                  placeholder="Add comment"
                  value={comment.text}
                  onChange={(e) =>
                    setComment({ ...comment, text: e.target.value })
                  }
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="internal"
                    checked={comment.isInternal}
                    onChange={() =>
                      setComment({
                        ...comment,
                        isInternal: !comment.isInternal,
                      })
                    }
                  />
                  <Label htmlFor="internal">Internal</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Stakeholders
              </h3>
              <div className="space-y-4">
                {stakeholders.map((stakeholder) => (
                  <div
                    key={stakeholder.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{stakeholder.name}</div>
                      <div className="text-sm text-gray-600">
                        {stakeholder.contact_email}
                      </div>
                      <div className="text-sm text-gray-600">
                        Role: {stakeholder.role}
                      </div>
                      {stakeholder.notes && (
                        <div className="text-sm text-gray-500 mt-1">
                          {stakeholder.notes}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStakeholder(stakeholder.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {stakeholders.length == 0 && (
                  <>
                    <div className="space-y-3 p-4 border rounded-lg bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Name *</Label>
                          <Input
                            placeholder="John Stakeholder"
                            value={newStakeholder.name}
                            onChange={(e) =>
                              setNewStakeholder({
                                ...newStakeholder,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Contact Email *</Label>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            value={newStakeholder.contact_email}
                            onChange={(e) =>
                              setNewStakeholder({
                                ...newStakeholder,
                                contact_email: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Role *</Label>
                          <Input
                            type="text"
                            value={newStakeholder.role}
                            onChange={(e) =>
                              setNewStakeholder({
                                ...newStakeholder,
                                role: e.target.value,
                              })
                            }
                            placeholder="Enter role"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Input
                            placeholder="Important reviewer"
                            value={newStakeholder.notes}
                            onChange={(e) =>
                              setNewStakeholder({
                                ...newStakeholder,
                                notes: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={addStakeholder}
                      className="w-full"
                      disabled={
                        !newStakeholder.name.trim() ||
                        !newStakeholder.contact_email.trim() ||
                        !newStakeholder.role.trim()
                      }
                    >
                      Add Stakeholder
                    </Button>
                  </>
                )}
                

                {/* Test Button to Add Sample Stakeholder */}
                {/* <Button 
                    type="button" 
                    onClick={() => {
                      const testStakeholder = {
                        id: Date.now().toString(),
                        name: 'John Stakeholder',
                        contact: '',
                        contact_email: 'john@example.com',
                        role: 'Reviewer',
                        notes: 'Important reviewer'
                      };
                      console.log('Adding test stakeholder:', testStakeholder);
                      setStakeholders(prev => [...prev, testStakeholder]);
                      toast({
                        title: "Test Stakeholder Added",
                        description: "Sample stakeholder added for testing",
                      });
                    }}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                  >
                    Add Test Stakeholder (John)
                  </Button> */}

                {/* Force Add Exact Payload Structure */}
                {/* <Button 
                    type="button" 
                    onClick={() => {
                      // Force add the exact stakeholder structure you want
                      const exactStakeholder = {
                        id: 'force-test-' + Date.now().toString(),
                        name: 'John Stakeholder',
                        contact: '',
                        contact_email: 'john@example.com',
                        role: 'Reviewer',
                        notes: 'Important reviewer'
                      };
                      console.log('Force adding exact stakeholder structure:', exactStakeholder);
                      setStakeholders([exactStakeholder]); // Replace all stakeholders with this one
                      toast({
                        title: "Exact Stakeholder Structure Added",
                        description: "Stakeholder with exact payload structure added",
                      });
                    }}
                    className="w-full mt-2 bg-green-600 hover:bg-green-700"
                  >
                    Force Add Exact Structure
                  </Button> */}
              </div>
            </div>

            {/* Stakeholders Section */}

            {/* Payment Section */}
            {formData.caseType && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Payment Management
                </h3>
                <div className="text-sm text-gray-600 mb-2">
                  Current Case Type: {formData.caseType}
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    Payment Stages
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPaymentForm(true)}
                    disabled={getAvailablePhases().length === 0}
                    className="flex items-center space-x-2 bg-white border-2 border-gray-300 hover:border-primary-500 hover:bg-gray-50 text-black"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Payment</span>
                  </Button>
                </div>

                {/* Payment Stages List */}
                {paymentStages.length > 0 && (
                  <div className="space-y-3">
                    {paymentStages.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {payment.phase_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                Due: {payment.due_date}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-blue-600">
                                ₹{payment.phase_amount.toLocaleString("en-IN")}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePayment(payment.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {/* Payment Summary */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">
                          Total Amount:
                        </span>
                        <span className="text-xl font-bold text-blue-600">
                          ₹{getTotalAmount().toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {paymentStages.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No payment stages added yet.
                  </p>
                )}
              </div>
            )}

            {/* Payment Form Dialog */}
            <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
              <DialogContent className="max-w-md overflow-y-auto max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Add Payment Stage</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="phase">Phase</Label>
                    <Select
                      value={newPayment.phase}
                      onValueChange={(value) => {
                        setNewPayment({
                          ...newPayment,
                          phase: value,
                          phase_name: value, // Set phase_name to the full selected phase text
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select phase" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailablePhases().length > 0 ? (
                          getAvailablePhases().map((stage) => (
                            <SelectItem key={stage.phase} value={stage.phase}>
                              {stage.phase}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-phases" disabled>
                            No phases available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="due_date">Payment Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={newPayment.due_date}
                      onChange={(e) =>
                        setNewPayment({
                          ...newPayment,
                          due_date: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="phase_amount">Paid Amount (₹)</Label>
                    <Input
                      id="phase_amount"
                      type="number"
                      value={
                        newPayment.phase_amount === 0
                          ? ""
                          : newPayment.phase_amount
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          setNewPayment({ ...newPayment, phase_amount: 0 });
                        } else {
                          const numValue = parseFloat(value);
                          if (!isNaN(numValue)) {
                            setNewPayment({
                              ...newPayment,
                              phase_amount: numValue,
                            });
                          }
                        }
                      }}
                      placeholder="Enter paid amount"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleAddPayment}
                    className="bg-white border-2 border-gray-300 hover:border-primary-500 hover:bg-gray-50 text-black"
                  >
                    Add Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Document Uploads Section */}
            {formData.selectedDocuments.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Document Uploads
                </h3>
                {formData.selectedDocuments.map((documentName) => {
                  // Use custom document name if "Other" is selected and has a custom name
                  const displayName = documentName === "Other" && customDocumentNames["Other"]
                    ? customDocumentNames["Other"]
                    : documentName;
                  
                  return (
                    <div
                      key={documentName}
                      className="space-y-4 p-4 border rounded-lg bg-gray-50"
                    >
                      <h4 className="text-md font-semibold">{displayName}</h4>
                      <div>
                        <Label htmlFor={`upload-${documentName}`}>
                          Upload {displayName} *
                        </Label>
                      <div
                        onDragEnter={(e) => handleDragEnter(e, documentName)}
                        onDragLeave={(e) => handleDragLeave(e, documentName)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, documentName)}
                        className={`mt-2 border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                          dragActive[documentName]
                            ? "border-primary-500 bg-primary-50"
                            : "border-gray-300 bg-white hover:border-gray-400"
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="flex flex-col items-center space-y-2">
                            <Upload
                              className={`h-8 w-8 ${
                                dragActive[documentName]
                                  ? "text-primary-500"
                                  : "text-gray-400"
                              }`}
                            />
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-700">
                                {dragActive[documentName]
                                  ? "Drop file here"
                                  : "Drag and drop your file here"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                or click to browse
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Input
                              type="file"
                              id={`upload-${documentName}`}
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0] || null;
                                if (file) {
                                  await handleDocumentUpload(documentName, file);
                                  if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
                                    toast({
                                      title: "File Added",
                                      description: `${file.name} converted to PDF`,
                                    });
                                  }
                                } else {
                                  await handleDocumentUpload(documentName, null);
                                }
                              }}
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            />
                            <Label
                              htmlFor={`upload-${documentName}`}
                              className="cursor-pointer py-2 px-4 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors duration-200"
                            >
                              <span>Choose File</span>
                            </Label>
                          </div>
                          {documentUploads[documentName]?.file && (
                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md w-full">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-5 w-5 text-green-600" />
                                <span className="text-sm font-medium text-green-800">
                                  {documentUploads[documentName].file?.name}
                                </span>
                                <span className="text-xs text-green-600 ml-auto">
                                  {documentUploads[documentName].file &&
                                    (
                                      documentUploads[documentName].file.size /
                                      1024
                                    ).toFixed(2)}{" "}
                                  KB
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 5MB)
                      </p>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full bg-white border-2 border-gray-300 hover:border-primary-500 hover:bg-gray-50 text-black"
              onClick={handleSubmit}
              disabled={isSubmitting || isUploadingDocuments}
            >
              {isSubmitting ? (
                <>Creating Task...</>
              ) : isUploadingDocuments ? (
                <>Uploading Documents...</>
              ) : (
                <>Create Task</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewTask;


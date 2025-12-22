import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, X, Upload, FileText, ArrowLeft, ZoomIn, ZoomOut, RotateCcw, XCircle, Check, ChevronsUpDown, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

import { useAuth } from '@/contexts/AuthContext';
import { CaseTypeService, CaseType } from '@/services/caseTypeService';
import { EmployeeService, Employee } from '@/services/employeeService';
import { DocumentService, Document } from '@/services/documentService';
import { CustomerService, Customer } from '@/services/customerService';
import { TaskService, TaskCreateRequest, TaskStakeholder, TaskCustomer } from '@/services/taskService';
import { prepareInvoiceData, generateAndDownloadInvoice } from '@/services/invoiceService';

// Extended Customer interface for the API response
interface ExtendedCustomer {
    customer_id: number;
    customer_name: string;
    email_address?: string;
    mobile_number?: string;
    customer_type?: string;
    address?: string;
    notes?: string;
    source?: string;
    partner?: string;
    language_preference?: string;
    communication_preferences?: string;
    emergency_contact?: string;
    company_name?: string;
    gstin?: string;
    pan?: string;
    state?: string;
    pincode?: string;
    user_id?: number;
    created_by?: number;
    updated_by?: number;
    created_time?: string;
    updated_time?: string;
    deleted_flag?: boolean;
}

type TaskStatus = 'new' | 'in_progress' | 'completed' | 'cancelled';
type TicketStage = 'analysis' | 'development' | 'testing' | 'deployment' | 'closed' | 'review' | 'approval';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Stakeholder {
    id: string;
    stakeholder_name: string;
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


interface User {
    id: string;
    full_name: string;
}

interface Category {
    id: string;
    name: string;
    description: string;
}


const EditTask = () => {
    const { taskId } = useParams<{ taskId: string }>();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        task_summary: '',
        service_amount: '',
        claims_amount: '',
        priority: 'medium' as TaskPriority,
        ticket_stage: 'analysis' as TicketStage,
        current_status: 'new' as TaskStatus,
        due_date: '',
        assigned_to: '',
        customer_id: '',
        reviewer_id: '',
      partner_id: '',

        approver_id: '',
        estimatedDuration: '',
        caseType: '',
        selectedDocuments: [] as string[],
    });

      const [partners, setPartners] = useState<
        Array<{
          partner_id: number;
          user_id: number;
          first_name: string;
          last_name: string;
        }>
      >([]);
    const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
    const [newStakeholder, setNewStakeholder] = useState({ name: '', contact: '', contact_email: '', role: '', notes: '' });
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState({ text: '', isInternal: false });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
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
        userName: string;
        password_hash: string;
        role: string;
    }>({
        first_name: '',
        last_name: '',
        email: '',
        mobile: '',
        emergency_contact: '',
        gender: '',
        age: '',
        address: '',
        customer_type: '',
        source: '',
        partner: '',
        communication_preference: '',
        language_preference: '',
        notes: '',
        userName: '',
        password_hash: '',
        role: ''
    });
    const mockPartners = [
        { id: 'p1', name: 'Acme Insurance' },
        { id: 'p2', name: 'Global Brokers' },
        { id: 'p3', name: 'Sunrise Associates' }
    ];
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [documentTypes, setDocumentTypes] = useState<{ [key: string]: string }>({});
    const [customDocumentNames, setCustomDocumentNames] = useState<{ [key: string]: string }>({});
    const [isOtherDocumentSelected, setIsOtherDocumentSelected] = useState(false);
    const [otherDocumentName, setOtherDocumentName] = useState("");
    
    // Document modal state
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [documentUrl, setDocumentUrl] = useState('');
    const [documentType, setDocumentType] = useState('');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [paymentStages, setPaymentStages] = useState<any[]>([]);
    const [editablePaymentStages, setEditablePaymentStages] = useState<any[]>([]);
    const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
    const [isLoadingCaseTypes, setIsLoadingCaseTypes] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [customers, setCustomers] = useState<ExtendedCustomer[]>([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<ExtendedCustomer | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const [documentUploads, setDocumentUploads] = useState<{ [key: string]: { file: File | null } }>({});
    const [documentCategories, setDocumentCategories] = useState<{ [key: string]: number }>({});
    const [createdCaseId, setCreatedCaseId] = useState<number | null>(null);
    const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
    const [dragActive, setDragActive] = useState<{ [key: string]: boolean }>({});
    const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
    const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);
    const [isLoadingUploadedDocuments, setIsLoadingUploadedDocuments] = useState(false);
    const [employees, setEmployees] = useState<{employee_id: number, employee_name: string}[]>([]);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
    const [currentTaskData, setCurrentTaskData] = useState<any>(null);
    const [showPaymentPhaseModal, setShowPaymentPhaseModal] = useState(false);
    const [paymentPhaseForm, setPaymentPhaseForm] = useState({
        phase_name: '',
        due_date: '',
        phase_amount: 0,
        status: 'pending' as 'paid' | 'pending'
    });
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [paymentDateCalendarOpenIndex, setPaymentDateCalendarOpenIndex] = useState<number | null>(null);
    const [phaseNameComboboxOpen, setPhaseNameComboboxOpen] = useState(false);
    const [phaseNameComboboxOpenIndex, setPhaseNameComboboxOpenIndex] = useState<number | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { session, userDetails } = useAuth();

    // Mock authentication state for development/testing
    const mockAuth = {
        session: {
            sessionId: 'mock-session-id',
            jwtToken: 'mock-jwt-token',
            userId: 'mock-user-id',
            userRole: 'employee',
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
        },
        userDetails: {
            id: 'mock-user-id',
            full_name: 'Mock User',
            email: 'mock@example.com',
            role: 'employee'
        }
    };

    // Use mock auth if real auth is not available
    const effectiveSession = session || mockAuth.session;
    const effectiveUserDetails = userDetails || mockAuth.userDetails;

    // Determine the appropriate dashboard based on user role
    const getDashboardRoute = () => {
        console.log('getDashboardRoute called');
        console.log('location.state:', location.state);
        console.log('document.referrer:', document.referrer);
        console.log('session:', session);
        console.log('userDetails:', userDetails);

        // Check if we came from a specific dashboard
        if (location.state?.from === 'admin-dashboard') {
            console.log('Returning admin-dashboard from location.state');
            return '/admin-dashboard';
        }

        if (location.state?.from === 'employee-dashboard') {
            console.log('Returning employee-dashboard from location.state');
            return '/employee-dashboard';
        }

        // Check referrer for dashboard paths
        const referrer = document.referrer;
        if (referrer.includes('/admin-dashboard')) {
            console.log('Returning admin-dashboard from referrer');
            return '/admin-dashboard';
        }

        if (referrer.includes('/employee-dashboard')) {
            console.log('Returning employee-dashboard from referrer');
            return '/employee-dashboard';
        }

        // Check user role from session or user details
        const userRole = effectiveSession?.userRole || effectiveUserDetails?.role;
        console.log('User role determined:', userRole);

        if (userRole === 'admin') {
            console.log('Returning admin-dashboard from user role');
            return '/admin-dashboard';
        } else if (userRole === 'employee' || userRole === 'hr') {
            console.log('Returning employee-dashboard from user role:', userRole);
            return '/employee-dashboard';
        }

        // Default to employee dashboard if role is not clear
        // This ensures we always have a valid route
        console.log('Returning default employee-dashboard');
        return '/employee-dashboard';
    };

    // Fetch task data from API
    const fetchTaskData = async () => {
        if (!taskId) {
            toast({
                title: "Error",
                description: "No task ID provided",
                variant: "destructive",
            });
            navigate('/admin-dashboard');
            return;
        }

        setIsLoading(true);
        try {
            console.log('Fetching task data for ID:', taskId);

            const response = await fetch(`http://localhost:3000/support/everything-cases`, {
                method: 'POST',
                headers: {
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'accept-profile': 'srtms',
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
                    'authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws`,
                    'content-type': 'application/json',
                    'jwt_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k',
                    'origin': 'http://localhost:8080',
                    'priority': 'u=1, i',
                    'referer': 'http://localhost:8080/',
                    'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'cross-site',
                    'session_id': 'fddc661a-dfb4-4896-b7b1-448e1adf7bc2',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
                    'Range': '0-100',
                    'Prefer': 'count=exact'
                },
                body: JSON.stringify({
                    case_id: taskId
                })
            });

            if (response.ok) {
                const responseData = await response.json();
                console.log('Task data received:', responseData);

                // Handle both array and object response formats
                let taskData: any;
                if (Array.isArray(responseData) && responseData.length > 0) {
                    taskData = responseData[0]; // Take the first item from the array
                    console.log('Extracted task data from array:', taskData);
                } else if (responseData && typeof responseData === 'object' && 'case_id' in responseData) {
                    taskData = responseData; // Direct object response
                    console.log('Direct task data:', taskData);
                } else {
                    toast({
                        title: "Error",
                        description: "Task not found or invalid response format",
                        variant: "destructive",
                    });
                    navigate('/admin-dashboard');
                    return;
                }

                // Populate the form with the task data
                populateFormWithTaskData(taskData);
            } else {
                console.error('Failed to fetch task data:', response.status);
                toast({
                    title: "Error",
                    description: "Failed to fetch task data",
                    variant: "destructive",
                });
                navigate('/admin-dashboard');
            }
        } catch (error) {
            console.error('Error fetching task data:', error);
            toast({
                title: "Error",
                description: "Failed to fetch task data",
                variant: "destructive",
            });
            navigate('/admin-dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    // Populate form with task data
    const populateFormWithTaskData = (taskData: any) => {
        console.log('Populating form with task data:', taskData);

        // Store the task data to access employee information
        setCurrentTaskData(taskData);

        setFormData({
            title: taskData.title || '',
            description: taskData.case_description || '',
            task_summary: taskData.case_summary || '',
            service_amount: (() => {
                // Check multiple possible field names for service amount (API uses "service amount" with space)
                const serviceAmountRaw = (taskData as any)["service amount"]
                    ?? taskData.service_amount 
                    ?? (taskData as any).serviceAmount
                    ?? null;
                
                if (serviceAmountRaw !== null && serviceAmountRaw !== undefined && serviceAmountRaw !== '') {
                    return String(serviceAmountRaw);
                }
                return '';
            })(),
            claims_amount: (() => {
                // Check multiple possible field names for claim amount (API uses "claim amount" with space)
                const claimAmountRaw = (taskData as any)["claim amount"]
                    ?? taskData.claim_amount 
                    ?? taskData.claims_amount
                    ?? (taskData as any).claimAmount
                    ?? (taskData as any).claimsAmount
                    ?? null;
                
                if (claimAmountRaw !== null && claimAmountRaw !== undefined && claimAmountRaw !== '') {
                    return String(claimAmountRaw);
                }
                return '';
            })(),
            priority: taskData.priority || 'medium',
            ticket_stage: taskData.ticket_stage || 'analysis',
            current_status: taskData.current_status || 'new',
            due_date: taskData.due_date || '',
            assigned_to: taskData.assigned_to ? String(taskData.assigned_to) : '',
            customer_id: taskData.customer_id?.toString() || '',
            reviewer_id: taskData.reviewer_id || '',
            approver_id: taskData.approver_id || '',
            partner_id: taskData.referring_partner_id?.toString() || '',
            estimatedDuration: taskData.estimatedDuration || '',
            caseType: taskData.case_types?.case_type_name || '',
            selectedDocuments: [], // Start with empty array - only populate when user checks boxes
        });
        
        // Helper function to get service amount from various field names
        const getServiceAmount = () => {
            return (taskData as any)["service amount"] ?? taskData.service_amount ?? (taskData as any).serviceAmount ?? null;
        };
        
        // Helper function to get claim amount from various field names
        const getClaimAmount = () => {
            return (taskData as any)["claim amount"] ?? taskData.claim_amount ?? taskData.claims_amount ?? (taskData as any).claimAmount ?? (taskData as any).claimsAmount ?? null;
        };
        
        const serviceAmountValue = getServiceAmount();
        const claimAmountValue = getClaimAmount();
        
        console.log('Form data populated:', {
            'service amount (space)': (taskData as any)["service amount"],
            service_amount: taskData.service_amount,
            serviceAmount: (taskData as any).serviceAmount,
            service_amount_final: serviceAmountValue,
            service_amount_form_value: serviceAmountValue !== null && serviceAmountValue !== undefined && serviceAmountValue !== '' ? String(serviceAmountValue) : '',
            'claim amount (space)': (taskData as any)["claim amount"],
            claim_amount: taskData.claim_amount,
            claims_amount: taskData.claims_amount,
            claimAmount: (taskData as any).claimAmount,
            claimsAmount: (taskData as any).claimsAmount,
            claim_amount_final: claimAmountValue,
            claim_amount_form_value: claimAmountValue !== null && claimAmountValue !== undefined && claimAmountValue !== '' ? String(claimAmountValue) : ''
        });

        // Populate customer data if available
        if (taskData.customers) {
            const customerData = taskData.customers;
            const customerWithId: ExtendedCustomer = {
                customer_id: customerData.customer_id,
                customer_name: `${customerData.first_name} ${customerData.last_name}`.trim(),
                email_address: customerData.email_address,
                mobile_number: customerData.mobile_number,
                customer_type: customerData.customer_type,
                address: customerData.address,
                notes: customerData.notes,
                source: customerData.source,
                partner: customerData.partner,
                language_preference: customerData.language_preference,
                communication_preferences: customerData.communication_preferences,
                emergency_contact: customerData.emergency_contact,
                company_name: customerData.company_name,
                gstin: customerData.gstin || (customerData as any).gstin,
                pan: customerData.pan || (customerData as any).pan_number || (customerData as any).pan,
                state: customerData.state || (customerData as any).state,
                pincode: customerData.pincode || (customerData as any).pincode,
                user_id: customerData.user_id,
                created_by: customerData.created_by,
                updated_by: customerData.updated_by,
                created_time: customerData.created_time,
                updated_time: customerData.updated_time,
                deleted_flag: customerData.deleted_flag
            };

            // Set the current customer data
            setCurrentCustomer(customerWithId);

            // Add customer to the customers list if not already present
            setCustomers(prev => {
                const existingCustomer = prev.find(c => c.customer_id === customerData.customer_id);
                if (!existingCustomer) {
                    return [...prev, customerWithId];
                }
                return prev;
            });
        }

        // Populate stakeholders if available
        if (taskData.case_stakeholders && Array.isArray(taskData.case_stakeholders)) {
            const transformedStakeholders = taskData.case_stakeholders.map((stakeholder: any, index: number) => ({
                id: stakeholder.stakeholder_id?.toString() || `stakeholder-${index}`,
                stakeholder_name: stakeholder.stakeholder_name || '',
                contact: stakeholder.contact_phone || '',
                contact_email: stakeholder.contact_email || '',
                role: stakeholder.role || '',
                notes: stakeholder.notes || ''
            }));
            setStakeholders(transformedStakeholders);
        }



        // Populate comments if available
        if (taskData.case_comments && Array.isArray(taskData.case_comments)) {
            const transformedComments = taskData.case_comments.map((comment: any, index: number) => ({
                id: `comment-${comment.comment_id || index}`,
                text: comment.comment_text || '',
                isInternal: comment.is_internal || false
            }));
            setComments(transformedComments);
        }

        // Populate payment stages if available
        if (taskData.case_payment_phases && Array.isArray(taskData.case_payment_phases)) {
            const transformedPaymentStages = taskData.case_payment_phases.map((payment: any, index: number) => {
                // Always use payment_date if it exists from the API, regardless of due_date
                const paymentDate = payment.payment_date || null;
                
                console.log(`Payment Phase ${index + 1}:`, {
                    phase_name: payment.phase_name,
                    due_date: payment.due_date,
                    payment_date: payment.payment_date,
                    paymentDate: paymentDate,
                    status: payment.status
                });
                
                return {
                case_phase_id: payment.case_phase_id,
                phase_name: payment.phase_name,
                notes: payment.notes,
                    status: payment.status || 'pending', // Ensure status is always set, default to 'pending'
                case_id: payment.case_id,
                due_date: payment.due_date,
                created_by: payment.created_by,
                updated_by: payment.updated_by,
                paid_amount: payment.paid_amount,
                case_type_id: payment.case_type_id,
                created_time: payment.created_time,
                    payment_date: paymentDate, // Always use payment_date from API if it exists
                phase_amount: payment.phase_amount,
                updated_time: payment.updated_time,
                invoice_number: payment.invoice_number,
                payment_method: payment.payment_method,
                transaction_reference: payment.transaction_reference
                };
            });
            setPaymentStages(transformedPaymentStages);
            
            // Also populate editable payment stages for editing
            const editableStages = transformedPaymentStages.map((payment: any) => ({
                phase_name: payment.phase_name,
                due_date: payment.due_date,
                payment_date: payment.payment_date || null, // Always include payment_date if it exists
                phase_amount: payment.phase_amount,
                status: payment.status || 'pending', // Include status from API
                created_by: payment.created_by || 1 // Default to 1 if not available
            }));
            setEditablePaymentStages(editableStages);
        }

        // Documents will be fetched automatically by useEffect when case types are loaded
        // This ensures case types are available before fetching documents

        // Load uploaded documents if available
        if (taskData.case_documents && Array.isArray(taskData.case_documents)) {
            setUploadedDocuments(taskData.case_documents);
        }

        console.log('Form populated successfully');
    };

    useEffect(() => {
        console.log('EditTask component mounted');
        console.log('Task ID:', taskId);

        if (taskId) {
            fetchTaskData();
        }
    fetchPartners();

        fetchCurrentUser();
        fetchUsers();
        fetchCustomers();
        fetchCaseTypes();

        // Auto-populate role from localStorage
        const storedUserDetails = localStorage.getItem('expertclaims_user_details');
        if (storedUserDetails) {
            try {
                const parsedUserDetails = JSON.parse(storedUserDetails);
                if (parsedUserDetails.role) {
                    setNewCustomer(prev => ({ ...prev, role: parsedUserDetails.role }));
                    console.log('Auto-populated role from localStorage:', parsedUserDetails.role);
                }
            } catch (error) {
                console.error('Error parsing user details from localStorage:', error);
            }
        }
    }, [taskId]);

    // Debug: Log customers state changes
    useEffect(() => {
        console.log('Customers state updated:', customers);
    }, [customers]);

    // Monitor document categories state changes
    useEffect(() => {
        console.log('Document categories state updated:', documentCategories);
    }, [documentCategories]);

    // Fetch documents when case types are loaded and a case type is selected
    useEffect(() => {
        console.log("useEffect triggered - formData.caseType:", formData.caseType, "caseTypes.length:", caseTypes.length);
        if (formData.caseType && caseTypes.length > 0) {
            console.log("Looking for case type:", formData.caseType.trim());
            console.log("Available case types:", caseTypes.map(t => t.case_type_name));
            const selectedCaseType = caseTypes.find(
                (type) => type.case_type_name.trim() === formData.caseType.trim()
            );
            
            if (selectedCaseType) {
                console.log("Case type found, fetching documents for:", selectedCaseType.case_type_name, "ID:", selectedCaseType.case_type_id);
                // Fetch documents for the selected case type
                fetchDocuments(selectedCaseType.case_type_id);
                // Also fetch document categories
                fetchDocumentCategories(selectedCaseType.case_type_id);
            } else {
                console.log("Case type not found in caseTypes array");
            }
        } else {
            console.log("Conditions not met - formData.caseType:", formData.caseType, "caseTypes.length:", caseTypes.length);
        }
    }, [formData.caseType, caseTypes]);

    // Debug: Log customer dropdown rendering
    useEffect(() => {
        console.log('Customer dropdown rendering with customers:', customers);
        console.log('Current formData.customer_id:', formData.customer_id);
    }, [customers, formData.customer_id]);

    // Debug: Log stakeholders state changes
    useEffect(() => {
        console.log('Stakeholders state updated:', stakeholders);
    }, [stakeholders]);

    const fetchCurrentUser = async () => {
        // Mock current user data
        setCurrentUserId('mock-user-1');
    };

    const fetchPartners = async () => {
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
    }
  };

    const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
            // Use effective session data or fallback to mock data
            const sessionId = effectiveSession?.sessionId || 'fddc661a-dfb4-4896-b7b1-448e1adf7bc2';
            const jwtToken = effectiveSession?.jwtToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k';

            const employeesData = await EmployeeService.getEmployees(sessionId, jwtToken);
            console.log('Received employees from API:', employeesData);

            // Transform employee data to match the User interface
            const transformedUsers = employeesData.map(employee => ({
                id: employee.employee_id.toString(),
                full_name: employee.employee_name,
            }));

            console.log('Transformed users:', transformedUsers);
            setUsers(transformedUsers);
        } catch (error: any) {
            console.error('Error fetching employees:', error);

            let errorMessage = "Failed to load employees";
            if (error?.message) {
                if (error.message.includes("Invalid data") || error.message.includes("invalid data")) {
                    errorMessage = "Invalid data received from server";
                } else if (error.message.includes("Network")) {
                    errorMessage = "Network error while loading employees";
                } else if (error.message.includes("Unauthorized") || error.message.includes("401")) {
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
            console.log('Starting to fetch customers...');

            // Use effective session data or fallback to mock data
            const sessionId = effectiveSession?.sessionId || 'fddc661a-dfb4-4896-b7b1-448e1adf7bc2';
            const jwtToken = effectiveSession?.jwtToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBhYmFzZSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k';

            console.log('Using session ID:', sessionId);
            console.log('Using JWT token:', jwtToken);

            const customersData = await CustomerService.getCustomers(sessionId, jwtToken);
            console.log('Received customers from API:', customersData);

            // Filter out any invalid customers and clean up the data
            const validCustomers: ExtendedCustomer[] = customersData
                .filter(customer =>
                    customer &&
                    customer.customer_id &&
                    customer.customer_name &&
                    customer.customer_name.trim() !== ''
                )
                .map(customer => ({
                    ...customer,
                    customer_name: customer.customer_name.trim() // Remove trailing spaces
                }));

            console.log('Filtered and cleaned customers:', validCustomers);
            setCustomers(validCustomers);
        } catch (error: any) {
            console.error('Error fetching customers:', error);

            let errorMessage = "Failed to load customers";
            if (error?.message) {
                if (error.message.includes("Invalid data") || error.message.includes("invalid data")) {
                    errorMessage = "Invalid data received from server";
                } else if (error.message.includes("Network")) {
                    errorMessage = "Network error while loading customers";
                } else if (error.message.includes("Unauthorized") || error.message.includes("401")) {
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
            const sessionId = effectiveSession?.sessionId || 'fddc661a-dfb4-4896-b7b1-448e1adf7bc2';
            const jwtToken = effectiveSession?.jwtToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k';

            const caseTypesData = await CaseTypeService.getCaseTypes(sessionId, jwtToken);
            console.log('Received case types from API:', caseTypesData);

            // Filter out any invalid case types and clean up the data
            const validCaseTypes = caseTypesData
                .filter(type =>
                    type &&
                    type.case_type_id &&
                    type.case_type_name &&
                    type.case_type_name.trim() !== ''
                )
                .map(type => ({
                    ...type,
                    case_type_name: type.case_type_name.trim() // Remove trailing spaces
                }));

            console.log('Filtered and cleaned case types:', validCaseTypes);
            setCaseTypes(validCaseTypes);
        } catch (error: any) {
            console.error('Error fetching case types:', error);

            let errorMessage = "Failed to load case types";
            if (error?.message) {
                if (error.message.includes("Invalid data") || error.message.includes("invalid data")) {
                    errorMessage = "Invalid data received from server";
                } else if (error.message.includes("Network")) {
                    errorMessage = "Network error while loading case types";
                } else if (error.message.includes("Unauthorized") || error.message.includes("401")) {
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
            const sessionId = effectiveSession?.sessionId || 'fddc661a-dfb4-4896-b7b1-448e1adf7bc2';
            const jwtToken = effectiveSession?.jwtToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBhYmFzZSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k';

            const documentsData = await DocumentService.getDocumentsByCaseType(caseTypeId, sessionId, jwtToken);
            console.log('Received documents from API:', documentsData);

            // Filter out any invalid documents and clean up the data
            const validDocuments = documentsData
                .filter(doc =>
                    doc &&
                    doc.document_name &&
                    doc.document_name.trim() !== ''
                )
                .map(doc => ({
                    ...doc,
                    document_name: doc.document_name.trim() // Remove trailing spaces
                }));

            console.log('Filtered and cleaned documents:', validDocuments);
            
            // Always add "Other" to the documents list if it doesn't exist
            // This ensures users can always add custom documents even if API returns no documents
            const hasOther = validDocuments.some(
                (doc) => doc.document_name && doc.document_name.trim().toLowerCase() === "other"
            );
            
            console.log("Checking for 'Other' in documents:", hasOther);
            
            if (!hasOther) {
                validDocuments.push({
                    document_id: 0, // Placeholder ID for "Other"
                    document_name: "Other",
                    category_id: 0, // Will be set from fetchDocumentCategories
                    case_type_id: caseTypeId,
                } as Document);
                console.log("Added 'Other' to documents list. Total documents now:", validDocuments.length);
            } else {
                console.log("'Other' already exists in documents list");
            }
            
            console.log("Final documents list before setting state:", validDocuments.map(d => d.document_name));
            setDocuments(validDocuments);

            // Create document categories mapping from the documents data itself
            const categories: { [key: string]: number } = {};
            validDocuments.forEach(doc => {
                if (doc.document_name && doc.category_id) {
                    categories[doc.document_name] = doc.category_id;
                    console.log(`Mapped document: "${doc.document_name}" -> category_id: ${doc.category_id}`);
                }
            });
            
            // Always ensure "Other" has a category_id (use 0 as default if not set)
            if (!categories["Other"]) {
                categories["Other"] = 0;
                console.log("Added 'Other' to document categories with default category_id: 0");
            }
            
            console.log('Document categories mapped from documents:', categories);
            setDocumentCategories(categories);
        } catch (error: any) {
            console.error('Error fetching documents:', error);

            let errorMessage = "Failed to load documents for this case type";
            if (error?.message) {
                if (error.message.includes("Invalid data") || error.message.includes("invalid data")) {
                    errorMessage = "Invalid data received from server";
                } else if (error.message.includes("Network")) {
                    errorMessage = "Network error while loading documents";
                } else if (error.message.includes("Unauthorized") || error.message.includes("401")) {
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
                        const combined = [...filteredPrev, ...updatedDocuments];
                        
                        // Deduplicate by document_name (case-insensitive) - keep the first occurrence
                        const uniqueDocs = combined.filter((doc, index, self) => 
                            index === self.findIndex(d => 
                                d.document_name && 
                                d.document_name.trim().toLowerCase() === doc.document_name.trim().toLowerCase()
                            )
                        );
                        
                        return uniqueDocs;
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

        // NOTE: API call is commented out as per user request - just setting up the function structure
        // The actual API call will be added later
        console.log("createDocumentCategory called with:", {
            case_type_id: selectedCaseType.case_type_id.toString(),
            document_name: documentName.trim(),
        });

        // For now, just update the UI state
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

        // Add the new document to the list
        const newDocument = {
            document_id: Date.now(), // Temporary ID
            document_name: documentName.trim(),
            category_id: 0, // Will be set when API is called
            case_type_id: selectedCaseType.case_type_id,
        } as Document;

        // Add the new document and also add "Other" back so users can add more custom documents
        setDocuments((prev) => {
            const updated = [...prev, newDocument];
            // Check if "Other" already exists
            const hasOther = updated.some(
                (doc) => doc.document_name && doc.document_name.trim().toLowerCase() === "other"
            );
            // Add "Other" back if it doesn't exist
            if (!hasOther) {
                updated.push({
                    document_id: 0,
                    document_name: "Other",
                    category_id: 0,
                    case_type_id: selectedCaseType.case_type_id,
                } as Document);
            }
            return updated;
        });
        
        setDocumentCategories((prev) => ({
            ...prev,
            [documentName.trim()]: 0, // Temporary category_id
            "Other": prev["Other"] || 0, // Ensure "Other" is in categories
        }));

        toast({
            title: "Document Added",
            description: `Document "${documentName}" has been added to the list. API call will be implemented later.`,
        });
    };

    const fetchEmployees = async () => {
        setIsLoadingEmployees(true);
        try {
            console.log('Fetching employees...');

            const response = await fetch('https://n8n.srv952553.hstgr.cloud/webhook/2d7eb946-588f-436d-8ebe-ccb118babf12', {
                method: 'GET',
                headers: {
                    'accept': '*/*',
                    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
                    'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
                    'content-type': 'application/json',
                    'origin': 'http://localhost:8080',
                    'referer': 'http://localhost:8080/',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
                }
            });

            if (response.ok) {
                const employeesData = await response.json();
                console.log('Received employees from API:', employeesData);
                setEmployees(employeesData);
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error: any) {
            console.error('Error fetching employees:', error);
            toast({
                title: "Warning",
                description: "Failed to load employees data",
                variant: "destructive",
            });
        } finally {
            setIsLoadingEmployees(false);
        }
    };

    const handleCreateCustomer = async () => {
        try {
            const fullName = `${newCustomer.first_name} ${newCustomer.last_name}`.trim();
            if (!newCustomer.first_name.trim() || !newCustomer.last_name.trim() || !newCustomer.email.trim() || !newCustomer.userName.trim() || !newCustomer.password_hash.trim()) {
                toast({ title: 'Error', description: 'Customer name, email, username and password are required', variant: 'destructive' });
                return;
            }

            // Simulate customer creation delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Create mock customer data with all fields including new ones
            const mockCustomerData = {
                id: `customer-${Date.now()}`,
                full_name: fullName,
                email: newCustomer.email,
                userName: newCustomer.userName,
                password_hash: newCustomer.password_hash,
                role: newCustomer.role,
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
                notes: newCustomer.notes
            };

            console.log('Mock customer created with all fields:', mockCustomerData);
            console.log('Role from localStorage:', newCustomer.role);

            setFormData(prev => ({ ...prev, customer_id: mockCustomerData.id }));
            setCreateCustomerOpen(false);
            toast({ title: 'Customer created', description: `${mockCustomerData.full_name} (${mockCustomerData.email}) with role: ${mockCustomerData.role}` });
        } catch (err) {
            console.error('Unexpected error creating customer:', err);
            toast({ title: 'Error', description: 'Unexpected error creating customer', variant: 'destructive' });
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCaseTypeChange = (caseType: string) => {
        console.log('Case type changed to:', caseType);

        // Clean the case type name to remove any trailing spaces
        const cleanCaseType = caseType.trim();
        console.log('Cleaned case type:', cleanCaseType);

        setFormData(prev => ({
            ...prev,
            caseType: cleanCaseType,
            selectedDocuments: [] // Reset selected documents when case type changes
        }));
        setDocumentUploads({}); // Reset document uploads
        setIsOtherDocumentSelected(false); // Reset "Other" checkbox when case type changes

        // Find the case type ID and fetch documents
        const selectedCaseType = caseTypes.find(type => type.case_type_name.trim() === cleanCaseType);
        if (selectedCaseType) {
            console.log('Found case type ID:', selectedCaseType.case_type_id);
            fetchDocuments(selectedCaseType.case_type_id);
            // Also fetch document categories to ensure "Other" is included
            fetchDocumentCategories(selectedCaseType.case_type_id);
        } else {
            console.log('Case type not found, clearing documents');
            setDocuments([]);
        }
    };

    const handleCustomerChange = (customerId: string) => {
        console.log('Customer changed to:', customerId);

        const selectedCustomer = customers.find(customer => customer.customer_id.toString() === customerId);
        if (selectedCustomer) {
            console.log('Selected customer:', selectedCustomer);
            setFormData(prev => ({
                ...prev,
                customer_id: customerId
            }));

            // Add customer_id to the customer array
            const customerWithId = {
                ...selectedCustomer,
                customer_id: selectedCustomer.customer_id
            };
            console.log('Customer with ID added:', customerWithId);
        }
    };

    const getSelectedCustomerName = () => {
        if (!formData.customer_id) return '';
        const selectedCustomer = customers.find(customer => customer.customer_id.toString() === formData.customer_id);
        return selectedCustomer ? selectedCustomer.customer_name : '';
    };

    const getEmployeeName = (employeeId: number) => {
        console.log('Looking for employee ID:', employeeId);
        console.log('Available employees:', employees);
        const employee = employees.find(emp => emp.employee_id === employeeId);
        console.log('Found employee:', employee);
        return employee ? employee.employee_name : `Employee ID: ${employeeId}`;
    };

    const getEmployeeNameFromTaskData = (taskData: any) => {
        console.log('Getting employee name from task data:', taskData);
        if (taskData && taskData.employees) {
            const { first_name, last_name } = taskData.employees;
            const fullName = `${first_name} ${last_name}`.trim();
            console.log('Employee name:', fullName);
            return fullName;
        }
        console.log('No employee data found');
        return 'No employee data';
    };

    // Function to get selected partner details for display
    const getSelectedPartnerInfo = () => {
        if (!formData.partner_id) return null;
        
        const partnerId = parseInt(formData.partner_id);
        return partners.find(partner => partner.partner_id === partnerId) || null;
    };

    const splitCustomerName = (fullName: string) => {
        const nameParts = fullName.trim().split(' ');
        if (nameParts.length === 1) {
            return { firstName: nameParts[0], lastName: '' };
        } else if (nameParts.length === 2) {
            return { firstName: nameParts[0], lastName: nameParts[1] };
        } else {
            return {
                firstName: nameParts[0],
                lastName: nameParts.slice(1).join(' ')
            };
        }
    };

    const handleDocumentSelection = (documentName: string, isSelected: boolean) => {
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
                // Clear uploaded file for "Other" when deselected
                setDocumentUploads((prev) => {
                    const newUploads = { ...prev };
                    delete newUploads["Other"];
                    return newUploads;
                });
            } else {
                // Add "Other" to selected documents
                setFormData((prev) => ({
                    ...prev,
                    selectedDocuments: [...prev.selectedDocuments, "Other"],
                }));
            }
        } else {
            // For other documents, use the normal selection logic
            setFormData(prev => ({
                ...prev,
                selectedDocuments: isSelected
                    ? [...prev.selectedDocuments, documentName]
                    : prev.selectedDocuments.filter(doc => doc !== documentName)
            }));
            
            // Clear uploaded file when document is deselected
            if (!isSelected) {
                setDocumentUploads((prev) => {
                    const newUploads = { ...prev };
                    delete newUploads[documentName];
                    return newUploads;
                });
            }
        }
    };

    const handleDocumentUpload = async (documentName: string, file: File | null): Promise<boolean> => {
        if (!file) {
            setDocumentUploads(prev => ({
                ...prev,
                [documentName]: {
                    ...prev[documentName],
                    file: null
                }
            }));
            return false;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File Too Large",
                description: `You may only add files up to 5MB. This file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
                variant: "destructive",
            });
            return false;
        }

        // Check total size for multiple documents (max 10MB combined)
        const currentTotalSize = Object.keys(documentUploads).reduce((total, docName) => {
            const existingFile = documentUploads[docName]?.file;
            // Don't count the current document if it's being replaced
            if (docName === documentName) {
                return total;
            }
            return total + (existingFile ? existingFile.size : 0);
        }, 0);

        const newTotalSize = currentTotalSize + file.size;
        const maxSizeForMultiple = 10 * 1024 * 1024; // 10MB

        // Check if there are multiple documents (more than 1 file will exist after adding this one)
        const existingFileCount = Object.keys(documentUploads).filter(docName => 
            documentUploads[docName]?.file && docName !== documentName
        ).length;

        if (existingFileCount > 0 && newTotalSize > maxSizeForMultiple) {
            toast({
                title: "Maximum Size Limit Reached",
                description: `You can add multiple documents with a maximum combined size of 10MB. Current total: ${(currentTotalSize / 1024 / 1024).toFixed(2)}MB. Adding this ${(file.size / 1024 / 1024).toFixed(2)}MB file would exceed the limit. Please upload other documents later.`,
                variant: "destructive",
            });
            return false;
        }

        setDocumentUploads(prev => ({
            ...prev,
            [documentName]: {
                ...prev[documentName],
                file: file
            }
        }));
        return true;
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
                    description: "Please upload PDF, JPG, PNG, DOC, or DOCX files only",
                    variant: "destructive",
                });
                return;
            }

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "File Too Large",
                    description: `You may only add files up to 5MB. This file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
                    variant: "destructive",
                });
                return;
            }

            const success = await handleDocumentUpload(documentName, file);
            if (success) {
                toast({
                    title: "File Added",
                    description: `${file.name} has been added for ${documentName}`,
                });
            }
        }
    };

    const handleUploadDocuments = async () => {
        // Check if there are any documents to upload
        const documentsToUpload = formData.selectedDocuments.filter(docName => {
            const file = documentUploads[docName]?.file;
            return file !== null && file !== undefined;
        });

        if (documentsToUpload.length === 0) {
            toast({
                title: "No Documents",
                description: "Please select and upload at least one document file",
                variant: "destructive",
            });
            return;
        }

        // Check if case_id is available
        if (!currentTaskData?.case_id && !taskId) {
            toast({
                title: "Error",
                description: "Case ID not found. Cannot upload documents.",
                variant: "destructive",
            });
            return;
        }

        // Use taskId (full case ID from URL like "ECSI-25-230") as priority
        const caseId = taskId || currentTaskData?.case_id?.toString();

        // Get userid from localStorage for created_by and updated_by
        const userDetailsRaw = localStorage.getItem('expertclaims_user_details');
        let userId = ""; // Will be set from localStorage
        
        if (userDetailsRaw) {
            try {
                const userDetailsData = JSON.parse(userDetailsRaw);
                const userDetails = Array.isArray(userDetailsData) ? userDetailsData[0] : userDetailsData;
                userId = (userDetails.userid || userDetails.id || userDetails.employee_id || "").toString();
                console.log('Using user ID from localStorage:', userId);
            } catch (error) {
                console.error('Error parsing user details:', error);
            }
        }
        
        if (!userId) {
            console.warn('⚠️ No user ID found in localStorage, but continuing with upload');
        }

        setIsUploadingDocuments(true);

        try {
            console.log("Starting document upload...");
            console.log("Selected documents:", documentsToUpload);
            console.log("Document uploads:", documentUploads);
            console.log("Document categories:", documentCategories);
            console.log("Case ID:", caseId);
            // Fixed: Use userId (from localStorage), not undefined employeeId
            console.log("User ID:", userId);

            const uploadPromises: Promise<any>[] = [];
            let successCount = 0;
            let failCount = 0;

            // Upload each selected document
            for (const documentName of documentsToUpload) {
                const file = documentUploads[documentName]?.file;
                console.log(`Processing document: ${documentName}, File:`, file);

                if (file) {
                    // Use custom document name if "Other" is selected
                    const actualDocumentName = documentName === "Other" && customDocumentNames["Other"]
                        ? customDocumentNames["Other"]
                        : documentName;

                    let categoryId = documentCategories[actualDocumentName] || documentCategories[documentName];
                    console.log(`Looking for category ID for document: "${actualDocumentName}"`);
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
                            failCount++;
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
                            failCount++;
                            toast({
                                title: "Error",
                                description: `Failed to create category for document: ${actualDocumentName}. ${error.message || 'Please try again.'}`,
                                variant: "destructive",
                            });
                            continue;
                        }
                    }

                    console.log(`Uploading document: ${actualDocumentName}, Category ID: ${categoryId}, Case ID: ${caseId}, User ID: ${userId}`);

                    const formDataToSend = new FormData();
                    formDataToSend.append("data", file);
                    formDataToSend.append("case_id", caseId.toString());
                    formDataToSend.append("category_id", categoryId.toString());
                    formDataToSend.append("is_customer_visible", "true");
                    if (userId) {
                        formDataToSend.append("created_by", userId);
                        formDataToSend.append("updated_by", userId);
                    }

                    const uploadPromise = fetch(
                        "http://localhost:3000/api/upload",
                        {
                            method: "POST",
                            headers: {
                                apikey:
                                    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws",
                                Authorization:
                                    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws",
                                // Don't set Content-Type for FormData - browser will set it automatically with boundary
                            },
                            body: formDataToSend,
                        }
                    )
                        .then(async (response) => {
                            if (!response.ok) {
                                const errorText = await response.text();
                                console.error(`Upload failed for ${actualDocumentName}:`, response.status, errorText);
                                throw new Error(`Upload failed for ${actualDocumentName}: HTTP ${response.status} - ${errorText}`);
                            }
                            const result = await response.json();
                            console.log(`Upload successful for ${actualDocumentName}:`, result);
                            successCount++;
                            return result;
                        })
                        .catch((error) => {
                            console.error(`Error uploading ${actualDocumentName}:`, error);
                            failCount++;
                            throw error;
                        });

                    uploadPromises.push(uploadPromise);
                }
            }

            // Wait for all uploads to complete
            const results = await Promise.allSettled(uploadPromises);
            
            // Check results for detailed error messages
            const errors: string[] = [];
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const errorMsg = result.reason?.message || 'Unknown error';
                    errors.push(errorMsg);
                    console.error(`Upload ${index + 1} failed:`, errorMsg);
                }
            });

            // Show success message
            if (successCount > 0) {
                toast({
                    title: "Success",
                    description: `Successfully uploaded ${successCount} document(s)${failCount > 0 ? `. ${failCount} document(s) failed.` : ""}`,
                });

                // Clear uploaded files after successful upload
                setDocumentUploads({});

                // Refresh task data to get updated documents
                if (taskId) {
                    await fetchTaskData();
                }
            } else {
                // Show detailed error message
                const errorMessage = errors.length > 0 
                    ? errors[0] 
                    : "Failed to upload documents. Please check the console for details.";
                
                toast({
                    title: "Upload Failed",
                    description: errorMessage,
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            console.error("Error uploading documents:", error);
            toast({
                title: "Error",
                description: `Failed to upload documents: ${error.message || "Unknown error"}`,
                variant: "destructive",
            });
        } finally {
            setIsUploadingDocuments(false);
        }
    };

    const handleDocumentTypeChange = (documentName: string, documentType: string) => {
        setDocumentTypes(prev => ({
            ...prev,
            [documentName]: documentType
        }));

        // Reset custom document name if not "Other"
        if (documentType !== 'Other') {
            setCustomDocumentNames(prev => {
                const newState = { ...prev };
                delete newState[documentName];
                return newState;
            });
        }
    };

    const handleCustomDocumentNameChange = (documentName: string, customName: string) => {
        setCustomDocumentNames(prev => ({
            ...prev,
            [documentName]: customName
        }));
    };

    // Modal handler functions
    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 25, 300));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 25, 50));
    };

    const handleResetZoom = () => {
        setZoomLevel(100);
        setPanX(0);
        setPanY(0);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoomLevel > 100) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoomLevel > 100) {
            setPanX(e.clientX - dragStart.x);
            setPanY(e.clientY - dragStart.y);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            handleZoomIn();
        } else {
            handleZoomOut();
        }
    };

    const deleteDocument = async (documentId?: number) => {
        if (!documentId) {
            toast({
                title: "Missing document",
                description: "Document information is unavailable. Please refresh and try again.",
                variant: "destructive",
            });
            return;
        }

        // Use taskId (full case ID from URL like "ECSI-25-230") as priority
        const caseId = taskId || currentTaskData?.case_id?.toString();
        let sessionId = "fddc661a-dfb4-4896-b7b1-448e1adf7bc2";
        let jwtToken =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiIsInBhc3N3b3JkIjoiIiwiaWF0IjoxNzU2NTQ3MjAzfQ.rW9zIfo1-B_Wu2bfJ8cPai0DGZLfaapRE7kLt2dkCBc";

        const sessionData = localStorage.getItem("expertclaims_session");
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                sessionId = session.sessionId || session.session_id || sessionId;
                jwtToken = session.jwtToken || session.jwt_token || jwtToken;
            } catch (error) {
                console.error("Error parsing session data for deleteDocument:", error);
            }
        }

        let employeeId = 1;
        const userDetailsRaw = localStorage.getItem("expertclaims_user_details");
        if (userDetailsRaw) {
            try {
                const userDetails = JSON.parse(userDetailsRaw);
                const userData = Array.isArray(userDetails) ? userDetails[0] : userDetails;
                employeeId = userData?.userid || userData?.employee_id || employeeId;
            } catch (error) {
                console.error("Error parsing user details for deleteDocument:", error);
            }
        }

        setDeletingDocumentId(documentId);

        try {
            const response = await fetch(
                `http://localhost:3000/support/removecrmdocument?document_id=${documentId}`,
                {
                    method: "PATCH",
                    headers: {
                        apikey:
                            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws",
                        Authorization:
                            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws",
                        "Accept-Profile": "expc",
                        "Content-Profile": "expc",
                        session_id: sessionId,
                        jwt_token: jwtToken,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        document_id: documentId,
                        emp_id: employeeId,
                        case_id: caseId,
                    }),
                }
            );

            if (response.ok || response.status === 204) {
                toast({
                    title: "Success",
                    description: "Document removed successfully",
                });

                setUploadedDocuments((prev) =>
                    prev.filter((doc) => doc.document_id !== documentId)
                );
            } else {
                const errorText = await response.text();
                console.error("Failed to remove document:", response.status, errorText);
                toast({
                    title: "Error",
                    description: "Failed to remove document. Please try again.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error removing document:", error);
            toast({
                title: "Error",
                description: "Failed to remove document",
                variant: "destructive",
            });
        } finally {
            setDeletingDocumentId(null);
        }
    };

    const viewDocument = async (documentId: number) => {
        try {
            console.log('Viewing document with ID:', documentId);
            
            // Get session data from localStorage
            const sessionData = localStorage.getItem('expertclaims_session');
            if (!sessionData) {
                toast({
                    title: "Error",
                    description: "Please log in to view documents",
                    variant: "destructive",
                });
                return;
            }

            const session = JSON.parse(sessionData);
            const sessionId = session.sessionId;
            const jwtToken = session.jwtToken;

            if (!sessionId || !jwtToken) {
                toast({
                    title: "Error",
                    description: "Invalid session. Please log in again",
                    variant: "destructive",
                });
                return;
            }

            // Call the n8n webhook API to get document view URL
            console.log('Calling n8n webhook for document view...');
            console.log('Document ID:', documentId);
            
            const requestBody = {
                document_id: documentId
            };
            console.log('Request body:', requestBody);
            
            // Supabase service role key
            const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws';
            
            const response = await fetch('http://localhost:3000/support/view', {
                method: 'POST',
                headers: {
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Profile': 'expc',
                    'Authorization': `Bearer ${supabaseServiceRoleKey}`,
                    'Connection': 'keep-alive',
                    'Content-Profile': 'expc',
                    'Content-Type': 'application/json',
                    'Origin': 'http://localhost:8080',
                    'Referer': 'http://localhost:8080/',
                    'apikey': supabaseServiceRoleKey,
                    'jwt_token': jwtToken,
                    'session_id': sessionId,
                },
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                toast({
                    title: "Error",
                    description: `Failed to get document view: ${response.status} ${response.statusText}`,
                    variant: "destructive",
                });
                return;
            }

            // Check the content type to determine response format
            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);

            // Clone the response so we can read it multiple times
            const responseClone = response.clone();

            // Handle JSON response (contains URL or data)
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log('JSON response:', data);
                
                // Extract URL from response (check multiple possible field names)
                const url = data.url || data.document_url || data.image_url || data.file_url || data.data?.url;
                
                if (url) {
                    setDocumentUrl(url);
                    setDocumentType('url');
                setShowDocumentModal(true);
                setZoomLevel(100);
                setPanX(0);
                setPanY(0);
                
                toast({
                    title: "Success",
                    description: "Document loaded successfully",
                });
                } else {
                    toast({
                        title: "Error",
                        description: "No document URL found in response",
                        variant: "destructive",
                    });
                }
            } 
            // Handle binary/blob response or text response
            else {
                try {
                    // First, read as text to check if it's a simple error response or SVG
                    const responseText = await response.text();
                    console.log('Response as text (first 500 chars):', responseText.substring(0, 500));
                    console.log('Response length:', responseText.length);
                    
                    // If response is just a number or very short text, it's likely an error
                    if (responseText.length < 50 && /^\d+$/.test(responseText.trim())) {
                        console.error('API returned numeric response (possibly error):', responseText);
                        toast({
                            title: "Error",
                            description: `Document not available. The API returned: ${responseText}. Please check if the document exists.`,
                            variant: "destructive",
                        });
                        return;
                    }
                    
                    // Check if response is SVG XML
                    const isSVG = responseText.trim().startsWith('<svg') || responseText.trim().startsWith('<?xml') && responseText.includes('<svg');
                    
                    // If it looks like a URL, use it directly
                    if (responseText.trim().startsWith('http')) {
                        console.log('Opening URL from response:', responseText.trim());
                        setDocumentUrl(responseText.trim());
                        setDocumentType('url');
                        setShowDocumentModal(true);
                        setZoomLevel(100);
                        setPanX(0);
                        setPanY(0);
                        
                        toast({
                            title: "Success",
                            description: "Document loaded successfully",
                        });
                        return;
                    }
                    
                    // Handle SVG XML response
                    if (isSVG || contentType?.includes('image/svg+xml') || contentType?.includes('text/xml')) {
                        console.log('Detected SVG content, creating blob URL');
                        // Create blob from SVG text
                        const svgBlob = new Blob([responseText], { type: 'image/svg+xml' });
                        const svgUrl = URL.createObjectURL(svgBlob);
                        setDocumentUrl(svgUrl);
                        setDocumentType('image/svg+xml');
                        setShowDocumentModal(true);
                        setZoomLevel(100);
                        setPanX(0);
                        setPanY(0);
                        
                        toast({
                            title: "Success",
                            description: "Document loaded successfully",
                        });
                        return;
                    }
                    
                    // If response is text but not a URL or SVG, try to convert to blob
                    // Use the cloned response to get as blob
                    const blob = await responseClone.blob();
                    console.log('Blob created, size:', blob.size, 'bytes');
                    console.log('Blob type:', blob.type);
                    
                    // Check if blob is too small (likely not valid image data)
                    if (blob.size < 100) {
                        console.error('Blob too small, likely not valid image data');
                    toast({
                        title: "Error",
                            description: `Document not available. Response size: ${blob.size} bytes. Please check if the document exists.`,
                        variant: "destructive",
                    });
                        return;
                    }
                    
                    // Create object URL from blob
                    const objectUrl = URL.createObjectURL(blob);
                    console.log('Created blob URL:', objectUrl);
                    
                    // Determine document type from content-type header or blob type
                    let docType = contentType || blob.type || 'application/octet-stream';
                    
                    if (contentType?.includes('image/')) {
                        docType = contentType;
                    } else if (contentType?.includes('application/pdf')) {
                        docType = 'application/pdf';
                    } else if (!blob.type && blob.size > 0) {
                        // Try to detect file type from blob content
                        // Check first bytes for file signatures
                        const arrayBuffer = await blob.arrayBuffer();
                        const uint8Array = new Uint8Array(arrayBuffer);
                        
                        // JPEG: FF D8 FF
                        if (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF) {
                            docType = 'image/jpeg';
                        }
                        // PNG: 89 50 4E 47
                        else if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47) {
                            docType = 'image/png';
                        }
                        // PDF: 25 50 44 46 (%PDF)
                        else if (uint8Array[0] === 0x25 && uint8Array[1] === 0x50 && uint8Array[2] === 0x44 && uint8Array[3] === 0x46) {
                            docType = 'application/pdf';
                        }
                        // GIF: 47 49 46 38 (GIF8)
                        else if (uint8Array[0] === 0x47 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x38) {
                            docType = 'image/gif';
                        }
                        // WebP: Check for RIFF...WEBP
                        else if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46) {
                            // Check further for WEBP signature
                            const textDecoder = new TextDecoder();
                            const header = textDecoder.decode(uint8Array.slice(0, 12));
                            if (header.includes('WEBP')) {
                                docType = 'image/webp';
                            }
                        }
                    }
                    
                    // Set document URL and type
                    setDocumentUrl(objectUrl);
                    setDocumentType(docType);
                    setShowDocumentModal(true);
                    setZoomLevel(100);
                    setPanX(0);
                    setPanY(0);
                    
                    toast({
                        title: "Success",
                        description: "Document opened successfully",
                    });
                    
                } catch (blobError) {
                    console.error('Error handling response as blob:', blobError);
                    toast({
                        title: "Error",
                        description: "Failed to process document response. Please check if the document exists.",
                        variant: "destructive",
                    });
                }
            }
        } catch (error) {
            console.error('Error viewing document:', error);
            toast({
                title: "Error",
                description: "Failed to view document",
                variant: "destructive",
            });
        }
    };

    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            // Format date in local timezone (YYYY-MM-DD) to avoid timezone shift
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            setFormData(prev => ({ ...prev, due_date: formattedDate }));
        } else {
            setFormData(prev => ({ ...prev, due_date: '' }));
        }
    };

    const addStakeholder = () => {
        console.log('Adding stakeholder with data:', newStakeholder);
        console.log('Current stakeholders before adding:', stakeholders);

        if (newStakeholder.name.trim() && newStakeholder.contact_email.trim() && newStakeholder.role.trim()) {
            const newStakeholderWithId = {
                id: Date.now().toString(),
                stakeholder_name: newStakeholder.name,
                contact: newStakeholder.contact,
                contact_email: newStakeholder.contact_email,
                role: newStakeholder.role,
                notes: newStakeholder.notes
            };
            console.log('New stakeholder to add:', newStakeholderWithId);

            setStakeholders(prev => {
                const updatedStakeholders = [...prev, newStakeholderWithId];
                console.log('Updated stakeholders after adding:', updatedStakeholders);
                return updatedStakeholders;
            });

            setNewStakeholder({ name: '', contact: '', contact_email: '', role: '', notes: '' });
            console.log('Stakeholder added successfully!');
        } else {
            console.log('Validation failed:', {
                name: newStakeholder.name.trim(),
                contact_email: newStakeholder.contact_email.trim(),
                role: newStakeholder.role.trim()
            });
        }
    };

    const removeStakeholder = (id: string) => {
        setStakeholders(prev => prev.filter(stakeholder => stakeholder.id !== id));
    };

    const addComment = () => {
        if (newComment.text.trim()) {
            setComments(prev => [...prev, { ...newComment, id: Date.now().toString() }]);
            setNewComment({ text: '', isInternal: false });
        }
    };

    const removeComment = (id: string) => {
        setComments(prev => prev.filter(comment => comment.id !== id));
    };

    const handleInvoiceGenerated = async (casePhaseId: number) => {
        try {
            console.log('Generating invoice for case phase ID:', casePhaseId);
            console.log('Payment stages:', paymentStages);
            console.log('Current task data:', currentTaskData);

            // Find the payment stage data from editablePaymentStages (has the actual amounts)
            const paymentStageIndex = paymentStages.findIndex(stage => stage.case_phase_id === casePhaseId);
            const paymentStage = editablePaymentStages[paymentStageIndex];
            console.log('Found payment stage index:', paymentStageIndex);
            console.log('Found payment stage:', paymentStage);
            console.log('Editable payment stages:', editablePaymentStages);
            console.log('PaymentStages:', paymentStages);
            console.log('Case phase ID:', casePhaseId);
            
            // Check if invoice number already exists
            const existingInvoiceNumber = paymentStages[paymentStageIndex]?.invoice_number;
            const hasInvoiceNumber = existingInvoiceNumber && 
                                     existingInvoiceNumber !== 'N/A' && 
                                     existingInvoiceNumber !== null &&
                                     String(existingInvoiceNumber).trim() !== '';
            
            let invoiceNumber = existingInvoiceNumber;
            
            // If invoice number doesn't exist, fetch and save new one
            if (!hasInvoiceNumber) {
                // Get session details for headers
                const sessionStr = localStorage.getItem('expertclaims_session');
                let sessionId = '';
                let jwtToken = '';

                if (sessionStr) {
                    const session = JSON.parse(sessionStr);
                    sessionId = session.sessionId || '';
                    jwtToken = session.jwtToken || '';
                }

                const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws';

                // GET API - Fetch latest invoice number
                console.log('Fetching latest invoice number...');
                const getResponse = await fetch(`http://localhost:3000/support/invoice_get?case_phase_id=${casePhaseId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': API_KEY,
                        'authorization': `Bearer ${API_KEY}`,
                        'session_id': sessionId,
                        'jwt_token': jwtToken
                    }
                });

                if (!getResponse.ok) {
                    throw new Error(`Failed to fetch invoice number: ${getResponse.status}`);
                }

                const getResult = await getResponse.json();
                console.log('Invoice GET response:', getResult);
                
                // Extract invoice number from response
                // API returns: { latest_invoice: "ECSI-25-0001", statusCode: 200 }
                let latestInvoiceNumber = null;
                if (getResult.latest_invoice) {
                    latestInvoiceNumber = getResult.latest_invoice;
                } else if (Array.isArray(getResult) && getResult.length > 0) {
                    latestInvoiceNumber = getResult[0]?.latest_invoice || getResult[0]?.invoice_number || getResult[0]?.data?.invoice_number;
                } else if (getResult.invoice_number) {
                    latestInvoiceNumber = getResult.invoice_number;
                } else if (getResult.data?.invoice_number) {
                    latestInvoiceNumber = getResult.data.invoice_number;
                }

                console.log('Latest invoice number from GET API:', latestInvoiceNumber);

                // Generate new invoice number (increment the last number by 1)
                if (latestInvoiceNumber) {
                    // Extract the number part at the end (e.g., "0001" from "ECSI-25-0001")
                    const match = latestInvoiceNumber.match(/(\d+)$/);
                    if (match) {
                        const lastNumber = parseInt(match[1], 10);
                        console.log('Extracted number:', lastNumber);
                        
                        // Increment by 1
                        const incrementedNumber = lastNumber + 1;
                        console.log('Incremented number:', incrementedNumber);
                        
                        // Pad with zeros to maintain 4 digits (e.g., 2 -> "0002", 10 -> "0010")
                        const paddedNumber = String(incrementedNumber).padStart(4, '0');
                        console.log('Padded number:', paddedNumber);
                        
                        // Replace the last number part with incremented number
                        // e.g., "ECSI-25-0001" -> "ECSI-25-0002"
                        invoiceNumber = latestInvoiceNumber.replace(/\d+$/, paddedNumber);
                        console.log('Final invoice number:', invoiceNumber);
                    } else {
                        // If no number found, generate default format
                        const now = new Date();
                        const year = now.getFullYear().toString().slice(-2);
                        invoiceNumber = `ECSI-${year}-0001`;
                        console.log('No number found, using default:', invoiceNumber);
                    }
                } else {
                    // If no existing invoice, generate first one
                    const now = new Date();
                    const year = now.getFullYear().toString().slice(-2);
                    invoiceNumber = `ECSI-${year}-0001`;
                    console.log('No invoice found, generating first:', invoiceNumber);
                }

                console.log('Final invoice number to send in POST:', invoiceNumber);

                // POST API - Save new invoice number
                console.log('Saving invoice number...');
                const postResponse = await fetch('http://localhost:3000/support/invoice', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': API_KEY,
                        'authorization': `Bearer ${API_KEY}`,
                        'session_id': sessionId,
                        'jwt_token': jwtToken
                    },
                    body: JSON.stringify({
                        case_phase_id: casePhaseId,
                        invoice_number: invoiceNumber
                    })
                });

                if (!postResponse.ok) {
                    throw new Error(`Failed to save invoice number: ${postResponse.status}`);
                }

                const postResult = await postResponse.json();
                console.log('Invoice POST response:', postResult);

                // Update local state with new invoice number
                const updatedPaymentStages = [...paymentStages];
                if (updatedPaymentStages[paymentStageIndex]) {
                    updatedPaymentStages[paymentStageIndex] = {
                        ...updatedPaymentStages[paymentStageIndex],
                        invoice_number: invoiceNumber
                    };
                    setPaymentStages(updatedPaymentStages);
                }

                const updatedEditableStages = [...editablePaymentStages];
                if (updatedEditableStages[paymentStageIndex]) {
                    updatedEditableStages[paymentStageIndex] = {
                        ...updatedEditableStages[paymentStageIndex],
                        invoice_number: invoiceNumber
                    };
                    setEditablePaymentStages(updatedEditableStages);
                }
            }
            
            // If paymentStage is undefined, try to get it directly from the index
            if (!paymentStage && paymentStageIndex >= 0) {
                console.log('Payment stage not found, trying direct access...');
                console.log('EditablePaymentStages length:', editablePaymentStages.length);
                console.log('PaymentStageIndex:', paymentStageIndex);
            }
            
            if (!paymentStage) {
                // Fallback: try to get from original paymentStages and merge with editable data
                const originalPaymentStage = paymentStages.find(stage => stage.case_phase_id === casePhaseId);
                if (originalPaymentStage && paymentStageIndex >= 0 && editablePaymentStages[paymentStageIndex]) {
                    const editableStage = editablePaymentStages[paymentStageIndex];
                    const mergedPaymentStage = {
                        ...originalPaymentStage,
                        phase_amount: editableStage.phase_amount,
                        phase_name: editableStage.phase_name,
                        due_date: editableStage.due_date,
                        invoice_number: invoiceNumber || originalPaymentStage.invoice_number
                    };
                        console.log('Using merged payment stage:', mergedPaymentStage);
                        
                        // Get case data and customer data
                        const caseData = currentTaskData;
                        let customerData = caseData?.customers;
                        
                        // Try different possible customer data structures
                        if (!customerData) {
                            customerData = caseData?.customer;
                        }
                        if (!customerData) {
                            customerData = caseData?.customer_profile;
                        }
                        if (!customerData) {
                            customerData = caseData?.customer_details;
                        }
                        
                        if (!customerData) {
                            // Create a fallback customer data structure
                            customerData = {
                                customer_name: 'Customer Not Found',
                                address: 'Address not available',
                                city: 'City not available',
                                state: 'State not available',
                                pincode: '000000'
                            };
                        }
                        
                        // Generate and download PDF with invoice number
                        console.log('Generating and downloading PDF with invoice number:', invoiceNumber);
                        await generateAndDownloadInvoice(mergedPaymentStage, caseData, customerData, {
                            invoiceNumber: invoiceNumber || mergedPaymentStage.invoice_number
                        });
                        console.log('PDF download completed');
                        
                        toast({
                            title: "Success",
                            description: "Invoice PDF has been downloaded successfully!",
                        });
                        return;
                }
                throw new Error('Payment stage not found');
            }

            // Get case data and customer data
            const caseData = currentTaskData;
            let customerData = caseData?.customers;
            
            console.log('Case data:', caseData);
            console.log('Customer data from caseData?.customers:', customerData);
            
            // Try different possible customer data structures
            if (!customerData) {
                customerData = caseData?.customer;
                console.log('Customer data from caseData?.customer:', customerData);
            }
            if (!customerData) {
                customerData = caseData?.customer_profile;
                console.log('Customer data from caseData?.customer_profile:', customerData);
            }
            if (!customerData) {
                customerData = caseData?.customer_details;
                console.log('Customer data from caseData?.customer_details:', customerData);
            }
            
            if (!caseData) {
                throw new Error('Case data not available');
            }
            
            if (!customerData) {
                // Create a fallback customer data structure
                customerData = {
                    customer_name: 'Customer Not Found',
                    address: 'Address not available',
                    city: 'City not available',
                    state: 'State not available',
                    pincode: '000000'
                };
                console.log('Using fallback customer data:', customerData);
            }

            // Update payment stage with invoice number for PDF generation
            const paymentStageWithInvoice = {
                ...paymentStage,
                invoice_number: invoiceNumber || paymentStage.invoice_number
            };

            // Generate and download PDF with invoice number
            console.log('Generating and downloading PDF with invoice number:', invoiceNumber);
            await generateAndDownloadInvoice(paymentStageWithInvoice, caseData, customerData, {
                invoiceNumber: invoiceNumber || paymentStageWithInvoice.invoice_number
            });
            console.log('PDF download completed');
            
            toast({
                title: "Success",
                description: "Invoice PDF has been downloaded successfully!",
            });

        } catch (error) {
            console.error('Error preparing invoice:', error);
            toast({
                title: "Error",
                description: `Failed to prepare invoice: ${error.message}`,
                variant: "destructive",
            });
        }
    };

    // Payment editing functions
    const handleSavePayments = async (phaseIndex: number) => {
        try {
            const phase = editablePaymentStages[phaseIndex];
            const originalPhase = paymentStages[phaseIndex];
            
            if (!originalPhase?.case_phase_id) {
                toast({
                    title: "Error",
                    description: "Invalid payment phase ID",
                    variant: "destructive",
                });
                return;
            }

            // Validate required fields
            if (!phase.phase_name || !phase.due_date || !phase.phase_amount || phase.phase_amount <= 0) {
                toast({
                    title: "Error",
                    description: "Please fill in Phase Name, Assign Date, and Phase Amount (must be greater than 0)",
                    variant: "destructive",
                });
                return;
            }

            // Check if a payment phase with the same phase name already exists (excluding current phase)
            const duplicatePhaseName = paymentStages.find((existingPhase, index) => 
                index !== phaseIndex &&
                existingPhase.phase_name && 
                existingPhase.phase_name.trim().toLowerCase() === phase.phase_name.trim().toLowerCase()
            );

            if (duplicatePhaseName) {
                toast({
                    title: "Error",
                    description: `Payment phase with phase name "${phase.phase_name}" already exists. Please choose a different phase name.`,
                    variant: "destructive",
                });
                return;
            }

            // Get employee_id from localStorage
            const userDetailsRaw = localStorage.getItem('expertclaims_user_details');
            let employeeId = 1; // Default fallback
            
            if (userDetailsRaw) {
                try {
                    const userDetailsData = JSON.parse(userDetailsRaw);
                    const userDetails = Array.isArray(userDetailsData) ? userDetailsData[0] : userDetailsData;
                    employeeId = userDetails.userid || userDetails.employee_id || 1;
                    console.log('Using employee_id from localStorage:', employeeId);
                } catch (error) {
                    console.error('Error parsing user details:', error);
                }
            }

            // Get session_id and jwt_token from localStorage
            const sessionStr = localStorage.getItem('expertclaims_session');
            let sessionId = '';
            let jwtToken = '';
            
            if (sessionStr) {
                try {
                    const sessionData = JSON.parse(sessionStr);
                    sessionId = sessionData.sessionId || sessionData.session_id || '';
                    jwtToken = sessionData.jwtToken || sessionData.jwt_token || '';
                } catch (error) {
                    console.error('Error parsing session data:', error);
                }
            }

            // Prepare payload matching the API format
            const updateData = {
                case_phase_id: originalPhase.case_phase_id,
                phase_amount: parseFloat(phase.phase_amount) || 0,
                updated_by: employeeId,
                phase_name: phase.phase_name,
                due_date: phase.due_date,
                payment_date: phase.due_date, // Set payment_date same as due_date
                status: phase.status || 'pending' // Include status in update
            };

            console.log('Updating payment phase with payload:', updateData);
            console.log('API Request URL: http://localhost:3000/support/updatepayment');

            // Get session_id and jwt_token from localStorage if not already set
            if (!sessionId || !jwtToken) {
                const sessionStr = localStorage.getItem('expertclaims_session');
                if (sessionStr) {
                    try {
                        const sessionData = JSON.parse(sessionStr);
                        sessionId = sessionId || sessionData.sessionId || sessionData.session_id || '';
                        jwtToken = jwtToken || sessionData.jwtToken || sessionData.jwt_token || '';
                    } catch (error) {
                        console.error('Error parsing session data:', error);
                    }
                }
            }

            const response = await fetch('http://localhost:3000/support/updatepayment', {
                method: 'PATCH',
                headers: {
                    'accept': '*/*',
                    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
                    'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
                    'content-type': 'application/json',
                    'jwt_token': jwtToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k',
                    'session_id': sessionId || 'fddc661a-dfb4-4896-b7b1-448e1adf7bc2',
                    'Connection': 'keep-alive',
                    'Origin': 'http://localhost:8080',
                    'Referer': 'http://localhost:8080/',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-site',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Payment phase update failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();
            console.log('Payment phase update successful. Response:', result);
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            // Update the local paymentStages with the updated data
            const updatedPaymentStages = [...paymentStages];
            updatedPaymentStages[phaseIndex] = {
                ...updatedPaymentStages[phaseIndex],
                phase_name: phase.phase_name,
                due_date: phase.due_date,
                payment_date: phase.payment_date || null, // Update payment_date in local state
                phase_amount: phase.phase_amount,
                status: phase.status || 'pending' // Update status in local state
            };
            setPaymentStages(updatedPaymentStages);
            
            // Also update editablePaymentStages to reflect the change
            const updatedEditableStages = [...editablePaymentStages];
            updatedEditableStages[phaseIndex] = {
                ...updatedEditableStages[phaseIndex],
                payment_date: phase.payment_date || '',
                status: phase.status || 'pending' // Update status in editable stages
            };
            setEditablePaymentStages(updatedEditableStages);

            toast({
                title: "Success",
                description: "Payment phase updated successfully!",
            });

        } catch (error) {
            console.error('Error updating payment phase:', error);
            toast({
                title: "Error",
                description: "Failed to update payment phase. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handlePaymentStageChange = (index: number, field: string, value: string | number) => {
        const updatedStages = [...editablePaymentStages];
        updatedStages[index] = {
            ...updatedStages[index],
            [field]: value
        };
        setEditablePaymentStages(updatedStages);
    };

    const handleAddPaymentPhase = () => {
        setPaymentPhaseForm({
            phase_name: '',
            due_date: '',
            phase_amount: 0,
            status: 'pending' as 'paid' | 'pending'
        });
        setShowPaymentPhaseModal(true);
    };

    const handleClosePaymentPhaseModal = () => {
        setShowPaymentPhaseModal(false);
        setCalendarOpen(false);
        setPhaseNameComboboxOpen(false);
        setPaymentPhaseForm({
            phase_name: '',
            due_date: '',
            phase_amount: 0,
            status: 'pending' as 'paid' | 'pending'
        });
    };

    const handleSavePaymentPhaseFromModal = async () => {
        // Validate required fields
        if (!paymentPhaseForm.phase_name || !paymentPhaseForm.due_date || !paymentPhaseForm.phase_amount || paymentPhaseForm.phase_amount <= 0) {
            toast({
                title: "Error",
                description: "Please fill in Phase Name, Assign Date, and Phase Amount (must be greater than 0)",
                variant: "destructive",
            });
            return;
        }

        // Check if a payment phase with the same phase name already exists
        const duplicatePhaseName = paymentStages.find(phase => 
            phase.phase_name && 
            phase.phase_name.trim().toLowerCase() === paymentPhaseForm.phase_name.trim().toLowerCase()
        );

        if (duplicatePhaseName) {
            toast({
                title: "Error",
                description: `Payment phase with phase name "${paymentPhaseForm.phase_name}" already exists. Please choose a different phase name.`,
                variant: "destructive",
            });
            return;
        }

        try {
            // Get employee_id from localStorage
            const userDetailsRaw = localStorage.getItem('expertclaims_user_details');
            let employeeId = 1; // Default fallback
            
            if (userDetailsRaw) {
                try {
                    const userDetailsData = JSON.parse(userDetailsRaw);
                    const userDetails = Array.isArray(userDetailsData) ? userDetailsData[0] : userDetailsData;
                    employeeId = userDetails.userid || 1;
                    console.log('Using employee_id from localStorage:', employeeId);
                } catch (error) {
                    console.error('Error parsing user details:', error);
                }
            }

            // Get case_type_id from caseTypes array using the case type name
            // Try to get from currentTaskData first (with trimming to handle trailing spaces)
            const caseTypeNameFromTask = currentTaskData?.case_types?.case_type_name?.trim() || formData.caseType?.trim();
            
            // Find the case type in the caseTypes array by matching the name (with trimming)
            const selectedCaseType = caseTypes.find(type => 
                type.case_type_name?.trim() === caseTypeNameFromTask || 
                type.case_type_name?.trim() === formData.caseType?.trim()
            );
            
            const caseTypeId = selectedCaseType?.case_type_id || null;
            
            console.log('Finding case_type_id:', {
                caseTypeNameFromTask,
                formDataCaseType: formData.caseType,
                selectedCaseType,
                caseTypeId
            });

            // Create payment phase data in the same format as task creation
            const paymentPhaseData = {
                phase_name: paymentPhaseForm.phase_name,
                due_date: paymentPhaseForm.due_date,
                phase_amount: paymentPhaseForm.phase_amount,
                created_by: employeeId,
                updated_by: employeeId,
                case_type_id: caseTypeId,
                payment_date: paymentPhaseForm.due_date, // Set payment_date to the same as due_date dynamically
                status: paymentPhaseForm.status || 'pending' // Use status from form
            };

            // Create payload with payments array (same format as when creating a task)
            const createData = {
                case_id: currentTaskData?.case_id || taskId,
                payments: [paymentPhaseData] // Send as array like in task creation
            };

            console.log('Creating new payment phase:', createData);

            // Get session_id and jwt_token from localStorage
            const sessionStr = localStorage.getItem('expertclaims_session');
            let sessionId = '';
            let jwtToken = '';
            
            if (sessionStr) {
                try {
                    const sessionData = JSON.parse(sessionStr);
                    sessionId = sessionData.sessionId || sessionData.session_id || '';
                    jwtToken = sessionData.jwtToken || sessionData.jwt_token || '';
                } catch (error) {
                    console.error('Error parsing session data:', error);
                }
            }

            const response = await fetch('http://localhost:3000/support/createcasepaymentphases', {
                method: 'POST',
                headers: {
                    'accept': '*/*',
                    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
                    'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
                    'content-type': 'application/json',
                    'jwt_token': jwtToken || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k',
                    'session_id': sessionId || 'fddc661a-dfb4-4896-b7b1-448e1adf7bc2',
                    'Connection': 'keep-alive',
                    'Origin': 'http://localhost:8080',
                    'Referer': 'http://localhost:8080/',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-site',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
                },
                body: JSON.stringify(createData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Payment phase created:', result);
            console.log('Created payment phase status:', paymentPhaseForm.status);

            toast({
                title: "Success",
                description: "Payment phase created successfully!",
            });
            
            // Refresh task data to get updated payment phases with status
            if (taskId) {
                // Small delay to ensure backend has processed the creation
                setTimeout(() => {
                fetchTaskData();
                }, 500);
            }

            handleClosePaymentPhaseModal();
        } catch (error) {
            console.error('Error creating payment phase:', error);
            toast({
                title: "Error",
                description: "Failed to create payment phase. Please try again.",
                variant: "destructive",
            });
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
                    description: "Assign date is required",
                    variant: "destructive",
                });
                setIsSubmitting(false);
                return;
            }

            // if (!formData.customer_id) {
            //     toast({
            //         title: "Error",
            //         description: "Customer selection is required",
            //         variant: "destructive",
            //     });
            //     return;
            // }

            console.log('Starting task update...');

            // Find case type ID from case types
            const selectedCaseType = caseTypes.find(type => type.case_type_name === formData.caseType);
            const caseTypeId = selectedCaseType?.case_type_id || 1; // Default to 1 if not found

            // Prepare stakeholder data (take first stakeholder if exists)
            const stakeholderData = stakeholders.length > 0 ? {
                stakeholder_name: stakeholders[0].stakeholder_name,
                contact_email: stakeholders[0].contact_email,
                role: stakeholders[0].role,
                notes: stakeholders[0].notes,
                created_by: null,
                updated_by: null
            } : null;

            // Prepare comment data (if newComment text is non-empty) 
            
            const commentData = newComment.text.trim().length > 0 ? {
                comment_text: newComment.text,
                is_internal: newComment.isInternal
            } : null;

            // Check if payment phases have been modified
            // Get employee_id from localStorage for payment data
            const userDetailsStr = localStorage.getItem("expertclaims_user_details");
            let employeeId = 1; // Default fallback
            
            if (userDetailsStr) {
                try {
                    const userDetailsData = JSON.parse(userDetailsStr);
                    const userDetails = Array.isArray(userDetailsData) ? userDetailsData[0] : userDetailsData;
                    employeeId = userDetails.employee_id || userDetails.id || 1;
                } catch (error) {
                    console.error("Error parsing user details:", error);
                }
            }

            // Prepare payments array if payment phases exist and have been modified
            let paymentsData = null;
            if (editablePaymentStages && editablePaymentStages.length > 0) {
                paymentsData = editablePaymentStages.map((phase: any) => {
                    const paymentObj: any = {
                        phase_name: phase.phase_name,
                        due_date: phase.due_date,
                        phase_amount: phase.phase_amount,
                        created_by: phase.created_by || employeeId,
                        updated_by: employeeId
                    };
                    
                    // Only include payment_date if it exists and is different from due_date
                    if (phase.payment_date && phase.payment_date !== phase.due_date) {
                        paymentObj.payment_date = phase.payment_date;
                    } else {
                        // Include payment_date as null if it doesn't exist or equals due_date
                        paymentObj.payment_date = null;
                    }
                    
                    return paymentObj;
                });
                console.log('Payment phases to be updated:', paymentsData);
            }

            // Create task data for API
        const taskData: any = {
            case_id: currentTaskData?.case_id?(currentTaskData?.case_id):null,
            case_description: formData.description,
            service_amount: formData.service_amount ? parseFloat(formData.service_amount) : null,
            claims_amount: formData.claims_amount && formData.claims_amount.trim() !== '' 
                ? parseFloat(formData.claims_amount) 
                : null, // Always include claims_amount (null if empty)
            due_date: formData.due_date,
            partner_id: formData.partner_id,
            case_type: caseTypeId,
            assignee: parseInt(formData.assigned_to) || 2, // Default to 2 if not assigned 
            priority: formData.priority,
            ticket_stage: formData.ticket_stage,
            reviewer: parseInt(formData.reviewer_id) || 2, // Default to 2 if not set
            "changed reason": `Task updated: ${formData.task_summary}`,
        };
        
        // Conditionally add optional fields
        if (stakeholderData) {
            taskData.stakeholder = stakeholderData;
        }
        if (commentData) {
            taskData.comment = commentData;
        }
        if (paymentsData) {
            taskData.payments = paymentsData; // Include payments if payment phases exist
        }

            console.log('Task update data prepared:', taskData);
        console.log('Claims amount value:', taskData.claims_amount);
        console.log('Claims amount type:', typeof taskData.claims_amount);
        console.log('FormData claims_amount:', formData.claims_amount);
        console.log('Full taskData JSON:', JSON.stringify(taskData, null, 2));

            // Call the update API
            const response = await fetch('http://localhost:3000/support/update_Task', {
                method: 'PATCH',
                headers: {
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
                    'session_id': 'fddc661a-dfb4-4896-b7b1-448e1adf7bc2',
                    'jwt_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiBlbXBsb3llZUBjb21wYW55LmNvbSIsInBhc3N3b3JkIjoiZW1wbG95ZWUxMjMiLCJpYXQiOjE3NTY0NTExODR9.Ijk3qvShuzbNxKJLfwK_zt-lZdT6Uwe1jI5sruMac0k',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Task updated successfully:', result);

                toast({
                    title: "Success",
                    description: `Task updated successfully!`,
                });

                // Automatically upload documents if any are selected and files are present
                const documentsToUpload = formData.selectedDocuments.filter(docName => {
                    const file = documentUploads[docName]?.file;
                    return file !== null && file !== undefined;
                });

                if (documentsToUpload.length > 0) {
                    console.log("Documents found, starting automatic upload after task update...");
                    toast({
                        title: "Uploading Documents",
                        description: "Please wait while documents are being uploaded...",
                    });
                    
                    // Call handleUploadDocuments automatically
                    await handleUploadDocuments();
                }

                // Navigate back to dashboard
                const dashboardRoute = getDashboardRoute();
                console.log('Navigating to dashboard route:', dashboardRoute);
                navigate(dashboardRoute);
            } else {
                const errorData = await response.text();
                console.error('API Error:', response.status, errorData);

                toast({
                    title: "Error",
                    description: `Failed to update task. Status: ${response.status}`,
                    variant: "destructive",
                });
            }

        } catch (error: any) {
            console.error('Error updating task:', error);

            let errorMessage = "An unexpected error occurred";
            let errorTitle = "Error";

            if (error?.message) {
                errorMessage = error.message;
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-primary-500 py-6 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <Card className="shadow-lg rounded-lg bg-white">
                        <CardContent className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                                <p className="text-gray-600">Loading task data...</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary-500 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Card className="shadow-lg rounded-lg bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
                        <CardTitle className="text-2xl font-bold">Edit Task</CardTitle>
                        <Button
                            variant="outline"
                            onClick={() => {
                                try {
                                    const route = getDashboardRoute();
                                    console.log('Manual navigation to:', route);
                                    navigate(route);
                                } catch (error) {
                                    console.error('Manual navigation error:', error);
                                    navigate('/admin-dashboard');
                                }
                            }}
                            className="bg-white border-2 border-gray-300 hover:border-primary-500 hover:bg-gray-50 text-black"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </CardHeader>
                    <CardDescription className="px-6 pb-4 text-gray-500">
                        Edit the task details below.
                    </CardDescription>
                    <CardContent className="space-y-6">
                        {/* Basic Information Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="summary">Task Summary *</Label>
                                    <div className="flex items-center h-10 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                                        {formData.task_summary || 'No task summary available'}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Task summary cannot be changed when editing</p>
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
                                    <Label htmlFor="service_amount">service amount (₹) *</Label>
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
                                    <Label htmlFor="claims_amount">claim amount (₹)</Label>
                                    <Input
                                        type="number"
                                        id="claims_amount"
                                        name="claims_amount"
                                        value={formData.claims_amount}
                                        onChange={handleInputChange}
                                        placeholder="Enter claim amount"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Case Type & Document Selection Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Case Type & Documents</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Case Type</Label>
                                    <div className="flex items-center h-10 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                                        {formData.caseType || 'No case type selected'}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Case type cannot be changed when editing</p>
                                </div>
                            </div>

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
                                                    .map((document, index) => (
                                                        <div
                                                            key={`doc-${index}-${document.document_name}-${document.category_id || 'no-cat'}`}
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
                                                    .map((document, index) => (
                                                        <div
                                                            key={`doc-other-${index}-${document.document_name}-${document.category_id || 'no-cat'}`}
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
                                            // Fallback: Show at least "Other" option if documents array is empty
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id="Other"
                                                        checked={formData.selectedDocuments.includes("Other")}
                                                        onChange={(e) =>
                                                            handleDocumentSelection("Other", e.target.checked)
                                                        }
                                                        className="rounded border-gray-300"
                                                    />
                                                    <Label
                                                        htmlFor="Other"
                                                        className="text-sm font-normal cursor-pointer"
                                                    >
                                                        Other
                                                    </Label>
                                                </div>
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
                                                                    setCustomDocumentNames((prev) => ({
                                                                        ...prev,
                                                                        "Other": value,
                                                                    }));
                                                                }}
                                                                onKeyDown={(e) => {
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
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                       
                        </div>

                        {/* Document Uploads Section - Only show when documents are selected via checkboxes */}
                        {formData.selectedDocuments && Array.isArray(formData.selectedDocuments) && formData.selectedDocuments.length > 0 && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold border-b pb-2">
                                    Document Uploads
                                </h3>
                                {(() => {
                                    // Calculate total size of all uploaded files
                                    const totalSize = Object.keys(documentUploads).reduce((total, docName) => {
                                        const file = documentUploads[docName]?.file;
                                        return total + (file ? file.size : 0);
                                    }, 0);
                                    const maxSizeForMultiple = 10 * 1024 * 1024; // 10MB
                                    const hasReachedLimit = totalSize >= maxSizeForMultiple;

                                    return formData.selectedDocuments
                                        .filter((documentName) => {
                                            // Check if this document already has a file uploaded
                                            const hasFile = documentUploads[documentName]?.file;
                                            // Show if: has file OR total size hasn't reached limit
                                            return hasFile || !hasReachedLimit;
                                        })
                                        .map((documentName) => {
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
                                                                        const success = await handleDocumentUpload(documentName, file);
                                                                        if (success) {
                                                                            toast({
                                                                                title: "File Added",
                                                                                description: `${file.name} has been added for ${displayName}`,
                                                                            });
                                                                        } else {
                                                                            // Reset the file input if validation failed
                                                                            e.target.value = '';
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
                                        });
                                })()}
                            </div>
                        )}

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
                      <SelectValue placeholder={"Select partner"}>
                        {formData.partner_id && getSelectedPartnerInfo() ? (
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {getSelectedPartnerInfo()?.first_name} {getSelectedPartnerInfo()?.last_name}
                            </span>
                          </div>
                        ) : (
                          "Select partner"
                        )}
                      </SelectValue>
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

                        {/* Uploaded Documents Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="text-lg font-semibold">Uploaded Documents</h3>
                                {formData.caseType && formData.selectedDocuments.length > 0 && (
                                    <Button
                                        type="button"
                                        onClick={handleUploadDocuments}
                                        disabled={isUploadingDocuments}
                                        className="bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUploadingDocuments ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4 mr-2" />
                                                Upload Documents
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                            {uploadedDocuments && uploadedDocuments.length > 0 && (
                                <div className="space-y-4">
                                    {uploadedDocuments.map((doc, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center space-x-3">
                                                <FileText className="h-8 w-8 text-primary-500" />
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {doc.original_filename || (doc.file_path ? doc.file_path.split('/').pop()?.replace(/_upload_v1_.*$/, '') || 'Document' : `Document ${index + 1}`)}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Document ID: {doc.document_id}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {doc.upload_time ? new Date(doc.upload_time).toLocaleString() : 'Upload time not available'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="border-2 border-primary-500 text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                                                    onClick={() => {
                                                        if (doc.document_id) {
                                                            viewDocument(doc.document_id);
                                                        } else {
                                                            console.log('Document ID not available');
                                                        }
                                                    }}
                                                >
                                                    View
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="border-2 border-red-500 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                    onClick={() => deleteDocument(doc.document_id)}
                                                    disabled={deletingDocumentId === doc.document_id}
                                                >
                                                    {deletingDocumentId === doc.document_id ? (
                                                        <div className="flex items-center space-x-2">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                            <span>Removing...</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center space-x-2">
                                                            <Trash2 className="h-4 w-4" />
                                                            <span>Delete</span>
                                                        </div>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Customer Information Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Customer Information</h3>
                            <div className="p-4 border rounded-lg bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                                        <div className="text-base font-semibold text-gray-900">
                                            {currentCustomer ? currentCustomer.customer_name : 'Loading...'}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                                        <div className="text-base text-gray-900">
                                            {currentCustomer?.email_address || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Mobile Number</Label>
                                        <div className="text-base text-gray-900">
                                            {currentCustomer?.mobile_number || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Customer Type</Label>
                                        <div className="text-base text-gray-900">
                                            {currentCustomer?.customer_type || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">GSTIN</Label>
                                        <div className="text-base text-gray-900">
                                            {currentCustomer?.gstin || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">PAN</Label>
                                        <div className="text-base text-gray-900">
                                            {currentCustomer?.pan || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">State</Label>
                                        <div className="text-base text-gray-900">
                                            {currentCustomer?.state || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Pincode</Label>
                                        <div className="text-base text-gray-900">
                                            {currentCustomer?.pincode || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Assignment Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Assignment & Review</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Assigned To</Label>
                                    <Select
                                        value={formData.assigned_to}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
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
                                {/* <div>
                                    <Label>Customer</Label>
                                    <div className="flex items-center space-x-3"> */}
                                {/* <Select value={formData.customer_id || ''} onValueChange={handleCustomerChange}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select customer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {isLoadingCustomers ? (
                                                    <SelectItem value="loading" disabled>Loading customers...</SelectItem>
                                                ) : customers.length > 0 ? (
                                                    customers.map(customer => (
                                                        <SelectItem key={customer.customer_id} value={customer.customer_id.toString()}>
                                                            {customer.customer_name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="no-customers" disabled>No customers available</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select> */}
                                {/* <Dialog open={createCustomerOpen} onOpenChange={setCreateCustomerOpen}> */}
                                {/* <DialogTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="bg-white border-2 border-gray-300 hover:border-primary-500 hover:bg-gray-50 text-black"
                                                >
                                                    Create New Customer
                                                </Button>
                                            </DialogTrigger> */}
                                {/* <DialogContent className="sm:max-w-4xl w-[96vw] p-0">
                                                <DialogHeader>
                                                    <DialogTitle className="px-4 sm:px-6 pt-4">Create New Customer</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-6 py-4 px-4 sm:px-6 max-h-[75vh] overflow-y-auto">
                                                    <div className="rounded-lg border bg-white p-4 sm:p-5 shadow-sm">
                                                        <h4 className="text-lg font-semibold mb-4">Basic Information</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                            <div>
                                                                <Label>First Name *</Label>
                                                                <Input value={newCustomer.first_name} onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })} placeholder="Enter first name" />
                                                            </div>
                                                            <div>
                                                                <Label>Last Name *</Label>
                                                                <Input value={newCustomer.last_name} onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })} placeholder="Enter last name" />
                                                            </div>
                                                            <div>
                                                                <Label>Email Address *</Label>
                                                                <Input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} placeholder="customer@example.com" />
                                                            </div>
                                                            <div>
                                                                <Label>Mobile Number</Label>
                                                                <Input value={newCustomer.mobile} onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })} placeholder="Enter mobile number" />
                                                            </div>
                                                            <div>
                                                                <Label>Username *</Label>
                                                                <Input value={newCustomer.userName} onChange={(e) => setNewCustomer({ ...newCustomer, userName: e.target.value })} placeholder="Enter username" />
                                                            </div>
                                                            <div>
                                                                <Label>Password *</Label>
                                                                <Input type="password" value={newCustomer.password_hash} onChange={(e) => setNewCustomer({ ...newCustomer, password_hash: e.target.value })} placeholder="Enter password" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <DialogFooter className="px-4 sm:px-6 pb-4">
                                                    <Button variant="outline" onClick={() => setCreateCustomerOpen(false)}>Cancel</Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={handleCreateCustomer}
                                                        className="bg-white border-2 border-gray-300 hover:border-primary-500 hover:bg-gray-50 text-black"
                                                    >
                                                        Create Customer
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent> */}
                                {/* </Dialog> */}
                                {/* </div> */}
                                {/* </div> */}
                            </div>
                        </div>

                        {/* Priority & Status Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Priority & Status</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <Label>Priority</Label>
                                    <Select value={formData.priority} onValueChange={(value) => handleSelectChange('priority', value)}>
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
                                    <Select value={formData.ticket_stage} onValueChange={(value) => handleSelectChange('ticket_stage', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select stage" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Under Evaluation">Under Evaluation</SelectItem>
                                            <SelectItem value="Evaluation under review">Evaluation under review</SelectItem>
                                            <SelectItem value="Evaluated">Evaluated</SelectItem>
                                            <SelectItem value="Agreement pending">Agreement pending</SelectItem>
                                            <SelectItem value="1st Instalment Pending">1st Instalment Pending</SelectItem>
                                            <SelectItem value="Pending with grievance cell of insurance company">Pending with grievance cell of insurance company</SelectItem>
                                            <SelectItem value="Pending with Ombudsman">Pending with Ombudsman</SelectItem>
                                            <SelectItem value="Under Litigation/Consumer Forum">Under Litigation/Consumer Forum</SelectItem>
                                            <SelectItem value="Under Arbitration">Under Arbitration</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                            <SelectItem value="Partner Payment Pending">Partner Payment Pending</SelectItem>
                                            <SelectItem value="Partner Payment Done">Partner Payment Done</SelectItem>
                                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                                            <SelectItem value="on hold">on hold</SelectItem>
                                            <SelectItem value="Under process">Under process</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label>Assign Date *</Label>
                                <Input
                                    type="date"
                                    value={formData.due_date ? (() => {
                                        // Ensure due_date is in YYYY-MM-DD format for date input
                                        try {
                                            const dateStr = formData.due_date;
                                            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                                // Already in correct format
                                                return dateStr;
                                            } else if (dateStr.includes('T')) {
                                                // ISO format with time
                                                return dateStr.split('T')[0];
                                            } else {
                                                // Try to parse and format
                                                const date = new Date(dateStr);
                                                if (!isNaN(date.getTime())) {
                                                    return date.toISOString().split('T')[0];
                                                }
                                            }
                                            return dateStr;
                                        } catch (error) {
                                            console.error('Error formatting due_date:', error);
                                            return formData.due_date;
                                        }
                                    })() : ''}
                                    min={(() => {
                                        const twoMonthsAgo = new Date();
                                        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
                                        return twoMonthsAgo.toISOString().split("T")[0];
                                    })()}
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

                        {/* Stakeholders Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Stakeholders</h3>

                            {stakeholders.length > 0 ? (
                                stakeholders.map((stakeholder, index) => (
                                    <div key={stakeholder.id} className="space-y-3 p-4 border rounded-lg bg-white">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <Label>Name *</Label>
                                                <Input
                                                    placeholder="John Stakeholder"
                                                    value={stakeholder.stakeholder_name}
                                                    onChange={(e) => {
                                                        const updated = [...stakeholders];
                                                        updated[index].stakeholder_name = e.target.value;
                                                        setStakeholders(updated);
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <Label>Contact Email *</Label>
                                                <Input
                                                    type="email"
                                                    placeholder="john@example.com"
                                                    value={stakeholder.contact_email}
                                                    onChange={(e) => {
                                                        const updated = [...stakeholders];
                                                        updated[index].contact_email = e.target.value;
                                                        setStakeholders(updated);
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <Label>Role *</Label>
                                                <Input
                                                    type="text"
                                                    value={stakeholder.role}
                                                    onChange={(e) => {
                                                        const updated = [...stakeholders];
                                                        updated[index].role = e.target.value;
                                                        setStakeholders(updated);
                                                    }}
                                                    placeholder="Enter role"
                                                    className="w-full"
                                                />
                                            </div>

                                            <div>
                                                <Label>Notes</Label>
                                                <Input
                                                    placeholder="Important reviewer"
                                                    value={stakeholder.notes || ""}
                                                    onChange={(e) => {
                                                        const updated = [...stakeholders];
                                                        updated[index].notes = e.target.value;
                                                        setStakeholders(updated);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-gray-500 text-center py-4">
                                    No stakeholders available for this task.
                                </div>
                            )}
                        </div>



                        {/* Comments Section */}

                        
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Comments</h3>
<Label>Add Comment</Label>
        <Textarea
            placeholder="Enter your comment here..."
            value={newComment.text}
            onChange={(e) => setNewComment({ ...newComment, text: e.target.value })}
            rows={3}
        />
                            {/* Existing Comments - Editable */}
                            {comments.length > 0 && (
                                <div className="space-y-4">
                                    {comments.map((comment, index) => (
                                        <div key={comment.id} className="space-y-3 p-4 border rounded-lg bg-white">
                                            <div>
                                                <Label>Comment</Label>
                                                <Textarea
                                                    placeholder="Enter your comment here..."
                                                    value={comment.text}
                                                    onChange={(e) => {
                                                        const updated = [...comments];
                                                        updated[index].text = e.target.value;
                                                        setComments(updated);
                                                    }}
                                                    disabled
                                                    rows={3}
                                                />
                                            </div>
                                            
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`internal-comment-${index}`}
                                                    checked={comment.isInternal}
                                                    onChange={(e) => {
                                                        const updated = [...comments];
                                                        updated[index].isInternal = e.target.checked;
                                                        setComments(updated);
                                                    }}
                                                    className="rounded border-gray-300"
                                                />
                                                <Label htmlFor={`internal-comment-${index}`} className="text-sm font-normal cursor-pointer">
                                                    Internal Comment
                                                </Label>
                                            </div>
                                            {/* <div className="flex justify-end">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeComment(comment.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <X className="h-4 w-4 mr-1" />
                                                    Remove
                                                </Button>
                                            </div> */}
                                            
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Payment Section */}
                        {formData.caseType && (
                            <div className="space-y-4">
                                <div className="border-b pb-2">
                                    <h3 className="text-lg font-semibold">Payment Management</h3>
                                    <p className="text-sm text-gray-600 mt-1">Edit payment phases and generate invoices</p>
                                </div>
                                <div className="text-sm text-gray-600 mb-2">Current Case Type: {formData.caseType}</div>

                                {/* Show API Payment Phases */}
                                <div className="space-y-4">
                                    <div className="mb-4 flex justify-between items-center">
                                        <h4 className="text-lg font-semibold text-gray-900">
                                            Payment Phases ({paymentStages.length})
                                        </h4>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleAddPaymentPhase}
                                            className="bg-white border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-600"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Payment Phase
                                        </Button>
                                    </div>
                                    
                                {paymentStages.length > 0 ? (
                                    <>
                                        {editablePaymentStages.map((phase: any, index: number) => {
                                            // Debug logging for payment_date
                                            if (index === 0) {
                                                console.log('Payment Phase Debug:', {
                                                    phase_index: index,
                                                    phase_name: phase.phase_name,
                                                    payment_date: phase.payment_date,
                                                    payment_date_type: typeof phase.payment_date,
                                                    due_date: phase.due_date,
                                                    full_phase: phase
                                                });
                                            }
                                            return (
                                            <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h4 className="font-semibold text-gray-900">Payment Phase {index + 1}</h4>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge
                                                            variant={(paymentStages[index]?.status || editablePaymentStages[index]?.status || 'pending') === 'paid' ? 'default' : 'secondary'}
                                                            className={(paymentStages[index]?.status || editablePaymentStages[index]?.status || 'pending') === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                                                        >
                                                            {(paymentStages[index]?.status || editablePaymentStages[index]?.status || 'pending') === 'paid' ? 'Paid' : 'Pending'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                    <div>
                                                        <Label>Phase Name</Label>
                                                        <Popover open={phaseNameComboboxOpenIndex === index} onOpenChange={(open) => setPhaseNameComboboxOpenIndex(open ? index : null)}>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    aria-expanded={phaseNameComboboxOpenIndex === index}
                                                                    className="w-full justify-between mt-1"
                                                                >
                                                                    {phase.phase_name || "Select phase or type to add new..."}
                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                                <Command shouldFilter={false}>
                                                                    <CommandInput 
                                                                        placeholder="Search phase or type new phase name..." 
                                                                        value={phase.phase_name || ''}
                                                                        onValueChange={(value) => handlePaymentStageChange(index, 'phase_name', value)}
                                                                    />
                                                                    <CommandList>
                                                                        <CommandGroup>
                                                                            {phase.phase_name && 
                                                                             phase.phase_name.trim() !== '' && 
                                                                             phase.phase_name !== "Agreement with the party" &&
                                                                             phase.phase_name !== "Filing case with Ombudsman" &&
                                                                             phase.phase_name !== "Claim settlement (on receipt of claim amount by the party)" && (
                                                                                <CommandItem
                                                                                    value={phase.phase_name}
                                                                                    onSelect={() => {
                                                                                        handlePaymentStageChange(index, 'phase_name', phase.phase_name);
                                                                                        setPhaseNameComboboxOpenIndex(null);
                                                                                    }}
                                                                                >
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "mr-2 h-4 w-4",
                                                                                            "opacity-100"
                                                                                        )}
                                                                                    />
                                                                                    {phase.phase_name} (Custom)
                                                                                </CommandItem>
                                                                            )}
                                                                            <CommandItem
                                                                                value="Agreement with the party"
                                                                                onSelect={() => {
                                                                                    handlePaymentStageChange(index, 'phase_name', 'Agreement with the party');
                                                                                    setPhaseNameComboboxOpenIndex(null);
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        phase.phase_name === "Agreement with the party" ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                Agreement with the party
                                                                            </CommandItem>
                                                                            <CommandItem
                                                                                value="Filing case with Ombudsman"
                                                                                onSelect={() => {
                                                                                    handlePaymentStageChange(index, 'phase_name', 'Filing case with Ombudsman');
                                                                                    setPhaseNameComboboxOpenIndex(null);
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        phase.phase_name === "Filing case with Ombudsman" ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                Filing case with Ombudsman
                                                                            </CommandItem>
                                                                            <CommandItem
                                                                                value="Claim settlement (on receipt of claim amount by the party)"
                                                                                onSelect={() => {
                                                                                    handlePaymentStageChange(index, 'phase_name', 'Claim settlement (on receipt of claim amount by the party)');
                                                                                    setPhaseNameComboboxOpenIndex(null);
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        phase.phase_name === "Claim settlement (on receipt of claim amount by the party)" ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                Claim settlement (on receipt of claim amount by the party)
                                                                            </CommandItem>
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                    <div>
                                                        <Label>Payment Date</Label>
                                                        <Popover open={paymentDateCalendarOpenIndex === index} onOpenChange={(open) => setPaymentDateCalendarOpenIndex(open ? index : null)}>
                                                            <PopoverTrigger asChild>
                                                                <div className="relative">
                                                                    <Input
                                                                        type="text"
                                                                        readOnly
                                                                        value={phase.due_date ? (() => {
                                                                            try {
                                                                                const dateStr = phase.due_date;
                                                                                if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                                                                    const [year, month, day] = dateStr.split('-').map(Number);
                                                                                    return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
                                                                                }
                                                                                if (dateStr.includes('T')) {
                                                                                    const date = new Date(dateStr);
                                                                                    if (!isNaN(date.getTime())) {
                                                                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                                                                        const day = String(date.getDate()).padStart(2, '0');
                                                                                        const year = date.getFullYear();
                                                                                        return `${month}/${day}/${year}`;
                                                                                    }
                                                                                }
                                                                                const date = new Date(dateStr);
                                                                                if (!isNaN(date.getTime())) {
                                                                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                                                                    const day = String(date.getDate()).padStart(2, '0');
                                                                                    const year = date.getFullYear();
                                                                                    return `${month}/${day}/${year}`;
                                                                                }
                                                                                return '';
                                                                            } catch {
                                                                                return '';
                                                                            }
                                                                        })() : ''}
                                                                        placeholder="MM/DD/YYYY"
                                                                        onClick={() => setPaymentDateCalendarOpenIndex(index)}
                                                                        className="mt-1 cursor-pointer pr-10"
                                                                    />
                                                                    <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                                </div>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={phase.due_date ? (() => {
                                                                        try {
                                                                            const dateStr = phase.due_date;
                                                                            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                                                                const [year, month, day] = dateStr.split('-').map(Number);
                                                                                return new Date(year, month - 1, day);
                                                                            }
                                                                            const date = new Date(dateStr);
                                                                            return !isNaN(date.getTime()) ? date : undefined;
                                                                        } catch {
                                                                            return undefined;
                                                                        }
                                                                    })() : undefined}
                                                                    onSelect={(date) => {
                                                                        if (date) {
                                                                            const year = date.getFullYear();
                                                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                                                            const day = String(date.getDate()).padStart(2, '0');
                                                                            const formattedDate = `${year}-${month}-${day}`;
                                                                            handlePaymentStageChange(index, 'due_date', formattedDate);
                                                                            setPaymentDateCalendarOpenIndex(null);
                                                                        }
                                                                    }}
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                    <div>
                                                        <Label>Phase Amount (₹)</Label>
                                                        <Input
                                                            type="number"
                                                            value={phase.phase_amount}
                                                            onChange={(e) => handlePaymentStageChange(index, 'phase_amount', parseFloat(e.target.value) || 0)}
                                                            placeholder="Enter amount"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                                {/* Invoice Number Display */}
                                                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                    <Label className="text-sm font-medium text-gray-700">Invoice Number</Label>
                                                    <p className="text-sm mt-1 font-semibold text-gray-900">
                                                        {paymentStages[index]?.invoice_number && 
                                                         paymentStages[index].invoice_number !== 'N/A' && 
                                                         paymentStages[index].invoice_number !== null &&
                                                         String(paymentStages[index].invoice_number).trim() !== '' 
                                                            ? paymentStages[index].invoice_number 
                                                            : 'Not Generated'}
                                                    </p>
                                                </div>
                                                {/* Individual Action Buttons for each phase */}
                                                <div className="flex justify-end items-center pt-3 border-t border-gray-200">
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleInvoiceGenerated(paymentStages[index]?.case_phase_id)}
                                                            className="bg-white border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-600"
                                                        >
                                                            Invoice Generation
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleSavePayments(index)}
                                                            className="bg-white border-2 border-green-300 hover:border-green-500 hover:bg-green-50 text-green-600"
                                                        >
                                                            Save Changes
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                        })}

                                        {/* Payment Summary */}
                                        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                                            <h4 className="font-semibold text-gray-900 mb-3">Payment Summary</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-600">Total Service Amount</p>
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        ₹{formData.service_amount 
                                                            ? parseFloat(formData.service_amount).toLocaleString('en-IN') 
                                                            : '0'}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-600">Pending Amount</p>
                                                    <p className="text-2xl font-bold text-red-600">
                                                        ₹{(() => {
                                                            const serviceAmount = parseFloat(formData.service_amount || '0') || 0;
                                                            // Calculate total from editablePaymentStages (current form values) or paymentStages (saved values)
                                                            const calculateTotal = (phases: any[]) => {
                                                                return phases.reduce((sum: number, phase: any) => {
                                                                    if (!phase) return sum;
                                                                    // Try multiple ways to get the amount
                                                                    const amount = phase.phase_amount ?? phase.paid_amount ?? 0;
                                                                    if (amount === null || amount === undefined) return sum;
                                                                    const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount));
                                                                    return sum + (isNaN(numAmount) ? 0 : numAmount);
                                                                }, 0);
                                                            };
                                                            
                                                            const totalPaymentPhases = editablePaymentStages.length > 0 
                                                                ? calculateTotal(editablePaymentStages)
                                                                : calculateTotal(paymentStages);
                                                            
                                                            const pendingAmount = Math.max(0, serviceAmount - totalPaymentPhases);
                                                            return pendingAmount.toLocaleString('en-IN');
                                                        })()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-3 text-center">
                                                <p className="text-sm text-gray-600">
                                                    Paid Amount: ₹{(() => {
                                                        // Calculate total from editablePaymentStages (current form values) or paymentStages (saved values)
                                                        const calculateTotal = (phases: any[]) => {
                                                            return phases.reduce((sum: number, phase: any) => {
                                                                if (!phase) return sum;
                                                                // Try multiple ways to get the amount
                                                                const amount = phase.phase_amount ?? phase.paid_amount ?? 0;
                                                                if (amount === null || amount === undefined) return sum;
                                                                const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount));
                                                                return sum + (isNaN(numAmount) ? 0 : numAmount);
                                                            }, 0);
                                                        };
                                                        
                                                        const paidAmount = editablePaymentStages.length > 0 
                                                            ? calculateTotal(editablePaymentStages)
                                                            : calculateTotal(paymentStages);
                                                        
                                                        return paidAmount.toLocaleString('en-IN');
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                        <p className="text-gray-600 mb-4">No payment phases found for this case.</p>
                                        <p className="text-sm text-gray-500 mb-4">Click "Add Payment Phase" above to create a new payment phase.</p>
                                    </div>
                                )}
                                </div>
                            </div>
                        )}

                        {/* Payment Phase Modal */}
                        <Dialog open={showPaymentPhaseModal} onOpenChange={(open) => {
                            if (!open) {
                                handleClosePaymentPhaseModal();
                            }
                        }}>
                            <DialogContent className="sm:max-w-lg w-[95vw] max-w-[95vw] sm:w-auto">
                                <DialogHeader>
                                    <DialogTitle>Add Payment Stage</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4 overflow-y-auto max-h-[80vh]">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="col-span-1 sm:col-span-2">
                                        <Label htmlFor="modal-phase">Phase</Label>
                                        <Popover open={phaseNameComboboxOpen} onOpenChange={setPhaseNameComboboxOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={phaseNameComboboxOpen}
                                                    className="w-full justify-between mt-1"
                                                >
                                                    {paymentPhaseForm.phase_name || "Select phase or type to add new..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                <Command shouldFilter={false}>
                                                    <CommandInput 
                                                        placeholder="Search phase or type new phase name..." 
                                                        value={paymentPhaseForm.phase_name}
                                                        onValueChange={(value) => setPaymentPhaseForm(prev => ({ ...prev, phase_name: value }))}
                                                    />
                                                    <CommandList>
                                                        <CommandGroup>
                                                            {paymentPhaseForm.phase_name && 
                                                             paymentPhaseForm.phase_name.trim() !== '' && 
                                                             paymentPhaseForm.phase_name !== "Agreement with the party" &&
                                                             paymentPhaseForm.phase_name !== "Filing case with Ombudsman" &&
                                                             paymentPhaseForm.phase_name !== "Claim settlement (on receipt of claim amount by the party)" && (
                                                                <CommandItem
                                                                    value={paymentPhaseForm.phase_name}
                                                                    onSelect={() => {
                                                                        setPaymentPhaseForm(prev => ({ ...prev, phase_name: paymentPhaseForm.phase_name }));
                                                                        setPhaseNameComboboxOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            "opacity-100"
                                                                        )}
                                                                    />
                                                                    {paymentPhaseForm.phase_name} (Custom)
                                                                </CommandItem>
                                                            )}
                                                            <CommandItem
                                                                value="Agreement with the party"
                                                                onSelect={() => {
                                                                    setPaymentPhaseForm(prev => ({ ...prev, phase_name: "Agreement with the party" }));
                                                                    setPhaseNameComboboxOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        paymentPhaseForm.phase_name === "Agreement with the party" ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                Agreement with the party
                                                            </CommandItem>
                                                            <CommandItem
                                                                value="Filing case with Ombudsman"
                                                                onSelect={() => {
                                                                    setPaymentPhaseForm(prev => ({ ...prev, phase_name: "Filing case with Ombudsman" }));
                                                                    setPhaseNameComboboxOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        paymentPhaseForm.phase_name === "Filing case with Ombudsman" ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                Filing case with Ombudsman
                                                            </CommandItem>
                                                            <CommandItem
                                                                value="Claim settlement (on receipt of claim amount by the party)"
                                                                onSelect={() => {
                                                                    setPaymentPhaseForm(prev => ({ ...prev, phase_name: "Claim settlement (on receipt of claim amount by the party)" }));
                                                                    setPhaseNameComboboxOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        paymentPhaseForm.phase_name === "Claim settlement (on receipt of claim amount by the party)" ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                Claim settlement (on receipt of claim amount by the party)
                                                            </CommandItem>
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div>
                                        <Label htmlFor="modal-due-date">Payment Date</Label>
                                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                            <PopoverTrigger asChild>
                                                <div className="relative">
                                                    <Input
                                                        id="modal-due-date"
                                                        type="text"
                                                        readOnly
                                                            value={paymentPhaseForm.due_date ? format(new Date(paymentPhaseForm.due_date), 'dd/MM/yyyy') : ''}
                                                            placeholder="dd/mm/yyyy"
                                                        onClick={() => setCalendarOpen(true)}
                                                            className="mt-1 cursor-pointer pr-10 w-full"
                                                    />
                                                    <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 z-[100]" align="start">
                                                <Calendar 
                                                    mode="single" 
                                                    selected={paymentPhaseForm.due_date ? new Date(paymentPhaseForm.due_date) : undefined} 
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            // Format date in local timezone (YYYY-MM-DD) to avoid timezone shift
                                                            const year = date.getFullYear();
                                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                                            const day = String(date.getDate()).padStart(2, '0');
                                                            const formattedDate = `${year}-${month}-${day}`;
                                                            setPaymentPhaseForm(prev => ({ ...prev, due_date: formattedDate }));
                                                            setCalendarOpen(false);
                                                        }
                                                    }} 
                                                />
                                                <div className="flex justify-between items-center p-3 border-t">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const today = new Date();
                                                            // Format date in local timezone (YYYY-MM-DD) to avoid timezone shift
                                                            const year = today.getFullYear();
                                                            const month = String(today.getMonth() + 1).padStart(2, '0');
                                                            const day = String(today.getDate()).padStart(2, '0');
                                                            const formattedDate = `${year}-${month}-${day}`;
                                                            setPaymentPhaseForm(prev => ({ ...prev, due_date: formattedDate }));
                                                            setCalendarOpen(false);
                                                        }}
                                                        className="text-sm"
                                                    >
                                                        Today
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCalendarOpen(false)}
                                                        className="text-sm"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div>
                                        <Label htmlFor="modal-amount">Paid Amount (₹)</Label>
                                        <Input
                                            id="modal-amount"
                                            type="number"
                                            value={paymentPhaseForm.phase_amount || ''}
                                            onChange={(e) => setPaymentPhaseForm(prev => ({ ...prev, phase_amount: parseFloat(e.target.value) || 0 }))}
                                            placeholder="Enter paid amount"
                                                className="mt-1 w-full"
                                        />
                                        </div>
                                        <div>
                                            <Label htmlFor="modal-status">Status</Label>
                                            <Select
                                                value={paymentPhaseForm.status || 'pending'}
                                                onValueChange={(value: 'paid' | 'pending') => setPaymentPhaseForm(prev => ({ ...prev, status: value }))}
                                            >
                                                <SelectTrigger className="mt-1 w-full" id="modal-status">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent className="z-[100]">
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="paid">Paid</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={handleClosePaymentPhaseModal}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSavePaymentPhaseFromModal}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Add Payment
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button
                            variant="outline"
                            className="w-full bg-white border-2 border-gray-300 hover:border-primary-500 hover:bg-gray-50 text-black"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    Updating Task...
                                </>
                            ) : (
                                <>
                                    Update Task
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
            
            {/* Document Viewer Modal */}
            {showDocumentModal && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2"
                    style={{ overflow: 'hidden' }}
                >
                    <div className="bg-white rounded-lg shadow-2xl w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[65vw] h-[95vh] flex flex-col max-w-7xl">
                        {/* Modal Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b border-gray-200 gap-3 sm:gap-0">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Document Viewer</h3>
                            
                            {/* Zoom Controls */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 justify-center sm:justify-start">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleZoomOut}
                                        disabled={zoomLevel <= 50}
                                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-200"
                                    >
                                        <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                    
                                    <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[2.5rem] sm:min-w-[3rem] text-center">
                                        {zoomLevel}%
                                    </span>
                                    
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleZoomIn}
                                        disabled={zoomLevel >= 300}
                                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-200"
                                    >
                                        <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                    
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResetZoom}
                                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-200"
                                        title="Reset Zoom"
                                    >
                                        <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                </div>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setShowDocumentModal(false);
                                        setDocumentUrl('');
                                        setDocumentType('');
                                        setZoomLevel(100); // Reset zoom when closing
                                        setPanX(0);
                                        setPanY(0);
                                        setIsDragging(false);
                                        // Clean up blob URL
                                        if (documentUrl.startsWith('blob:')) {
                                            URL.revokeObjectURL(documentUrl);
                                        }
                                    }}
                                    className="text-gray-600 hover:text-gray-800 border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 px-3 py-2 text-sm sm:text-base"
                                >
                                    <XCircle className="h-4 w-4 sm:h-6 sm:w-6 mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Close</span>
                                    <span className="sm:hidden">✕</span>
                                </Button>
                            </div>
                        </div>
                        
                        {/* Modal Content */}
                        <div className="flex-1 p-2 overflow-hidden">
                            {documentType.includes('image/') || documentType === 'image/svg+xml' ? (
                                <div 
                                    className="flex items-center justify-center h-full min-h-full cursor-grab overflow-hidden"
                                    style={{ cursor: zoomLevel > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    onWheel={handleWheel}
                                >
                                    <img
                                        src={documentUrl}
                                        alt="Document"
                                        className="object-contain rounded-lg shadow-lg transition-transform duration-200 select-none"
                                        style={{ 
                                            transform: `scale(${zoomLevel / 100}) translate(${panX}px, ${panY}px)`,
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            userSelect: 'none',
                                            transformOrigin: 'center center'
                                        }}
                                        draggable={false}
                                        onError={(e) => {
                                            console.error('Error loading image:', e);
                                            toast({
                                                title: "Error",
                                                description: "Failed to load document image",
                                                variant: "destructive",
                                            });
                                        }}
                                    />
                                </div>
                            ) : documentType.includes('application/pdf') || documentType === 'url' ? (
                                <div 
                                    className="h-full w-full overflow-hidden cursor-grab"
                                    style={{ cursor: zoomLevel > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    onWheel={handleWheel}
                                >
                                    <iframe
                                        src={`${documentUrl}#toolbar=0&navpanes=0&scrollbar=1&statusbar=0&messages=0&scrollbar=1`}
                                        className="w-full h-full border-0 rounded-lg transition-transform duration-200 select-none"
                                        title="Document Viewer"
                                        style={{ 
                                            minHeight: '100%',
                                            transform: `scale(${zoomLevel / 100}) translate(${panX}px, ${panY}px)`,
                                            transformOrigin: 'center center',
                                            userSelect: 'none'
                                        }}
                                        draggable={false}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 mb-4">This file type cannot be previewed</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditTask;

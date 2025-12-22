import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload, User, FileText, Calendar, Edit, Save, X, Plus, Trash2, Clock, MapPin, Eye, ZoomIn, ZoomOut, RotateCcw, XCircle } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';

import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CaseService, CaseDetails } from '@/services/caseService';

// Extended interface for the actual API response
interface ExtendedCaseDetails extends CaseDetails {
  claim_amount?: number | string; // Claim amount from API
  employees: {
    employee_id: number;
    first_name: string;
    last_name: string;
    age?: number;
    gender?: string;
    address?: string;
    manager?: string;
    user_id?: number;
    team_name?: string;
    created_by?: number;
    department?: string;
    pan_number?: string;
    reports_to?: number;
    updated_by?: number;
    work_phone?: string;
    designation?: string;
    bank_details?: any;
    created_time?: string;
    deleted_flag?: boolean;
    joining_date?: string;
    updated_time?: string;
    aadhar_number?: string;
    mobile_number?: string;
    work_extension?: string;
    office_location?: string;
    additional_notes?: string;
    management_level?: string;
    emergency_contact?: string;
    employment_status?: string;
    can_approve_bonuses?: boolean;
    profile_picture_url?: string;
    emergency_contact_name?: string;
    communication_preference?: string;
    max_bonus_approval_limit?: number;
    emergency_contact_relation?: string;
  };
  'claim amount'?: string | number;
  'service amount'?: string | number;
}

type TaskStatus = 'new' | 'in-progress' | 'pending' | 'completed' | 'cancelled';
type TicketStage = 'analysis' | 'review' | 'approval' | 'waiting';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface TaskData {
  id: string;
  task_id: string;
  title: string;
  description?: string;
  case_description?: string;
  task_summary?: string;
  case_summary?: string;
  current_status: TaskStatus;
  ticket_stage: TicketStage;
  priority: TaskPriority;
  due_date?: string;
  estimated_efforts?: number;
  time_tracked?: number;
  progress_percentage?: number;
  resolution_summary?: string;
  customer_satisfaction_rating?: number;
  reviewer_id?: string;
  approver_id?: string;
  category_id?: string;
  case_type?: string;
  selected_documents?: string[];
  created_at: string;
  updated_at: string;
  assigned_to_profile?: { full_name: string };
  customer_profile?: { full_name: string; email?: string; mobile?: string };
  reviewer_profile?: { full_name: string };
  approver_profile?: { full_name: string };
  category?: { name: string; description?: string };
}

interface Stakeholder {
  id: string;
  stakeholder_name?: string;
  role?: string;
  contact?: string;
  contact_email?: string;
  notes?: string;
  stakeholder_id?: string;
  stakeholder_profile?: { full_name: string };
}

// Case type and document mapping
const caseTypeDocumentMap: {[key: string]: string[]} = {
  'insurance-claim': ['Policy Document', 'Claim Form', 'Medical Reports', 'Police Report', 'Photographs', 'Repair Estimates'],
  'legal-case': ['Court Documents', 'Legal Notices', 'Evidence Files', 'Witness Statements', 'Contract Documents'],
  'property-claim': ['Property Documents', 'Insurance Policy', 'Damage Assessment', 'Repair Quotes', 'Photographs'],
  'vehicle-claim': ['Vehicle Registration', 'Insurance Certificate', 'Driving License', 'Accident Report', 'Repair Estimates'],
  'health-insurance': ['Medical Certificates', 'Hospital Bills', 'Prescription Documents', 'Diagnostic Reports', 'Claim Forms'],
  'life-insurance': ['Death Certificate', 'Policy Documents', 'Medical Reports', 'Nominee Documents', 'Claim Forms']
};

// Mock data that matches the task management pages
const mockTasks = [
  {
    id: 'CLM-001',
    task_id: 'CLM-001',
    title: 'Health Insurance Claim Review',
    description: 'Review and process health insurance claim for medical expenses.',
    task_summary: 'Customer John Doe submitted a health insurance claim for recent medical treatment.',
    current_status: 'pending' as TaskStatus,
    ticket_stage: 'review' as TicketStage,
    priority: 'medium' as TaskPriority,
    due_date: '2024-06-25',
    category_id: 'cat-1',
    reviewer_id: 'rev-1',
    approver_id: 'app-1',
    created_at: '2024-06-15T10:00:00Z',
    updated_at: '2024-06-18T14:30:00Z',
    customer_profile: { full_name: 'John Doe', email: 'john.doe@example.com', mobile: '+91 9876543210' },
    assigned_to_profile: { full_name: 'Current Employee' },
    reviewer_profile: { full_name: 'Jane Reviewer' },
    approver_profile: { full_name: 'Sarah Manager' },
    category: { name: 'Insurance Claims', description: 'Health and medical insurance claims' }
  },
  {
    id: 'CLM-002',
    task_id: 'CLM-002',
    title: 'Car Insurance Claim Appeal',
    description: 'Handle appeal for previously denied car insurance claim.',
    task_summary: 'Customer Jane Smith is appealing the denial of her car insurance claim.',
    current_status: 'in-progress' as TaskStatus,
    ticket_stage: 'review' as TicketStage,
    priority: 'high' as TaskPriority,
    due_date: '2024-06-20',
    category_id: 'cat-2',
    reviewer_id: 'rev-2',
    approver_id: 'app-2',
    created_at: '2024-06-14T09:00:00Z',
    updated_at: '2024-06-17T16:45:00Z',
    customer_profile: { full_name: 'Jane Smith', email: 'jane.smith@example.com', mobile: '+91 9876543211' },
    assigned_to_profile: { full_name: 'Current Employee' },
    reviewer_profile: { full_name: 'Mike Senior' },
    approver_profile: { full_name: 'David Director' },
    category: { name: 'Vehicle Claims', description: 'Car and vehicle insurance claims' }
  },
  {
    id: 'CLM-003',
    task_id: 'CLM-003',
    title: 'Life Insurance Benefit Claim',
    description: 'Process life insurance benefit claim following beneficiary request.',
    task_summary: 'Beneficiary Bob Johnson has submitted a claim for life insurance benefits.',
    current_status: 'new' as TaskStatus,
    ticket_stage: 'analysis' as TicketStage,
    priority: 'urgent' as TaskPriority,
    due_date: '2024-06-22',
    created_at: '2024-06-19T11:30:00Z',
    updated_at: '2024-06-19T11:30:00Z',
    customer_profile: { full_name: 'Bob Johnson' },
    assigned_to_profile: { full_name: 'Current Employee' }
  },
  {
    id: 'CLM-004',
    task_id: 'CLM-004',
    title: 'Property Insurance Assessment',
    description: 'Assess property damage claim for residential property.',
    task_summary: 'Property damage assessment required for Alice Brown\'s home insurance claim.',
    current_status: 'in-progress' as TaskStatus,
    ticket_stage: 'approval' as TicketStage,
    priority: 'medium' as TaskPriority,
    due_date: '2024-06-21',
    created_at: '2024-06-13T08:15:00Z',
    updated_at: '2024-06-16T13:20:00Z',
    customer_profile: { full_name: 'Alice Brown' },
    assigned_to_profile: { full_name: 'Current Employee' }
  },
  {
    id: 'CLM-005',
    task_id: 'CLM-005',
    title: 'Travel Insurance Claim',
    description: 'Process travel insurance claim for cancelled trip.',
    task_summary: 'Charlie Wilson submitted a claim for cancelled travel insurance.',
    current_status: 'completed' as TaskStatus,
    ticket_stage: 'approval' as TicketStage,
    priority: 'low' as TaskPriority,
    due_date: '2024-06-18',
    created_at: '2024-06-10T12:00:00Z',
    updated_at: '2024-06-15T17:00:00Z',
    customer_profile: { full_name: 'Charlie Wilson' },
    assigned_to_profile: { full_name: 'Current Employee' }
  }
];

const TaskDetail = () => {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editMode, setEditMode] = useState(searchParams.get('edit') === 'true');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [editedTask, setEditedTask] = useState<Partial<TaskData>>({});
  const [newComment, setNewComment] = useState({ text: '' });
  const [comments, setComments] = useState<any[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [newStakeholder, setNewStakeholder] = useState({
    name: '',
    role: '',
    contact: '',
    contact_email: '',
    notes: ''
  });
  const [showAddStakeholder, setShowAddStakeholder] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([
    { id: 'rev1', full_name: 'Jane Reviewer' },
    { id: 'rev2', full_name: 'Mike Senior' },
    { id: 'app1', full_name: 'Sarah Manager' },
    { id: 'app2', full_name: 'David Director' }
  ]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<any[]>([]);
  const [addingComment, setAddingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [documentUploads, setDocumentUploads] = useState<{[key: string]: {file: File | null}}>({});
  const [dragActive, setDragActive] = useState<{ [key: string]: boolean }>({});
  const [viewingFile, setViewingFile] = useState<any>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [paymentStages, setPaymentStages] = useState<any[]>([]);
  const [changeReason, setChangeReason] = useState('');
  const [caseDetails, setCaseDetails] = useState<ExtendedCaseDetails | null>(null);
  const [caseDetailsLoading, setCaseDetailsLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [viewingDocumentId, setViewingDocumentId] = useState<string | null>(null);
  
  // Document viewer modal states
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });



   // Mock payment stages data
   const mockPaymentStages = [
     {
       id: '1',
       stage: 'Claim Received',
       description: 'Initial claim processing fee',
       amount: 25000.00,
       status: 'paid',
       paidDate: '2024-06-15T10:00:00Z',
       dueDate: '2024-06-20T10:00:00Z'
     },
     {
       id: '2',
       stage: 'Document Review',
       description: 'Document verification and review fee',
       amount: 15000.00,
       status: 'paid',
       paidDate: '2024-06-18T14:30:00Z',
       dueDate: '2024-06-25T10:00:00Z'
     },
     {
       id: '3',
       stage: 'Submitted for Ombudsman',
       description: 'Ombudsman submission processing fee',
       amount: 30000.00,
       status: 'pending',
       paidDate: null,
       dueDate: '2024-07-05T10:00:00Z'
     },
     {
       id: '4',
       stage: 'Legal Review',
       description: 'Legal assessment and review fee',
       amount: 50000.00,
       status: 'pending',
       paidDate: null,
       dueDate: '2024-07-15T10:00:00Z'
     },
     {
       id: '5',
       stage: 'Final Settlement',
       description: 'Final processing and settlement fee',
       amount: 20000.00,
       status: 'pending',
       paidDate: null,
       dueDate: '2024-07-30T10:00:00Z'
     }
   ];

     useEffect(() => {
     if (taskId) {
       // Only fetch case details from the everything-cases API
       fetchCaseDetails();
       
       // Set mock data for demo purposes
       if (taskId.startsWith('CLM-')) {
         const mockTask = mockTasks.find(task => task.id === taskId);
         if (mockTask) {
           setTaskData(mockTask);
           setEditedTask(mockTask);
           setLoading(false);
         }
       } else {
         // For real task IDs, just set basic info and let case details API handle the rest
         setTaskData({
           id: taskId,
           task_id: taskId,
           title: `Task ${taskId}`,
           current_status: 'pending' as TaskStatus,
           ticket_stage: 'analysis' as TicketStage,
           priority: 'medium' as TaskPriority,
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString()
         } as TaskData);
         setLoading(false);
       }
       
       // Call simplified functions for mock data
       fetchComments();
       fetchStakeholders();
       fetchAttachments();
       fetchTrackingEvents();
       fetchPaymentStages();
       setCurrentUser();
    }
  }, [taskId]);

  // Load documents when caseDetails changes
  useEffect(() => {
    if (caseDetails && caseDetails.case_documents) {
      setDocuments(caseDetails.case_documents);
    }
  }, [caseDetails]);

  // Control body scroll when modal is open
  useEffect(() => {
    if (showDocumentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDocumentModal]);

  // Zoom and pan handler functions
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 300)); // Max zoom 300%
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50)); // Min zoom 50%
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
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 100) {
      const sensitivity = 0.7; // Reduce sensitivity for slower movement
      const newPanX = (e.clientX - dragStart.x) * sensitivity;
      const newPanY = (e.clientY - dragStart.y) * sensitivity;
      
      // Limit panning to prevent image from going too far out of view
      const maxPan = 200; // Adjust this value to control how far you can pan
      setPanX(Math.max(-maxPan, Math.min(maxPan, newPanX)));
      setPanY(Math.max(-maxPan, Math.min(maxPan, newPanY)));
      e.preventDefault();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel(prev => Math.min(prev + 10, 300));
    } else {
      setZoomLevel(prev => Math.max(prev - 10, 50));
    }
  };

  const setCurrentUser = () => {
    // Use the first admin/employee user ID as the current user
    // In a real app, this would come from authentication context
    setCurrentUserId('550e8400-e29b-41d4-a716-446655440013'); // Sarah Johnson
  };

  const fetchComments = async () => {
    // For mock tasks, use mock comments
    if (taskId?.startsWith('CLM-')) {
      setComments([
        {
          id: '1',
          comment_text: 'Initial review completed. Waiting for additional documentation.',
          created_at: '2024-06-18T10:30:00Z',
          created_by_profile: { full_name: 'John Reviewer' }
        },
        {
          id: '2',
          comment_text: 'Customer contacted for missing documents.',
          created_at: '2024-06-19T14:15:00Z',
          created_by_profile: { full_name: 'Sarah Agent' }
        }
      ]);
    } else {
      // For real tasks, set empty comments
      setComments([]);
    }
  };

  const fetchStakeholders = async () => {
    // Mock stakeholders for demo tasks
    if (taskId?.startsWith('CLM-')) {
      setStakeholders([
        {
          id: '1',
          stakeholder_name: 'Medical Center Representative',
          role: 'Healthcare Provider',
          contact: 'medical@center.com'
        },
        {
          id: '2',
          stakeholder_name: 'Insurance Adjuster',
          role: 'Claims Adjuster',
          contact: 'adjuster@insurance.com'
        }
      ]);
    } else {
      // For real tasks, set empty stakeholders
      setStakeholders([]);
    }
  };

  const fetchAttachments = async () => {
    // Mock attachments for demo tasks
    if (taskId?.startsWith('CLM-')) {
      setAttachments([
        {
          id: '1',
          file_name: 'medical_report.pdf',
          file_size: 2048576,
          created_at: '2024-06-18T10:30:00Z',
          uploaded_by_profile: { full_name: 'John Doe' }
        },
        {
          id: '2',
          file_name: 'insurance_form.pdf',
          file_size: 1024000,
          created_at: '2024-06-19T14:15:00Z',
          uploaded_by_profile: { full_name: 'Sarah Agent' }
        },
        {
          id: '3',
          file_name: 'hospital_bills.pdf',
          file_size: 1536000,
          created_at: '2024-06-20T09:45:00Z',
          uploaded_by_profile: { full_name: 'Mike Johnson' }
        },
        {
          id: '4',
          file_name: 'prescription_documents.pdf',
          file_size: 512000,
          created_at: '2024-06-21T11:20:00Z',
          uploaded_by_profile: { full_name: 'Lisa Smith' }
        }
      ]);
    } else {
      // For real tasks, set empty attachments
      setAttachments([]);
    }
  };

     const fetchTrackingEvents = async () => {
       // Mock tracking events for demo tasks
       if (taskId?.startsWith('CLM-')) {
         setTrackingEvents([
           {
             id: '1',
             event_type: 'created',
             description: 'Task created and assigned',
             created_at: '2024-06-15T10:00:00Z',
             created_by_profile: { full_name: 'System' },
             location: 'Online Portal'
           },
           {
             id: '2',
             event_type: 'status_change',
             description: 'Status changed from New to Pending',
             created_at: '2024-06-16T14:30:00Z',
             created_by_profile: { full_name: 'Jane Reviewer' },
             location: 'Review Department'
           },
           {
             id: '3',
             event_type: 'comment',
             description: 'Initial review completed',
             created_at: '2024-06-18T10:30:00Z',
             created_by_profile: { full_name: 'John Reviewer' },
             location: 'Claims Office'
           }
         ]);
       } else {
         // For real tasks, set empty tracking events
         setTrackingEvents([]);
       }
     };

   const fetchPaymentStages = async () => {
     // For demo tasks, use mock payment data
     if (taskId?.startsWith('CLM-')) {
       setPaymentStages(mockPaymentStages);
     } else {
       // For real tasks, set empty payment stages
       setPaymentStages([]);
     }
   };

   const fetchCaseDetails = async () => {
     try {
       setCaseDetailsLoading(true);
       console.log('Fetching case details for task ID:', taskId);
       
       // Get session details for headers
       const sessionStr = localStorage.getItem('expertclaims_session');
       let sessionId = '';
       let jwtToken = '';

       if (sessionStr) {
         const session = JSON.parse(sessionStr);
         sessionId = session.sessionId || '';
         jwtToken = session.jwtToken || '';
       }

       // Check if we have valid session data
       if (!sessionId || !jwtToken) {
         console.error('Authentication failed - missing session data:', { sessionId, jwtToken });
         toast({
           title: "Authentication Error",
           description: "Please log in again to access case details",
           variant: "destructive",
         });
         return;
       }

       // Call the everything-cases API to get detailed case information
       const caseDetailsData = await CaseService.getCaseDetails(taskId!, sessionId, jwtToken);
       console.log('Case details received:', caseDetailsData);
       
       setCaseDetails(caseDetailsData);
       
       toast({
         title: "Success",
         description: `Case details fetched for task ${taskId}`,
       });
       
     } catch (error) {
       console.error('Error fetching case details:', error);
       toast({
         title: "Error",
         description: `Failed to fetch case details for task ${taskId}`,
         variant: "destructive",
       });
     } finally {
       setCaseDetailsLoading(false);
     }
   };

   const handlePaymentStatusUpdate = async (stageId: string) => {
     try {
       // For demo tasks, update mock data
       if (taskId?.startsWith('CLM-')) {
         setPaymentStages(prev => prev.map(stage => 
           stage.id === stageId 
             ? { ...stage, status: 'paid', paidDate: new Date().toISOString() }
             : stage
         ));
         
         toast({
           title: "Payment Updated",
           description: "Payment status has been updated to paid",
           variant: "default",
         });
         return;
       }

       // In a real implementation, update database
       toast({
         title: "Demo Mode",
         description: "Payment status updated in demo mode",
         variant: "default",
       });
     } catch (error) {
       console.error('Error updating payment status:', error);
       toast({
         title: "Error",
         description: "Failed to update payment status",
         variant: "destructive",
       });
     }
   };

  const handleSaveTask = async () => {
    // For demo tasks, just show success message
    if (taskId?.startsWith('CLM-')) {
      toast({
        title: "Demo Mode",
        description: "This is a demo task. Changes cannot be saved.",
        variant: "default",
      });
      setEditMode(false);
      return;
    }

    // For real tasks, show demo message
    toast({
      title: "Demo Mode",
      description: "Task saving is in demo mode. In production, this would save to database.",
      variant: "default",
    });
    
    setTaskData({...taskData, ...editedTask} as TaskData);
    setEditMode(false);
    setChangeReason('');
  };

  const handleAddComment = async () => {
    if (!newComment.text.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }

    setAddingComment(true);

    try {
      // For demo mode, create a mock comment
      const newMockComment = {
        id: (comments.length + 1).toString(),
        comment_text: newComment.text,
        created_at: new Date().toISOString(),
        created_by_profile: { full_name: 'Current User' }
      };
      
      // Add the new comment to the comments list
      setComments([...comments, newMockComment]);
      setNewComment({ text: '' });
      
      toast({
        title: "Demo Mode",
        description: "Comment added in demo mode",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingComment(false);
    }
  };

  const handleDocumentUpload = (documentName: string, file: File | null) => {
    setDocumentUploads(prev => ({
      ...prev,
      [documentName]: {
        file: file
      }
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

  const handleDrop = (e: React.DragEvent, documentName: string) => {
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

      handleDocumentUpload(documentName, file);
      toast({
        title: "File Added",
        description: `${file.name} has been added for ${documentName}`,
      });
    }
  };

  const handleAddStakeholder = async () => {
    if (!newStakeholder.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a stakeholder name",
        variant: "destructive",
      });
      return;
    }

    // For demo mode, create a mock stakeholder
    const newMockStakeholder = {
      id: (stakeholders.length + 1).toString(),
      stakeholder_name: newStakeholder.name,
      role: newStakeholder.role,
      contact: newStakeholder.contact,
      contact_email: newStakeholder.contact_email,
      notes: newStakeholder.notes
    };
    setStakeholders([...stakeholders, newMockStakeholder]);
    setNewStakeholder({ name: '', role: '', contact: '', contact_email: '', notes: '' });
    setShowAddStakeholder(false);
    toast({
      title: "Demo Mode",
      description: "Stakeholder added in demo mode",
    });
  };

  const handleDeleteStakeholder = async (stakeholderId: string) => {
    // For demo mode, just remove from local state
    setStakeholders(stakeholders.filter(s => s.id !== stakeholderId));
    toast({
      title: "Demo Mode",
      description: "Stakeholder removed in demo mode",
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For demo mode, create a mock attachment
    const newMockAttachment = {
      id: (attachments.length + 1).toString(),
      file_name: file.name,
      file_size: file.size,
      created_at: new Date().toISOString(),
      uploaded_by_profile: { full_name: 'Current User' }
    };
    setAttachments([...attachments, newMockAttachment]);
    toast({
      title: "Demo Mode",
      description: "File added in demo mode",
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    // For demo mode, just remove from local state
    setAttachments(attachments.filter(att => att.id !== attachmentId));
    toast({
      title: "Demo Mode",
      description: "File removed in demo mode",
    });
  };

  const handleViewFile = (attachment: any) => {
    setViewingFile(attachment);
    setShowFileViewer(true);
  };

  const viewDocument = async (documentId: number) => {
    try {
      setViewingDocumentId(documentId.toString());
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
      
      const response = await fetch('http://localhost:3000/support/view', {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYm5sdmdlY3pueXFlbHJ5amVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjc4NiwiZXhwIjoyMDcwNDgyNzg2fQ.EeSnf_51c6VYPoUphbHC_HU9eU47ybFjDAtYa8oBbws',
          'Content-Profile': 'expc',
          'Accept-Profile': 'expc',
          'session_id': sessionId,
          'jwt_token': jwtToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        console.error('Failed to call view webhook:', response.status, response.statusText);
        
        // Try to get error details for logging
        let userFriendlyMessage = "Unable to view document. Please try again.";
        try {
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          
          // Try to parse JSON error response
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error) {
              // Show user-friendly message based on error type
              if (errorData.error.includes("File not found") || errorData.error.includes("not found")) {
                userFriendlyMessage = "Document not found.";
              } else if (errorData.error.includes("Invalid session")) {
                userFriendlyMessage = "Session expired. Please log in again.";
              } else {
                userFriendlyMessage = "Unable to view document. Please try again.";
              }
            }
          } catch (parseError) {
            // If not JSON, use default message
            console.error('Error is not JSON format');
          }
        } catch (e) {
          console.error('Could not parse error response');
        }
        
        toast({
          title: "Error",
          description: userFriendlyMessage,
          variant: "destructive",
        });
        return;
      }

      // Since the API returns binary image data (as shown in Postman), handle it directly
      console.log('Response received, processing binary data...');
      
      try {
        // Get the response as a blob (binary data)
        const blob = await response.blob();
        console.log('Blob created, size:', blob.size, 'bytes');
        console.log('Blob type:', blob.type);
        
        // Create a URL for the blob
        const fileUrl = URL.createObjectURL(blob);
        console.log('Created blob URL:', fileUrl);
        
        // Determine file type based on blob type or try to detect from content
        const blobType = blob.type;
        console.log('Detected blob type:', blobType);
        
        // Set document URL and type for modal display
        setDocumentUrl(fileUrl);
        setDocumentType(blobType || 'unknown');
        setShowDocumentModal(true);
        
        toast({
          title: "Success",
          description: "Document opened successfully",
        });
        
        // Clean up the blob URL after some time to free memory
        setTimeout(() => {
          URL.revokeObjectURL(fileUrl);
          console.log('Blob URL cleaned up');
        }, 30000); // 30 seconds
        
      } catch (blobError) {
        console.error('Error creating blob from response:', blobError);
        
        // Fallback: try to get response as text first
        try {
          const textResponse = await response.text();
          console.log('Response as text (first 200 chars):', textResponse.substring(0, 200));
          
          // If it looks like a URL, try to open it
          if (textResponse.startsWith('http')) {
            console.log('Opening URL from response:', textResponse);
            setDocumentUrl(textResponse);
            setDocumentType('url');
            setShowDocumentModal(true);
          } else {
            throw new Error('Response is not a URL');
          }
        } catch (textError) {
          console.error('Error handling response as text:', textError);
          toast({
            title: "Error",
            description: "Failed to process document response",
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
    } finally {
      setViewingDocumentId(null);
    }
  };

  const getFileViewerContent = (file: any) => {
    const fileName = file.file_name || file.filename || 'Unknown file';
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    // For demo tasks, show mock content
    if (taskId?.startsWith('CLM-')) {
      if (fileExtension === 'pdf') {
        return (
          <div className="w-full h-full">
            <iframe
              src="/mock-document.pdf"
              className="w-full h-full border-0"
              title={fileName}
            />
          </div>
        );
      } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '')) {
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-16 w-16 text-gray-400" />
              </div>
              <p className="text-gray-600">Image preview not available in demo mode</p>
              <p className="text-sm text-gray-500">{fileName}</p>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-16 w-16 text-gray-400" />
              </div>
              <p className="text-gray-600">File preview not available</p>
              <p className="text-sm text-gray-500">{fileName}</p>
            </div>
          </div>
        );
      }
    }

    // For real files, show appropriate content
    if (fileExtension === 'pdf') {
      return (
        <div className="w-full h-full">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-16 w-16 text-gray-400" />
              </div>
              <p className="text-gray-600">PDF preview not available in demo mode</p>
              <p className="text-sm text-gray-500">{fileName}</p>
            </div>
          </div>
        </div>
      );
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '')) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-16 w-16 text-gray-400" />
            </div>
            <p className="text-gray-600">Image preview not available in demo mode</p>
            <p className="text-sm text-gray-500">{fileName}</p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
              <FileText className="h-16 w-16 text-gray-400" />
            </div>
            <p className="text-gray-500">Preview not available for this file type</p>
            <p className="text-sm text-gray-500">{fileName}</p>
          </div>
        </div>
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading task details...</div>
      </div>
    );
  }

  if (!taskData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Task not found</h2>
          <p className="text-gray-600 mb-4">The task you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
              <header className="bg-primary-500 shadow-sm border-b border-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 bg-white text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <h1 className="text-2xl font-bold text-white">Task Details</h1>
            </div>
            <div className="flex items-center space-x-2">
              {/* Edit functionality removed */}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Task Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardDescription>Task ID: {taskData?.task_id}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Basic Information Section */}
            {/* <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Case Type & Documents</h3>
              <div className="grid md:grid-cols-2 gap-4"> */}

                {/* <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="font-medium">
                    {taskData?.due_date ? new Date(taskData.due_date).toLocaleDateString() : 'Not set'}
                  </p>
                </div> */}
              {/* </div>
            </div> */}

            {/* Case Type & Document Selection Section */}
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold border-b pb-2">Case Type & Documents</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {/* <div>
                  <p className="text-sm text-gray-600">Case Type</p>
                  <p className="font-medium capitalize">
                    {taskData?.case_type ? taskData.case_type.replace('-', ' ') : 'Not set'}
                  </p>
                </div> */}
                
                {/* Show claim amount from caseDetails if available */}
                {caseDetails && ((caseDetails as any)['claim amount']) && (
                  <div>
                    <p className="text-sm text-gray-600">Claim Amount</p>
                    <p className="font-medium">
                      ₹{typeof (caseDetails as any)['claim amount'] === 'number' 
                        ? (caseDetails as any)['claim amount'].toLocaleString('en-IN')
                        : String((caseDetails as any)['claim amount'] || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    </p>
                  </div>
                )}
                
                {/* Show service amount from caseDetails if available */}
                {caseDetails && ((caseDetails as any)['service amount']) && (
                  <div>
                    <p className="text-sm text-gray-600">Service Amount</p>
                    <p className="font-medium">
                      ₹{typeof (caseDetails as any)['service amount'] === 'number' 
                        ? (caseDetails as any)['service amount'].toLocaleString('en-IN')
                        : String((caseDetails as any)['service amount'] || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    </p>
                  </div>
                )}
              </div>
              
              {taskData?.case_type && (
                <div>
                  <p className="text-sm text-gray-600">Required Documents</p>
                                    <div className="space-y-1">
                      {taskData?.selected_documents && taskData.selected_documents.length > 0 ? (
                        taskData.selected_documents.map((doc, index) => (
                          <Badge key={index} variant="secondary" className="mr-1 mb-1">
                            {doc}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-gray-500">No documents selected</p>
                      )}
                    </div>
                </div>
              )}
            </div>

            {/* Case Details from API */}
            {caseDetailsLoading && (
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-semibold border-b pb-2">Case Details</h3>
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading case details...</p>
                </div>
              </div>
            )}

            {caseDetails && !caseDetailsLoading && (
              <div className="space-y-4 mt-6">
                
                {/* Basic Case Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Case ID</p>
                    <p className="font-medium">{caseDetails.case_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Case Type</p>
                    <p className="font-medium">{caseDetails.case_types?.case_type_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Priority</p>
                    <Badge className={getStatusColor(caseDetails.priority)}>
                      {caseDetails.priority}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ticket Stage</p>
                    <Badge className={getStatusColor(caseDetails.ticket_stage)}>
                      {caseDetails.ticket_stage}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Assign Date</p>
                    <p className="font-medium">
                      {caseDetails.due_date ? new Date(caseDetails.due_date).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Claim Amount</p>
                    <p className="font-medium">
                      {(() => {
                        // Check multiple possible field names for claim amount (API uses "claim amount" with space)
                        const claimAmountRaw = (caseDetails as any)["claim amount"]
                          ?? caseDetails.claim_amount 
                          ?? (caseDetails as any).claims_amount 
                          ?? (caseDetails as any).claimAmount 
                          ?? (caseDetails as any).claimsAmount
                          ?? null;
                        
                        // Convert to number if it's a string, handle 0 as valid value
                        if (claimAmountRaw !== null && claimAmountRaw !== undefined && claimAmountRaw !== '') {
                          const claimAmount = typeof claimAmountRaw === 'string' ? parseFloat(claimAmountRaw) : Number(claimAmountRaw);
                          if (!isNaN(claimAmount)) {
                            console.log('Claim amount found:', claimAmount);
                            return `${claimAmount.toLocaleString()} ${caseDetails.value_currency || 'INR'}`;
                          }
                        }
                        console.log('Claim amount not found. Raw value:', claimAmountRaw, 'Available fields:', Object.keys(caseDetails || {}));
                        return 'Not set';
                      })()}
                    </p>
                  </div>
                  {/* <div>
                    <p className="text-sm text-gray-600">Assigned To</p>
                    <p className="font-medium">{caseDetails.assigned_to || 'N/A'}</p>
                  </div> */}
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium">
                      {caseDetails.updated_time ? new Date(caseDetails.updated_time).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Case Summary and Description */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Case Summary</p>
                    <p className="font-medium">{caseDetails.case_summary || 'No summary provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Case Description</p>
                    <p className="font-medium">{caseDetails.case_description || 'No description provided'}</p>
                  </div>
                </div>

                {/* Customer Information */}
                {caseDetails.customers && (
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold border-b pb-2">Customer Information</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Customer Name</p>
                        <p className="font-medium">{caseDetails.customers.first_name} {caseDetails.customers.last_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        {caseDetails.customers.email_address ? (
                          <a 
                            href={`mailto:${caseDetails.customers.email_address}`}
                            className="font-medium "
                          >
                            {caseDetails.customers.email_address}
                          </a>
                        ) : (
                          <p className="font-medium">N/A</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Mobile Number</p>
                        <p className="font-medium">{caseDetails.customers.mobile_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Emergency Contact</p>
                        <p className="font-medium">{caseDetails.customers.emergency_contact}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Customer Type</p>
                        <p className="font-medium">{caseDetails.customers.customer_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Source</p>
                        <p className="font-medium">{caseDetails.customers.source}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium">
                          {(() => {
                            const address = caseDetails.customers.address;
                            if (!address) return 'N/A';
                            
                            // If address is already a string, check if it's a JSON string
                            if (typeof address === 'string') {
                              // Try to parse if it looks like JSON
                              if (address.trim().startsWith('{') || address.trim().startsWith('[')) {
                                try {
                                  const parsed = JSON.parse(address);
                                  if (typeof parsed === 'object' && parsed !== null) {
                                    // Format the parsed object
                                    const parts = [
                                      parsed.street,
                                      parsed.city,
                                      parsed.state,
                                      parsed.zip || parsed.pincode
                                    ].filter(Boolean);
                                    return parts.length > 0 ? parts.join(', ') : address;
                                  }
                                } catch (e) {
                                  // If parsing fails, return the string as-is
                                  return address;
                                }
                              }
                              // Return string address as-is
                              return address;
                            }
                            
                            // If address is an object
                            if (typeof address === 'object' && address !== null) {
                              const parts = [
                                (address as any).street,
                                (address as any).city,
                                (address as any).state,
                                (address as any).zip || (address as any).pincode
                              ].filter(Boolean);
                              return parts.length > 0 ? parts.join(', ') : 'N/A';
                            }
                            
                            return 'N/A';
                          })()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">GSTIN</p>
                        <p className="font-medium">{(caseDetails.customers as any).gstin || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">PAN</p>
                        <p className="font-medium">{(caseDetails.customers as any).pan || (caseDetails.customers as any).pan_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">State</p>
                        <p className="font-medium">{(caseDetails.customers as any).state || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Pincode</p>
                        <p className="font-medium">{(caseDetails.customers as any).pincode || 'N/A'}</p>
                      </div>
                      {caseDetails.customers.notes && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600">Notes</p>
                          <p className="font-medium">{caseDetails.customers.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Case Comments */}
                {caseDetails.case_comments && caseDetails.case_comments.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold border-b pb-2">Case Comments ({caseDetails.case_comments.length})</h4>
                    <div className="space-y-3">
                      {caseDetails.case_comments.map((comment: any, index: number) => (
                        <div key={comment.comment_id} className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant={comment.is_internal ? "default" : "secondary"}>
                                {comment.is_internal ? "Internal" : "External"}
                              </Badge>
                              {/* <span className="text-sm text-gray-600">User ID: {comment.user_id}</span> */}
                              {/* {comment.parent_comment_id && (
                                <Badge variant="outline" className="text-xs">
                                  Reply to #{comment.parent_comment_id}
                                </Badge>
                              )} */}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_time).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-900">
                            {comment.comment_text || <em className="text-gray-500">No comment text provided</em>}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Case Data */}
                {/* {caseDetails.case_stakeholders && caseDetails.case_stakeholders.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Stakeholders ({caseDetails.case_stakeholders.length})</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {caseDetails.case_stakeholders.map((stakeholder: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                            {JSON.stringify(stakeholder, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* {caseDetails.case_documents && caseDetails.case_documents.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Documents ({caseDetails.case_documents.length})</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {caseDetails.case_documents.map((document: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                            {JSON.stringify(document, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {caseDetails.case_payment_phases && caseDetails.case_payment_phases.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Payment Phases ({caseDetails.case_payment_phases.length})</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {caseDetails.case_payment_phases.map((phase: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                            {JSON.stringify(phase, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {caseDetails.case_stage_history && caseDetails.case_stage_history.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Stage History ({caseDetails.case_stage_history.length})</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {caseDetails.case_stage_history.map((history: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                            {JSON.stringify(history, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )} */}
              </div>
            )}

            {/* Document Uploads Section */}
            {editMode && editedTask.selected_documents && editedTask.selected_documents.length > 0 && (
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-semibold border-b pb-2">Document Uploads</h3>
                {editedTask.selected_documents.map((documentName) => (
                  <div key={documentName} className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <h4 className="text-md font-semibold">{documentName}</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`upload-${documentName}`}>Upload {documentName}</Label>
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
                                onChange={(e) => handleDocumentUpload(documentName, e.target.files?.[0] || null)}
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
                  </div>
                ))}
              </div>
            )}

            {/* Assignment Section */}
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold border-b pb-2">Assignment & Review</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Assignee</p>
                  <p className="font-medium">
                    {caseDetails?.employees ? 
                      `${caseDetails.employees.first_name} ${caseDetails.employees.last_name}` : 
                      'Unassigned'
                    }
                  </p>
                </div>
                {/* <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <div className="space-y-1">
                    <p className="font-medium">{taskData?.customer_profile?.full_name || 'No customer assigned'}</p>
                    <p className="text-sm text-gray-500">{taskData?.customer_profile?.email || 'No email'}</p>
                    <p className="text-sm text-gray-500">{taskData?.customer_profile?.mobile || 'No phone'}</p>
                  </div>
                </div> */}
                {(editedTask.ticket_stage === 'review' || (!editMode && taskData?.ticket_stage === 'review')) && (
                  <div>
                    <p className="text-sm text-gray-600">Reviewer</p>
                    {editMode ? (
                      <Select value={editedTask.reviewer_id} onValueChange={(value) => setEditedTask({...editedTask, reviewer_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reviewer" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles.map(profile => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{taskData?.reviewer_profile?.full_name || 'No reviewer assigned'}</p>
                    )}
                  </div>
                )}
                {(editedTask.ticket_stage === 'approval' || (!editMode && taskData?.ticket_stage === 'approval')) && (
                  <div>
                    <p className="text-sm text-gray-600">Approver</p>
                    {editMode ? (
                      <Select value={editedTask.approver_id} onValueChange={(value) => setEditedTask({...editedTask, approver_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select approver" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles.map(profile => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{taskData?.approver_profile?.full_name || 'No approver assigned'}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Priority & Status Section */}
            <div className="space-y-4 mt-6">
              {/* <h3 className="text-lg font-semibold border-b pb-2">Priority & Status</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  {editMode ? (
                    <Select value={editedTask.priority} onValueChange={(value: TaskPriority) => setEditedTask({...editedTask, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium capitalize">{taskData?.priority}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stage</p>
                  {editMode ? (
                    <div className="space-y-2">
                      <Select value={editedTask.ticket_stage} onValueChange={(value: TicketStage) => setEditedTask({...editedTask, ticket_stage: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="analysis">Analysis</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="approval">Approval</SelectItem>
                          <SelectItem value="waiting">Waiting</SelectItem>
                        </SelectContent>
                      </Select>
                      {(editedTask.ticket_stage === 'review' || editedTask.ticket_stage === 'approval') && (
                        <div>
                          <Label htmlFor="changeReason" className="text-sm text-gray-600">Change Reason</Label>
                          <Textarea
                            id="changeReason"
                            value={changeReason}
                            onChange={(e) => setChangeReason(e.target.value)}
                            placeholder="Please provide a reason for this stage change..."
                            rows={3}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium capitalize">{taskData?.ticket_stage}</p>
                  )}
                </div>
                
              </div> */}
              
              
              {/* Resolution Summary - Only show when status is completed or cancelled */}
              {(editedTask.current_status === 'completed' || editedTask.current_status === 'cancelled' || 
                (!editMode && (taskData?.current_status === 'completed' || taskData?.current_status === 'cancelled'))) && (
                <div>
                  <p className="text-sm text-gray-600">Resolution Summary</p>
                  {editMode ? (
                    <Textarea
                      value={editedTask.resolution_summary || ''}
                      onChange={(e) => setEditedTask({...editedTask, resolution_summary: e.target.value})}
                      placeholder="Enter resolution summary"
                      rows={3}
                    />
                  ) : (
                    <p className="font-medium">
                      {taskData?.resolution_summary || 'No resolution summary provided'}
                    </p>
                  )}
                </div>
              )}

              {/* Customer Satisfaction Rating - Only show when status is completed or cancelled */}
              {(editedTask.current_status === 'completed' || editedTask.current_status === 'cancelled' || 
                (!editMode && (taskData?.current_status === 'completed' || taskData?.current_status === 'cancelled'))) && (
                <div>
                  <p className="text-sm text-gray-600">Customer Satisfaction Rating</p>
                  {editMode ? (
                    <div className="flex items-center space-x-4">
                      <Select 
                        value={editedTask.customer_satisfaction_rating?.toString() || ''} 
                        onValueChange={(value) => setEditedTask({...editedTask, customer_satisfaction_rating: value ? parseInt(value) : null})}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Poor</SelectItem>
                          <SelectItem value="2">2 - Fair</SelectItem>
                          <SelectItem value="3">3 - Good</SelectItem>
                          <SelectItem value="4">4 - Very Good</SelectItem>
                          <SelectItem value="5">5 - Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                      {editedTask.customer_satisfaction_rating && (
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={`text-lg ${star <= editedTask.customer_satisfaction_rating! ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">
                        {taskData?.customer_satisfaction_rating ? `${taskData.customer_satisfaction_rating}/5` : 'Not rated'}
                      </p>
                      {taskData?.customer_satisfaction_rating && (
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={`text-lg ${star <= taskData.customer_satisfaction_rating! ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Task Summary and Description */}
        <div className="grid md:grid-cols-1 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {caseDetails?.case_summary || 'No summary provided'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Description</CardTitle>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <Textarea
                  value={editedTask.case_description || ''}
                  onChange={(e) => setEditedTask({...editedTask, case_description: e.target.value})}
                  placeholder="Task description"
                  rows={6}
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  {caseDetails?.case_description || 'No description provided'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Comments Section removed */}

                 {/* Tabs for additional information */}
         <Tabs defaultValue="stakeholders" className="space-y-4">
           <TabsList className="grid w-full grid-cols-4">
             <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
             <TabsTrigger value="attachments">Attachments</TabsTrigger>
             <TabsTrigger value="tracking">Task Tracking</TabsTrigger>
             <TabsTrigger value="payments">Payments</TabsTrigger>
           </TabsList>

          <TabsContent value="stakeholders">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Stakeholder Details</CardTitle>
                  {/* Add Stakeholder functionality removed */}
                </div>
              </CardHeader>
              <CardContent>
                {/* Show Case Stakeholders from API */}
                {caseDetails && caseDetails.case_stakeholders && caseDetails.case_stakeholders.length > 0 ? (
                  <div className="space-y-4">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Case Stakeholders ({caseDetails.case_stakeholders.length})
                      </h4>
                    </div>
                    {caseDetails.case_stakeholders.map((stakeholder: any, index: number) => (
                      <div key={stakeholder.stakeholder_id || index} className="p-4 border rounded-lg bg-gray-50">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 text-lg">
                              {stakeholder.stakeholder_name}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              ID: {stakeholder.stakeholder_id}
                            </Badge>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Role</p>
                              <p className="font-medium">{stakeholder.role}</p>
                            </div>
                            {stakeholder.contact_email && (
                              <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-medium text-blue-600">{stakeholder.contact_email}</p>
                              </div>
                            )}
                            {stakeholder.contact_phone && (
                              <div>
                                <p className="text-sm text-gray-600">Phone</p>
                                <p className="font-medium">{stakeholder.contact_phone}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-sm text-gray-600">Case ID</p>
                              <p className="font-medium">{stakeholder.case_id}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Created</p>
                              <p className="font-medium text-sm">
                                {new Date(stakeholder.created_time).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          {stakeholder.notes && (
                            <div>
                              <p className="text-sm text-gray-600">Notes</p>
                              <p className="font-medium bg-white p-3 rounded border">
                                {stakeholder.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No case stakeholders found.</p>
                    {caseDetailsLoading && (
                      <div className="mt-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                        <p className="text-gray-500 mt-2 text-sm">Loading stakeholders...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Show Mock Stakeholders for Demo Tasks */}
                {taskId?.startsWith('CLM-') && stakeholders.length > 0 && (
                  <div className="space-y-4 mt-8">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Demo Stakeholders ({stakeholders.length})
                      </h4>
                      <p className="text-sm text-gray-500">Mock data for demonstration</p>
                    </div>
                    {stakeholders.map((stakeholder) => (
                      <div key={stakeholder.id} className="flex justify-between items-start p-4 border rounded-lg bg-blue-50">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {stakeholder.stakeholder_name || stakeholder.stakeholder_profile?.full_name || 'Unknown'}
                          </h4>
                          {stakeholder.role && (
                            <p className="text-sm text-gray-600">{stakeholder.role}</p>
                          )}
                          {stakeholder.contact && (
                            <p className="text-sm text-blue-600">{stakeholder.contact}</p>
                          )}
                          {stakeholder.contact_email && (
                            <p className="text-sm text-blue-600">{stakeholder.contact_email}</p>
                          )}
                          {stakeholder.notes && (
                            <p className="text-sm text-gray-500 mt-1">{stakeholder.notes}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">Demo</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attachments">
            <Card className="border-none shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary-500" />
                  <span>Documents Submitted</span>
                </CardTitle>
                <CardDescription>Documents provided for this case</CardDescription>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading documents...</p>
                  </div>
                ) : documents && documents.length > 0 ? (
                  <div className="space-y-4">
                    {documents.filter((doc) => doc.document_id != 5).map((doc, index) => (
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
                            disabled={viewingDocumentId === doc.document_id?.toString()}
                          >
                            {viewingDocumentId === doc.document_id?.toString() ? (
                              <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                                <span>Loading...</span>
                              </div>
                            ) : (
                              'View'
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No documents have been submitted yet for this case.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking">
            <Card>
              <CardHeader>
                <CardTitle>Task Tracking</CardTitle>
                <CardDescription>Timeline of task progress and status changes</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Show API Stage History */}
                {caseDetails && caseDetails.case_stage_history && caseDetails.case_stage_history.length > 0 ? (
                  <div className="space-y-6">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Stage History ({caseDetails.case_stage_history.length})
                      </h4>
                      <p className="text-sm text-gray-500">Real data from API</p>
                    </div>
                    {caseDetails.case_stage_history.map((history: any, index: number) => (
                      <div key={history.stage_history_id || index} className="relative">
                        {index !== caseDetails.case_stage_history.length - 1 && (
                          <div className="absolute left-4 top-8 h-full w-0.5 bg-gray-200"></div>
                        )}
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">
                                Stage Change: {history.previous_stage} → {history.new_stage}
                              </h4>
                              <span className="text-sm text-gray-500">
                                {new Date(history.created_time).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-700 mt-1">{history.changed_reason || 'No reason provided'}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>Changed by User ID: {history.changed_by}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  History ID: {history.stage_history_id}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Previous Stage</p>
                                  <p className="font-medium">{history.previous_stage}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">New Stage</p>
                                  <p className="font-medium text-blue-600">{history.new_stage}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Changed By</p>
                                  <p className="font-medium">User {history.changed_by}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Changed To</p>
                                  <p className="font-medium">User {history.changed_to}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : caseDetailsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading stage history...</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No stage history found for this case.</p>
                    {caseDetails && (
                      <p className="text-sm text-gray-500 mt-2">Case ID: {caseDetails.case_id}</p>
                    )}
                  </div>
                )}

                {/* Show Mock Tracking Events for Demo Tasks */}
                {taskId?.startsWith('CLM-') && trackingEvents.length > 0 && (
                  <div className="space-y-6 mt-8">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Demo Tracking Events ({trackingEvents.length})
                      </h4>
                      <p className="text-sm text-gray-500">Mock data for demonstration</p>
                    </div>
                    {trackingEvents.map((event: any, index: number) => (
                      <div key={event.id} className="relative">
                        {index !== trackingEvents.length - 1 && (
                          <div className="absolute left-4 top-8 h-full w-0.5 bg-gray-200"></div>
                        )}
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 capitalize">
                                {event.event_type.replace('_', ' ')}
                              </h4>
                              <span className="text-sm text-gray-500">
                                {new Date(event.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-700 mt-1">{event.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{event.created_by_profile?.full_name}</span>
                              </div>
                              {event.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              <Badge variant="secondary" className="text-xs">Demo</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

              <TabsContent value="payments">
             <Card>
               <CardHeader>
                 <CardTitle>Payment Stages</CardTitle>
                 <CardDescription>Track payment status for each stage of your claim</CardDescription>
               </CardHeader>
               <CardContent>
                 {/* Show API Payment Phases */}
                 {caseDetails && caseDetails.case_payment_phases && caseDetails.case_payment_phases.length > 0 ? (
                   <div className="space-y-4">
                     <div className="mb-4">
                       <h4 className="text-lg font-semibold text-gray-900">
                         Payment Phases ({caseDetails.case_payment_phases.length})
                       </h4>
                       <p className="text-sm text-gray-500">Real data from API</p>
                     </div>
                     {caseDetails.case_payment_phases.map((phase: any, index: number) => (
                       <div key={phase.case_phase_id || index} className="border rounded-lg p-4 bg-gray-50">
                         <div className="flex justify-between items-start mb-3">
                           <div className="flex-1">
                             <h4 className="font-semibold text-gray-900">{phase.phase_name}</h4>
                             {/* <p className="text-sm text-gray-600 mt-1">{phase.notes || 'No description provided'}</p> */}
                             <div className="flex items-center space-x-4 mt-2">
                               <span className="text-lg font-bold text-blue-600">
                                 ₹{phase.phase_amount?.toLocaleString('en-IN') || '0'}
                               </span>
                               <Badge 
                                 variant={phase.status === 'paid' ? 'default' : 'secondary'}
                                 className={phase.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                               >
                                 {phase.status === 'paid' ? 'Paid' : 'Pending'}
                               </Badge>
                             </div>
                             
                             <div className="mt-2 space-y-1">
                               {phase.due_date && (
                                 <p className="text-xs text-gray-600">
                                   Due Date: {new Date(phase.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                 </p>
                               )}
                               {phase.payment_date && (
                                 <p className="text-xs text-green-600 font-medium">
                                   Payment Date: {new Date(phase.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                 </p>
                               )}
                             {phase.status === 'pending' && phase.due_date && (
                                 <p className="text-xs text-red-500">
                                   Due by: {new Date(phase.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                               </p>
                             )}
                             </div>
                             <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                               <Label className="text-sm font-medium text-gray-700">Invoice Number</Label>
                               <p className="text-sm mt-1 font-semibold text-gray-900">
                                 {phase.invoice_number && 
                                  phase.invoice_number !== 'N/A' && 
                                  phase.invoice_number !== null &&
                                  String(phase.invoice_number).trim() !== '' 
                                    ? phase.invoice_number 
                                    : 'Not Generated'}
                               </p>
                             </div>
                           </div>
                         </div>
                       </div>
                     ))}
                     
                     {/* Payment Summary */}
                     <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                       <h4 className="font-semibold text-gray-900 mb-3">Payment Summary</h4>
                       <div className="grid grid-cols-2 gap-4">
                         <div className="text-center">
                           <p className="text-sm text-gray-600">Total Claim Amount</p>
                           <p className="text-2xl font-bold text-gray-900">
                             ₹{caseDetails.case_payment_phases.reduce((sum: number, phase: any) => sum + (phase.phase_amount || 0), 0).toLocaleString('en-IN')}
                           </p>
                         </div>
                         <div className="text-center">
                           <p className="text-sm text-gray-600">Pending Amount</p>
                           <p className="text-2xl font-bold text-red-600">
                             ₹{caseDetails.case_payment_phases
                               .filter((phase: any) => phase.status === 'pending')
                               .reduce((sum: number, phase: any) => sum + (phase.phase_amount || 0), 0)
                               .toLocaleString('en-IN')}
                           </p>
                         </div>
                       </div>
                       <div className="mt-3 text-center">
                         <p className="text-sm text-gray-600">
                           Paid Amount: ₹{caseDetails.case_payment_phases
                             .filter((phase: any) => phase.status === 'paid')
                             .reduce((sum: number, phase: any) => sum + (phase.paid_amount || 0), 0)
                             .toLocaleString('en-IN')}
                         </p>
                       </div>
                     </div>
                   </div>
                 ) : caseDetailsLoading ? (
                   <div className="text-center py-8">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                     <p className="text-gray-600 mt-2">Loading payment phases...</p>
                   </div>
                 ) : (
                   <div className="text-center py-8">
                     <p className="text-gray-600">No payment phases found for this case.</p>
                     {caseDetails && (
                       <p className="text-sm text-gray-500 mt-2">Case ID: {caseDetails.case_id}</p>
                     )}
                   </div>
                 )}

                 {/* Show Mock Payment Stages for Demo Tasks */}
                 {taskId?.startsWith('CLM-') && paymentStages.length > 0 && (
                   <div className="space-y-4 mt-8">
                     <div className="mb-4">
                       <h4 className="text-lg font-semibold text-gray-900">
                         Demo Payment Stages ({paymentStages.length})
                       </h4>
                       <p className="text-sm text-gray-500">Mock data for demonstration</p>
                     </div>
                     {paymentStages.map((stage) => (
                       <div key={stage.id} className="border rounded-lg p-4 bg-blue-50">
                         <div className="flex justify-between items-start mb-3">
                           <div className="flex-1">
                             <h4 className="font-semibold text-gray-900">{stage.stage}</h4>
                             <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
                             <div className="flex items-center space-x-4 mt-2">
                               <span className="text-lg font-bold text-blue-600">₹{stage.amount.toLocaleString('en-IN')}</span>
                               <Badge 
                                 variant={stage.status === 'paid' ? 'default' : 'secondary'}
                                 className={stage.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                               >
                                 {stage.status === 'paid' ? 'Paid' : 'Pending'}
                               </Badge>
                               <Badge variant="secondary" className="text-xs">Demo</Badge>
                             </div>
                             {stage.status === 'paid' && stage.paidDate && (
                               <p className="text-xs text-gray-500 mt-1">
                                 Paid on: {new Date(stage.paidDate).toLocaleDateString()}
                               </p>
                             )}
                             {stage.status === 'pending' && stage.dueDate && (
                               <p className="text-xs text-red-500 mt-1">
                                 Due by: {new Date(stage.dueDate).toLocaleDateString()}
                               </p>
                             )}
                           </div>
                           {stage.status === 'pending' && (
                             <Button
                               size="sm"
                               onClick={() => handlePaymentStatusUpdate(stage.id)}
                               className="bg-green-600 hover:bg-green-700"
                             >
                               Mark as Paid
                             </Button>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
        </Tabs>
      </div>

      {/* File Viewer Dialog */}
      <Dialog open={showFileViewer} onOpenChange={setShowFileViewer}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{viewingFile?.file_name || viewingFile?.filename || 'File Viewer'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileViewer(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full min-h-0">
            {viewingFile && getFileViewerContent(viewingFile)}
          </div>
        </DialogContent>
      </Dialog>

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
              {documentType.includes('image/') ? (
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

export default TaskDetail;

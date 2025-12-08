
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import EditRegister from "./pages/EditRegister";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import TaskDetail from "./pages/TaskDetail";
import AdminDashboard from "./pages/AdminDashboard";
import CustomerPortal from "./pages/CustomerPortal";
import NewTask from "./pages/NewTask";
import EditTask from "./pages/EditTask";
import PartnerNewTask from "./pages/PartnerNewTask";
import NotFound from "./pages/NotFound";
import TaskManagement from "./pages/TaskManagement";
import PayslipsCompensation from "./pages/PayslipsCompensation";
import LeaveManagement from "./pages/LeaveManagement";
import Unauthorized from "./pages/Unauthorized";
import RoleTest from "./components/RoleTest";
import EmployeePersonalInfo from "./pages/EmployeePersonalInfo";
import PartnerDashboard from "./pages/PartnerDashboard";
import PartnerClaimDetail from "./pages/PartnerClaimDetail";
import PartnerPersonalInfo from "./pages/PartnerPersonalInfo";
import PartnerBacklogDetail from "./pages/PartnerBacklogDetail";
import PartnerBacklogEdit from "./pages/PartnerBacklogEdit";
import PartnerSignup from "./pages/PartnerSignup";
import EmployeeBacklogDetail from "./pages/EmployeeBacklogDetail";
import EmployeeBacklogEdit from "./pages/EmployeeBacklogEdit";
import EmployeeBacklogView from "./pages/EmployeeBacklogView";
import AdminBacklogDetail from "./pages/AdminBacklogDetail";
import AdminBacklogView from "./pages/AdminBacklogView";
import CustomerClaimDetail from "./pages/CustomerClaimDetail";
import CustomerFAQ from "./pages/CustomerFAQ";
import CustomerDocumentUpload from "./pages/CustomerDocumentUpload";
import InvoicePreview from "./pages/InvoicePreview";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registeraspartner" element={<PartnerSignup />} />
            <Route 
              path="/register" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <Register />
                </ProtectedRoute>
              } 
            />
            <Route path="/edit-register/:userId" element={<EditRegister />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/test-roles" element={<RoleTest />} />
            <Route 
              path="/employee-dashboard" 
              element={
                <ProtectedRoute requiredRole={["employee", "hr"]}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employee-backlog-detail/:backlogId" 
              element={
                <ProtectedRoute requiredRole={["employee", "hr"]}>
                  <EmployeeBacklogDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee-backlog-edit/:backlogId"
              element={
                <ProtectedRoute requiredRole={["employee", "hr"]}>
                  <EmployeeBacklogEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee-backlog-view/:backlogId"
              element={
                <ProtectedRoute requiredRole={["employee", "hr"]}>
                  <EmployeeBacklogView />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin-backlog-detail/:backlogId" 
              element={
                <ProtectedRoute requiredRole={["admin"]}>
                  <AdminBacklogDetail />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin-backlog-view/:backlogId" 
              element={
                <ProtectedRoute requiredRole={["admin"]}>
                  <AdminBacklogView />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/partner-dashboard" 
              element={
                <ProtectedRoute requiredRole="partner">
                  <PartnerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/partner-claim/:case_id" 
              element={
                <ProtectedRoute requiredRole="partner">
                  <PartnerClaimDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/partner-personal-info" 
              element={
                <ProtectedRoute requiredRole="partner">
                  <PartnerPersonalInfo />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/partner-backlog-detail/:backlogId" 
              element={
                <ProtectedRoute requiredRole="partner">
                  <PartnerBacklogDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/partner-backlog-edit/:backlogId" 
              element={
                <ProtectedRoute requiredRole="partner">
                  <PartnerBacklogEdit />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/task/:taskId" 
              element={
                <ProtectedRoute requiredRole={["employee", "hr", "admin"]}>
                  <TaskDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer-portal" 
              element={
                <ProtectedRoute requiredRole="customer">
                  <CustomerPortal />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer-claim/:case_id" 
              element={
                <ProtectedRoute requiredRole="customer">
                  <CustomerClaimDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer-faq" 
              element={
                <ProtectedRoute requiredRole="customer">
                  <CustomerFAQ />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer-upload" 
              element={
                <ProtectedRoute requiredRole="customer">
                  <CustomerDocumentUpload />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/new-task" 
              element={
                <ProtectedRoute requiredRole={["employee", "hr", "admin"]}>
                  <NewTask />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/partner-new-task" 
              element={
                <ProtectedRoute requiredRole={["partner"]}>
                  <PartnerNewTask />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/edit-task/:taskId" 
              element={
                <ProtectedRoute requiredRole={["employee", "hr", "admin"]}>
                  <EditTask />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/task-management" 
              element={
                <ProtectedRoute requiredRole={["employee", "hr", "admin"]}>
                  <TaskManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payslips-compensation" 
              element={
                <ProtectedRoute requiredRole={["employee", "hr", "admin"]}>
                  <PayslipsCompensation />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leave-management" 
              element={
                <ProtectedRoute requiredRole={["employee", "hr", "admin"]}>
                  <LeaveManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employee-personal-info" 
              element={
                <ProtectedRoute requiredRole={["employee", "hr"]}>
                  <EmployeePersonalInfo />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/invoice-preview" 
              element={
                <ProtectedRoute requiredRole={["employee", "hr", "admin"]}>
                  <InvoicePreview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/claim/:claimId" 
              element={
                <ProtectedRoute requiredRole={["employee", "hr", "admin"]}>
                  <TaskDetail />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

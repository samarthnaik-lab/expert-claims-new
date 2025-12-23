
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft, Calendar, User, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDateDDMMYYYY } from '@/lib/utils';

const TaskManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';
  const [searchTerm, setSearchTerm] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name),
          customer_profile:profiles!tasks_customer_id_fkey(full_name),
          reviewer_profile:profiles!tasks_reviewer_id_fkey(full_name),
          approver_profile:profiles!tasks_approver_id_fkey(full_name),
          category:task_categories(name, description)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('current_status', statusFilter as any);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }

      console.log('Fetched tasks:', data);
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'review': return 'bg-orange-100 text-orange-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'approval': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'review': return <FileText className="h-4 w-4" />;
      case 'in_progress': return <FileText className="h-4 w-4" />;
      case 'approval': return <User className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.customer_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.task_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.current_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const taskStats = {
    all: tasks.length,
    new: tasks.filter(t => t.current_status === 'new').length,
    pending: tasks.filter(t => t.current_status === 'pending').length,
    review: tasks.filter(t => t.current_status === 'review').length,
    in_progress: tasks.filter(t => t.current_status === 'in_progress').length,
    approval: tasks.filter(t => t.current_status === 'approval').length,
    completed: tasks.filter(t => t.current_status === 'completed').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

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
                  Task Management
                </h1>
                <p className="text-sm text-white/80 font-medium">
                  {statusFilter !== 'all' ? `Showing ${statusFilter} tasks` : 'All tasks'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-8">
          {Object.entries(taskStats).map(([status, count]) => (
            <Card 
              key={status}
              className={`border-none shadow-xl card-hover cursor-pointer transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 ${
                statusFilter === status ? 'ring-2 ring-blue-300 ring-offset-2' : ''
              }`}
              onClick={() => navigate(`/task-management?status=${status}`)}
            >
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="text-white">
                    {getStatusIcon(status)}
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{count}</div>
                <div className="text-xs font-medium text-blue-100 capitalize">{status}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filter */}
        <Card className="border-none shadow-xl bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Tasks</CardTitle>
                <CardDescription className="text-gray-600">
                  Manage and track all tasks ({filteredTasks.length} total)
                </CardDescription>
              </div>
              <Button 
                onClick={() => navigate('/new-task')}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
              >
                Create New Task
              </Button>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  placeholder="Search by name, customer, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 max-w-sm border-2 border-gray-200 rounded-xl focus:border-primary-500 transition-all duration-300"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-600 mb-4">
                  {tasks.length === 0 
                    ? "No tasks have been created yet." 
                    : "No tasks match your current search criteria."
                  }
                </p>
                <Button 
                  onClick={() => navigate('/new-task')}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
                >
                  Create Your First Task
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      <th className="text-left p-4 font-semibold text-white">Task Name</th>
                      <th className="text-left p-4 font-semibold text-white">ID</th>
                      <th className="text-left p-4 font-semibold text-white">Customer</th>
                      <th className="text-left p-4 font-semibold text-white">Assigned To</th>
                      <th className="text-left p-4 font-semibold text-white">Status</th>
                      <th className="text-left p-4 font-semibold text-white">Priority</th>
                      <th className="text-left p-4 font-semibold text-white">Est. Duration</th>
                      <th className="text-left p-4 font-semibold text-white">Total Hours Spent</th>
                      <th className="text-left p-4 font-semibold text-white">Customer Rating</th>
                      <th className="text-left p-4 font-semibold text-white">Assign Date</th>
                      <th className="text-left p-4 font-semibold text-white">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task, index) => (
                      <tr 
                        key={task.id} 
                        className={`border-b border-gray-100 transition-all duration-300 ${
                          index % 2 === 0 
                            ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/50 hover:from-blue-100/70 hover:to-indigo-100/70' 
                            : 'bg-gradient-to-r from-purple-50/50 to-pink-50/50 hover:from-purple-100/70 hover:to-pink-100/70'
                        }`}
                      >
                        <td className="p-4 font-medium text-gray-900">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>{task.title}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-sm text-blue-600 font-semibold">{task.task_id}</td>
                        <td className="p-4 text-gray-700">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {task.customer_profile?.full_name?.charAt(0) || 'N'}
                            </div>
                            <span>{task.customer_profile?.full_name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-700">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {task.assigned_to_profile?.full_name?.charAt(0) || 'U'}
                            </div>
                            <span>{task.assigned_to_profile?.full_name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={`${getStatusColor(task.current_status)} px-3 py-1 rounded-full font-medium shadow-sm`}>
                            {task.current_status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge 
                            className={`capitalize px-3 py-1 rounded-full font-medium ${
                              task.priority === 'high' 
                                ? 'bg-red-100 text-red-800 border border-red-200' 
                                : task.priority === 'medium' 
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                                : 'bg-green-100 text-green-800 border border-green-200'
                            }`}
                          >
                            {task.priority}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="text-gray-700 font-medium">
                              {task.estimated_efforts ? `${task.estimated_efforts}h` : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-700 font-medium">
                              {task.time_tracked ? `${task.time_tracked}h` : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm">
                          {task.customer_satisfaction_rating ? (
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <div
                                    key={star}
                                    className={`w-3 h-3 rounded-full ${
                                      star <= task.customer_satisfaction_rating 
                                        ? 'bg-yellow-400' 
                                        : 'bg-gray-300'
                                    }`}
                                  ></div>
                                ))}
                              </div>
                              <span className="text-gray-700 font-medium">
                                {task.customer_satisfaction_rating}/5
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="p-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-purple-500" />
                            <span className="text-gray-700 font-medium">
                              {task.due_date ? formatDateDDMMYYYY(task.due_date) : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Button 
                            size="sm" 
                            onClick={() => navigate(`/task/${task.id}`)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-none shadow-md hover:shadow-lg transition-all duration-300"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskManagement;

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthenticatedApi } from '@/services/authenticatedApi';
import { toast } from '@/hooks/use-toast';

const RoleTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [responseData, setResponseData] = useState<any>(null);
  const { getRoles } = useAuthenticatedApi();

  const testWebhook = async () => {
    setIsLoading(true);
    try {
      const response = await getRoles();
      setResponseData(response);
      
      if (response.success && response.data) {
        setRoles(response.data);
        toast({
          title: "Success",
          description: `Retrieved ${response.data.length} roles from n8n webhook`,
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch roles",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: "Error",
        description: "Failed to test webhook",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>n8n Webhook Role Test</CardTitle>
          <CardDescription>
            Test the n8n webhook integration for fetching user roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            onClick={testWebhook} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing Webhook...' : 'Test n8n Webhook'}
          </Button>

          {responseData && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Response Status</h3>
                <div className="bg-gray-100 p-3 rounded">
                  <p><strong>Success:</strong> {responseData.success ? 'Yes' : 'No'}</p>
                  <p><strong>Message:</strong> {responseData.message || 'No message'}</p>
                  <p><strong>Roles Count:</strong> {roles.length}</p>
                </div>
              </div>

              {roles.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Retrieved Roles</h3>
                  <div className="grid gap-3">
                    {roles.map((role, index) => (
                      <div key={role.id || index} className="bg-blue-50 p-3 rounded border">
                        <p><strong>ID:</strong> {role.id}</p>
                        <p><strong>Name:</strong> {role.name}</p>
                        <p><strong>Display Name:</strong> {role.display_name}</p>
                        <p><strong>Description:</strong> {role.description || 'No description'}</p>
                        <p><strong>Active:</strong> {role.is_active ? 'Yes' : 'No'}</p>
                        {role.permissions && (
                          <p><strong>Permissions:</strong> {role.permissions.join(', ')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-2">Raw Response</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(responseData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleTest;



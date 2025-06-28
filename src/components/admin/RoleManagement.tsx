
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Shield, BookOpen } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  user_roles: Array<{
    role: 'student' | 'instructor' | 'admin';
  }>;
}

const RoleManagement = () => {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasPermission('manage_users')) {
      fetchUsers();
    }
  }, [hasPermission]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        user_roles(role)
      `);

    if (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const updateUserRole = async (userId: string, newRole: 'student' | 'instructor' | 'admin') => {
    // First, remove existing roles
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Then add the new role
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: newRole });

    if (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'User role updated successfully'
      });
      fetchUsers();
    }
  };

  if (!hasPermission('manage_users')) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">You don't have permission to manage users.</p>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'instructor':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'instructor':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Role Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">{user.full_name || user.email}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      {user.user_roles.map((roleData, index) => (
                        <Badge key={index} className={`flex items-center gap-1 ${getRoleColor(roleData.role)}`}>
                          {getRoleIcon(roleData.role)}
                          {roleData.role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Select
                    value={user.user_roles[0]?.role || 'student'}
                    onValueChange={(newRole: 'student' | 'instructor' | 'admin') => 
                      updateUserRole(user.id, newRole)
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagement;

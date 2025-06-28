
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type Permission = 
  | 'manage_users'
  | 'manage_platform_settings'
  | 'view_all_analytics'
  | 'manage_subscriptions'
  | 'moderate_content'
  | 'create_courses'
  | 'manage_own_courses'
  | 'view_student_progress'
  | 'grade_assignments'
  | 'issue_certificates'
  | 'manage_discussions'
  | 'view_own_revenue'
  | 'customize_landing_pages'
  | 'enroll_courses'
  | 'access_content'
  | 'submit_assignments'
  | 'download_certificates'
  | 'participate_discussions'
  | 'rate_courses';

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    fetchUserPermissions();
  }, [user]);

  const fetchUserPermissions = async () => {
    if (!user) return;

    try {
      // First get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        return;
      }

      if (!userRoles || userRoles.length === 0) {
        setPermissions([]);
        return;
      }

      // Then get permissions for those roles
      const roles = userRoles.map(ur => ur.role);
      const { data: rolePermissions, error: permissionsError } = await supabase
        .from('role_permissions')
        .select('permission')
        .in('role', roles);

      if (permissionsError) {
        console.error('Error fetching permissions:', permissionsError);
        return;
      }

      const userPermissions = rolePermissions?.map(rp => rp.permission as Permission) || [];
      setPermissions(userPermissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every(permission => permissions.includes(permission));
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};


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
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          role,
          role_permissions!inner(permission)
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching permissions:', error);
        return;
      }

      const userPermissions = data?.flatMap(roleData => 
        roleData.role_permissions.map(rp => rp.permission as Permission)
      ) || [];

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

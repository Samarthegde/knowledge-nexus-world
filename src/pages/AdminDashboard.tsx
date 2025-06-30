
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import RoleManagement from '@/components/admin/RoleManagement';
import SiteCustomization from '@/components/admin/SiteCustomization';
import PageManager from '@/components/admin/PageManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, BookOpen, BarChart3, Settings, Palette, FileText } from 'lucide-react';

const AdminDashboard = () => {
  const { hasPermission } = usePermissions();

  if (!hasPermission('manage_users') && !hasPermission('manage_platform_settings')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your learning platform</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            {hasPermission('manage_users') && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            )}
            {hasPermission('view_all_analytics') && (
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            )}
            {hasPermission('manage_subscriptions') && (
              <TabsTrigger value="courses" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Courses
              </TabsTrigger>
            )}
            {hasPermission('manage_platform_settings') && (
              <TabsTrigger value="customization" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Customize
              </TabsTrigger>
            )}
            {hasPermission('manage_platform_settings') && (
              <TabsTrigger value="pages" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Pages
              </TabsTrigger>
            )}
            {hasPermission('manage_platform_settings') && (
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            )}
          </TabsList>

          {hasPermission('manage_users') && (
            <TabsContent value="users" className="space-y-6">
              <RoleManagement />
            </TabsContent>
          )}

          {hasPermission('view_all_analytics') && (
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Analytics dashboard coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {hasPermission('manage_subscriptions') && (
            <TabsContent value="courses" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Course management tools coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {hasPermission('manage_platform_settings') && (
            <TabsContent value="customization" className="space-y-6">
              <SiteCustomization />
            </TabsContent>
          )}

          {hasPermission('manage_platform_settings') && (
            <TabsContent value="pages" className="space-y-6">
              <PageManager />
            </TabsContent>
          )}

          {hasPermission('manage_platform_settings') && (
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Platform configuration coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;

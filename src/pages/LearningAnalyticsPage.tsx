import React from 'react';
import LearningAnalyticsDashboard from '@/components/analytics/LearningAnalyticsDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

const LearningAnalyticsPage = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to access learning analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasPermission('view_all_analytics') && !hasPermission('view_student_progress')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view learning analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <LearningAnalyticsDashboard />
      </div>
    </div>
  );
};

export default LearningAnalyticsPage;
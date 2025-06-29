import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock, 
  ThumbsUp,
  Brain,
  Target
} from 'lucide-react';

interface AIAnalyticsData {
  totalConversations: number;
  uniqueUsers: number;
  averageResponseTime: number;
  averageRating: number;
  positiveRating: number;
  dailyUsage: Array<{
    date: string;
    conversations: number;
    users: number;
  }>;
}

const AIAnalyticsDashboard = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AIAnalyticsData>({
    totalConversations: 0,
    uniqueUsers: 0,
    averageResponseTime: 0,
    averageRating: 0,
    positiveRating: 0,
    dailyUsage: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [user]);

  const fetchAnalyticsData = async () => {
    if (!user) return;

    try {
      // Fetch AI assistant analytics
      const { data: analytics, error } = await supabase
        .from('ai_assistant_analytics')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;

      // Calculate aggregated metrics
      const totalConversations = analytics?.reduce((sum, day) => sum + day.total_conversations, 0) || 0;
      const uniqueUsers = new Set(analytics?.map(day => day.unique_users) || []).size;
      const averageResponseTime = analytics?.reduce((sum, day) => sum + (day.avg_response_time || 0), 0) / (analytics?.length || 1);
      const averageRating = analytics?.reduce((sum, day) => sum + (day.avg_rating || 0), 0) / (analytics?.length || 1);
      const positiveRating = analytics?.reduce((sum, day) => sum + (day.positive_feedback_count || 0), 0) / totalConversations * 100;

      setAnalyticsData({
        totalConversations,
        uniqueUsers,
        averageResponseTime: Math.round(averageResponseTime),
        averageRating: Math.round(averageRating * 10) / 10,
        positiveRating: Math.round(positiveRating),
        dailyUsage: analytics?.slice(0, 7).map(day => ({
          date: day.date,
          conversations: day.total_conversations,
          users: day.unique_users
        })) || []
      });

    } catch (error) {
      console.error('Error fetching AI analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading AI analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Assistant Analytics</h2>
        <Badge variant="outline" className="flex items-center gap-1">
          <Bot className="h-3 w-3" />
          Powered by Gemini
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Conversations</p>
                <p className="text-2xl font-bold">{analyticsData.totalConversations}</p>
                <p className="text-xs text-green-600">+15% this week</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{analyticsData.uniqueUsers}</p>
                <p className="text-xs text-green-600">85% engagement rate</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold">{analyticsData.averageResponseTime}ms</p>
                <p className="text-xs text-blue-600">Real-time responses</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satisfaction Rate</p>
                <p className="text-2xl font-bold">{analyticsData.positiveRating}%</p>
                <p className="text-xs text-green-600">Positive feedback</p>
              </div>
              <ThumbsUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Response Accuracy</span>
              <div className="flex items-center gap-2">
                <Progress value={92} className="w-32" />
                <span className="text-sm">92%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Helpfulness Rating</span>
              <div className="flex items-center gap-2">
                <Progress value={88} className="w-32" />
                <span className="text-sm">4.4/5</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Context Understanding</span>
              <div className="flex items-center gap-2">
                <Progress value={85} className="w-32" />
                <span className="text-sm">85%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Learning Outcome Support</span>
              <div className="flex items-center gap-2">
                <Progress value={90} className="w-32" />
                <span className="text-sm">90%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Usage Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Concept Explanations</span>
                <Badge variant="secondary">45%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Practice Questions</span>
                <Badge variant="secondary">25%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Study Guidance</span>
                <Badge variant="secondary">20%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Assignment Help</span>
                <Badge variant="secondary">10%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Usage Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Usage Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.dailyUsage.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">
                  {new Date(day.date).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">{day.conversations} conversations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{day.users} users</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAnalyticsDashboard;
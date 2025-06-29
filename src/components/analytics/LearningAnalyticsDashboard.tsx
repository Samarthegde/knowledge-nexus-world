import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Target, 
  BookOpen, 
  Award,
  Brain,
  Heart,
  MessageSquare,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface EngagementMetrics {
  activeUsers: number;
  completionRate: number;
  averageSessionTime: number;
  discussionParticipation: number;
}

interface PersonalizationMetrics {
  adaptivePathsActive: number;
  learningStyleDistribution: Record<string, number>;
  personalizationEffectiveness: number;
}

interface SupportMetrics {
  supportTickets: number;
  responseTime: number;
  mentorshipMatches: number;
  riskStudents: number;
}

interface AssessmentMetrics {
  assessmentCompletion: number;
  feedbackTimeliness: number;
  competencyAchievement: number;
  alternativeAssessments: number;
}

const LearningAnalyticsDashboard = () => {
  const { user } = useAuth();
  const [engagementData, setEngagementData] = useState<EngagementMetrics>({
    activeUsers: 0,
    completionRate: 0,
    averageSessionTime: 0,
    discussionParticipation: 0
  });
  
  const [personalizationData, setPersonalizationData] = useState<PersonalizationMetrics>({
    adaptivePathsActive: 0,
    learningStyleDistribution: {},
    personalizationEffectiveness: 0
  });

  const [supportData, setSupportData] = useState<SupportMetrics>({
    supportTickets: 0,
    responseTime: 0,
    mentorshipMatches: 0,
    riskStudents: 0
  });

  const [assessmentData, setAssessmentData] = useState<AssessmentMetrics>({
    assessmentCompletion: 0,
    feedbackTimeliness: 0,
    competencyAchievement: 0,
    alternativeAssessments: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [user]);

  const fetchAnalyticsData = async () => {
    if (!user) return;

    try {
      // Fetch engagement metrics
      const { data: progressData } = await supabase
        .from('student_progress')
        .select('*');

      const { data: discussionData } = await supabase
        .from('discussions')
        .select('user_id')
        .not('user_id', 'is', null);

      // Calculate engagement metrics
      const uniqueUsers = new Set(progressData?.map(p => p.user_id) || []).size;
      const completedContent = progressData?.filter(p => p.completed_at) || [];
      const completionRate = progressData?.length ? (completedContent.length / progressData.length) * 100 : 0;
      const uniqueDiscussionUsers = new Set(discussionData?.map(d => d.user_id) || []).size;
      const participationRate = uniqueUsers ? (uniqueDiscussionUsers / uniqueUsers) * 100 : 0;

      setEngagementData({
        activeUsers: uniqueUsers,
        completionRate: Math.round(completionRate),
        averageSessionTime: 23, // Mock data - would come from session tracking
        discussionParticipation: Math.round(participationRate)
      });

      // Mock data for other metrics (would be calculated from actual data)
      setPersonalizationData({
        adaptivePathsActive: Math.floor(uniqueUsers * 0.6),
        learningStyleDistribution: {
          visual: 35,
          auditory: 25,
          kinesthetic: 20,
          reading: 20
        },
        personalizationEffectiveness: 78
      });

      setSupportData({
        supportTickets: 12,
        responseTime: 1.8,
        mentorshipMatches: Math.floor(uniqueUsers * 0.3),
        riskStudents: Math.floor(uniqueUsers * 0.15)
      });

      setAssessmentData({
        assessmentCompletion: 85,
        feedbackTimeliness: 92,
        competencyAchievement: 88,
        alternativeAssessments: 45
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Learning Experience Analytics</h1>
        <Badge variant="outline">Real-time Data</Badge>
      </div>

      <Tabs defaultValue="engagement" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="engagement">Academic Engagement</TabsTrigger>
          <TabsTrigger value="personalization">Personalization</TabsTrigger>
          <TabsTrigger value="support">Support Systems</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold">{engagementData.activeUsers}</p>
                    <p className="text-xs text-green-600">+12% from last month</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold">{engagementData.completionRate}%</p>
                    <p className="text-xs text-green-600">Target: 85%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Session Time</p>
                    <p className="text-2xl font-bold">{engagementData.averageSessionTime}m</p>
                    <p className="text-xs text-yellow-600">Target: 35m</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Discussion Participation</p>
                    <p className="text-2xl font-bold">{engagementData.discussionParticipation}%</p>
                    <p className="text-xs text-yellow-600">Target: 60%</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Improvement Strategies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Gamification Implementation</span>
                  <Progress value={75} className="w-32" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Interactive Content Features</span>
                  <Progress value={45} className="w-32" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Personalized Nudges</span>
                  <Progress value={30} className="w-32" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Virtual Study Groups</span>
                  <Progress value={20} className="w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personalization" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Adaptive Paths Active</p>
                    <p className="text-2xl font-bold">{personalizationData.adaptivePathsActive}</p>
                    <p className="text-xs text-green-600">60% of users</p>
                  </div>
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Personalization Effectiveness</p>
                    <p className="text-2xl font-bold">{personalizationData.personalizationEffectiveness}%</p>
                    <p className="text-xs text-green-600">Above target</p>
                  </div>
                  <Target className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Learning Styles Identified</p>
                    <p className="text-2xl font-bold">4</p>
                    <p className="text-xs text-blue-600">Visual, Auditory, Kinesthetic, Reading</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Efficiency Improvement</p>
                    <p className="text-2xl font-bold">30%</p>
                    <p className="text-xs text-green-600">Time to competency</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Learning Style Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(personalizationData.learningStyleDistribution).map(([style, percentage]) => (
                  <div key={style} className="flex items-center justify-between">
                    <span className="capitalize">{style} Learners</span>
                    <div className="flex items-center gap-2">
                      <Progress value={percentage} className="w-32" />
                      <span className="text-sm">{percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Open Support Tickets</p>
                    <p className="text-2xl font-bold">{supportData.supportTickets}</p>
                    <p className="text-xs text-green-600">-20% from last week</p>
                  </div>
                  <Heart className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                    <p className="text-2xl font-bold">{supportData.responseTime}h</p>
                    <p className="text-xs text-green-600">Target: &lt;2h</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Mentorship Matches</p>
                    <p className="text-2xl font-bold">{supportData.mentorshipMatches}</p>
                    <p className="text-xs text-green-600">30% participation</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">At-Risk Students</p>
                    <p className="text-2xl font-bold">{supportData.riskStudents}</p>
                    <p className="text-xs text-yellow-600">Early intervention active</p>
                  </div>
                  <Target className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Support System Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Early Warning System Accuracy</span>
                  <div className="flex items-center gap-2">
                    <Progress value={85} className="w-32" />
                    <span className="text-sm">85%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Intervention Success Rate</span>
                  <div className="flex items-center gap-2">
                    <Progress value={80} className="w-32" />
                    <span className="text-sm">80%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Student Satisfaction</span>
                  <div className="flex items-center gap-2">
                    <Progress value={95} className="w-32" />
                    <span className="text-sm">95%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessment" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Assessment Completion</p>
                    <p className="text-2xl font-bold">{assessmentData.assessmentCompletion}%</p>
                    <p className="text-xs text-green-600">Above target</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Feedback Timeliness</p>
                    <p className="text-2xl font-bold">{assessmentData.feedbackTimeliness}%</p>
                    <p className="text-xs text-green-600">Within 24h target</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Competency Achievement</p>
                    <p className="text-2xl font-bold">{assessmentData.competencyAchievement}%</p>
                    <p className="text-xs text-green-600">Mastery-based</p>
                  </div>
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Alternative Assessments</p>
                    <p className="text-2xl font-bold">{assessmentData.alternativeAssessments}%</p>
                    <p className="text-xs text-blue-600">Portfolio, performance-based</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assessment Innovation Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Adaptive Assessment Implementation</span>
                  <div className="flex items-center gap-2">
                    <Progress value={60} className="w-32" />
                    <span className="text-sm">60%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Portfolio Assessment Integration</span>
                  <div className="flex items-center gap-2">
                    <Progress value={40} className="w-32" />
                    <span className="text-sm">40%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Peer Assessment Features</span>
                  <div className="flex items-center gap-2">
                    <Progress value={25} className="w-32" />
                    <span className="text-sm">25%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Real-time Feedback Systems</span>
                  <div className="flex items-center gap-2">
                    <Progress value={70} className="w-32" />
                    <span className="text-sm">70%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearningAnalyticsDashboard;
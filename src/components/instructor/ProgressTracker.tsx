
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Clock, Award, TrendingUp, BookOpen } from 'lucide-react';

interface StudentProgress {
  user_id: string;
  student_name: string;
  student_email: string;
  total_content_accessed: number;
  completed_content: number;
  average_progress: number;
  total_time_spent: number;
  last_activity: string;
  has_certificate: boolean;
}

const ProgressTracker = () => {
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [progressData, setProgressData] = useState<StudentProgress[]>([]);
  const [courseStats, setCourseStats] = useState({
    totalStudents: 0,
    averageCompletion: 0,
    certificatesIssued: 0,
    totalTimeSpent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, [courseId]);

  const fetchProgressData = async () => {
    if (!courseId) return;

    try {
      // Get unique students from course_purchases or enrollments
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('course_purchases')
        .select('user_id')
        .eq('course_id', courseId)
        .eq('payment_status', 'completed');

      if (enrollmentError) throw enrollmentError;

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const studentIds = enrollments.map(e => e.user_id).filter(Boolean);

      // Get student progress for each student
      const progressPromises = studentIds.map(async (studentId) => {
        const [profileResult, progressResult, certificateResult] = await Promise.all([
          supabase.from('profiles').select('full_name, email').eq('id', studentId).single(),
          supabase.from('student_progress').select('*').eq('user_id', studentId).eq('course_id', courseId),
          supabase.from('certificates').select('id').eq('student_id', studentId).eq('course_id', courseId).single()
        ]);

        const progressRecords = progressResult.data || [];
        const totalProgress = progressRecords.length > 0 
          ? progressRecords.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / progressRecords.length
          : 0;

        const totalTime = progressRecords.reduce((sum, p) => sum + (p.time_spent_seconds || 0), 0);
        const completedCount = progressRecords.filter(p => p.completed_at).length;
        const lastActivity = progressRecords.length > 0 
          ? Math.max(...progressRecords.map(p => new Date(p.updated_at).getTime()))
          : Date.now();

        return {
          user_id: studentId,
          student_name: profileResult.data?.full_name || 'Unknown',
          student_email: profileResult.data?.email || '',
          total_content_accessed: progressRecords.length,
          completed_content: completedCount,
          average_progress: totalProgress,
          total_time_spent: totalTime,
          last_activity: new Date(lastActivity).toISOString(),
          has_certificate: !certificateResult.error && certificateResult.data !== null
        };
      });

      const formattedProgress = await Promise.all(progressPromises);
      setProgressData(formattedProgress);

      // Calculate course stats
      const stats = {
        totalStudents: formattedProgress.length,
        averageCompletion: formattedProgress.length > 0 
          ? formattedProgress.reduce((sum, p) => sum + p.average_progress, 0) / formattedProgress.length 
          : 0,
        certificatesIssued: formattedProgress.filter(p => p.has_certificate).length,
        totalTimeSpent: formattedProgress.reduce((sum, p) => sum + p.total_time_spent, 0)
      };

      setCourseStats(stats);
    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load progress data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) return <div>Loading progress data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Student Progress Tracking</h2>
      </div>

      {/* Course Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{courseStats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
                <p className="text-2xl font-bold">{Math.round(courseStats.averageCompletion)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Certificates</p>
                <p className="text-2xl font-bold">{courseStats.certificatesIssued}</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Time</p>
                <p className="text-2xl font-bold">{formatTime(courseStats.totalTimeSpent)}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Progress List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Individual Student Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          {progressData.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No student data yet</h3>
              <p className="text-gray-500">
                Student progress will appear here once students start engaging with your course.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {progressData.map((student) => (
                <Card key={student.user_id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{student.student_name}</h3>
                        <p className="text-sm text-gray-600">{student.student_email}</p>
                      </div>
                      <div className="flex gap-2">
                        {student.has_certificate && (
                          <Badge variant="default">
                            <Award className="h-3 w-3 mr-1" />
                            Certified
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={getProgressColor(student.average_progress)}
                        >
                          {Math.round(student.average_progress)}% Complete
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{Math.round(student.average_progress)}%</span>
                        </div>
                        <Progress value={student.average_progress} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Content Accessed:</span>
                          <div className="font-medium">{student.total_content_accessed}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Completed:</span>
                          <div className="font-medium">{student.completed_content}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Time Spent:</span>
                          <div className="font-medium">{formatTime(student.total_time_spent)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Activity:</span>
                          <div className="font-medium">
                            {new Date(student.last_activity).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressTracker;

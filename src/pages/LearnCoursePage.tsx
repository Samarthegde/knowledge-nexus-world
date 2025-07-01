import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Play, FileText, File, ChevronLeft, ChevronRight, Lock, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DripContentViewer from '@/components/content/DripContentViewer';
import AIAssistantWidget from '@/components/ai/AIAssistantWidget';

interface CourseContent {
  id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  text_content: string;
  is_free: boolean;
  duration_minutes: number;
  is_unlocked?: boolean;
  unlock_date?: string;
}

interface Course {
  id: string;
  title: string;
  ai_assistant_enabled: boolean;
}

const LearnCoursePage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [content, setContent] = useState<CourseContent[]>([]);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, any>>({});

  useEffect(() => {
    if (id && user) {
      checkEnrollmentAndFetchContent();
    }
  }, [id, user]);

  const checkEnrollmentAndFetchContent = async () => {
    try {
      console.log('Checking enrollment for course:', id, 'user:', user.id);

      // First, fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title, ai_assistant_enabled, price, is_published')
        .eq('id', id)
        .single();

      if (courseError) {
        console.error('Error fetching course:', courseError);
        throw courseError;
      }

      console.log('Course data:', courseData);
      setCourse(courseData);

      // Check if user has purchased the course (for paid courses)
      let hasAccess = false;
      if (courseData?.price > 0) {
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('course_purchases')
          .select('*')
          .eq('course_id', id)
          .eq('user_id', user.id)
          .eq('payment_status', 'completed');

        if (purchaseError) {
          console.error('Error checking purchase:', purchaseError);
        }

        console.log('Purchase data:', purchaseData);
        hasAccess = purchaseData && purchaseData.length > 0;
        setIsEnrolled(hasAccess);
      } else {
        // Free course - user has access
        hasAccess = true;
        setIsEnrolled(true);
      }

      if (!hasAccess && courseData?.price > 0) {
        toast({
          title: 'Access Denied',
          description: 'You need to purchase this course to access it',
          variant: 'destructive',
        });
        navigate(`/course/${id}`);
        return;
      }

      // Fetch all course content directly (without RPC for debugging)
      const { data: allContentData, error: contentError } = await supabase
        .from('course_content')
        .select('*')
        .eq('course_id', id)
        .order('order_index');

      if (contentError) {
        console.error('Error fetching course content:', contentError);
        throw contentError;
      }

      console.log('All content data:', allContentData);

      // For now, make all content accessible (we'll fix drip content later)
      const accessibleContent = allContentData?.map(item => ({
        ...item,
        is_unlocked: true,
        unlock_date: null
      })) || [];

      console.log('Accessible content:', accessibleContent);
      setContent(accessibleContent);

      // Fetch user progress
      const { data: progressData } = await supabase
        .from('student_progress')
        .select('*')
        .eq('course_id', id)
        .eq('user_id', user.id);

      console.log('Progress data:', progressData);
      const progressMap = {};
      progressData?.forEach(p => {
        progressMap[p.content_id] = p;
      });
      setProgress(progressMap);

    } catch (error) {
      console.error('Error in checkEnrollmentAndFetchContent:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course content',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markContentAsCompleted = async (contentId: string) => {
    if (!user || !id) return;

    try {
      const { error } = await supabase
        .from('student_progress')
        .upsert({
          user_id: user.id,
          course_id: id,
          content_id: contentId,
          completed_at: new Date().toISOString(),
          progress_percentage: 100
        });

      if (error) throw error;

      // Update local progress state
      setProgress(prev => ({
        ...prev,
        [contentId]: {
          ...prev[contentId],
          completed_at: new Date().toISOString(),
          progress_percentage: 100
        }
      }));

      toast({
        title: 'Progress Updated',
        description: 'Content marked as completed'
      });

    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to update progress',
        variant: 'destructive'
      });
    }
  };

  const currentContent = content[currentContentIndex];

  const nextContent = () => {
    if (currentContentIndex < content.length - 1) {
      setCurrentContentIndex(currentContentIndex + 1);
    }
  };

  const prevContent = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex(currentContentIndex - 1);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'pdf':
        return <File className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Calculate current progress percentage
  const currentProgress = content.length > 0 ? Math.round(((currentContentIndex + 1) / content.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/courses')} className="bg-blue-600 hover:bg-blue-700">
            Browse All Courses
          </Button>
        </div>
      </div>
    );
  }

  // If no content available, show a helpful message
  if (content.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <p className="text-gray-600">This course doesn't have any content yet.</p>
          </div>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content available</h3>
              <p className="text-gray-500 mb-4">
                The instructor hasn't added any lessons to this course yet. Please check back later.
              </p>
              <Button onClick={() => navigate('/courses')} variant="outline">
                Browse Other Courses
              </Button>
            </CardContent>
          </Card>
          
          {/* AI Assistant Widget - only show if enabled for this course */}
          {course.ai_assistant_enabled && (
            <AIAssistantWidget 
              courseId={id}
              currentLesson="Course Overview"
              studentProgress={0}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Course Content List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {content.map((item, index) => {
                    const itemProgress = progress[item.id];
                    const isCompleted = itemProgress?.completed_at;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentContentIndex(index)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          index === currentContentIndex
                            ? 'bg-blue-50 border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {getContentIcon(item.content_type)}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-xs text-gray-500">
                              {item.content_type.toUpperCase()}
                              {item.duration_minutes && ` • ${item.duration_minutes} min`}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {item.is_free && (
                              <Badge variant="outline" className="text-xs">FREE</Badge>
                            )}
                            {isCompleted && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      {getContentIcon(currentContent.content_type)}
                      <span>{currentContent.title}</span>
                    </CardTitle>
                    {currentContent.description && (
                      <p className="text-gray-600 mt-2">{currentContent.description}</p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {currentContentIndex + 1} of {content.length}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Content Display */}
                <div className="mb-6">
                  {currentContent.content_type === 'text' ? (
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap bg-white p-6 rounded-lg border">
                        {currentContent.text_content}
                      </div>
                    </div>
                  ) : currentContent.content_type === 'video' ? (
                    <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                      {currentContent.content_url ? (
                        <video 
                          controls 
                          className="w-full h-full rounded-lg"
                          src={currentContent.content_url}
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <div className="text-white text-center">
                          <Play className="h-16 w-16 mx-auto mb-4" />
                          <p>Video content will be displayed here</p>
                          <p className="text-sm text-gray-300 mt-2">
                            URL: {currentContent.content_url || 'Not provided'}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : currentContent.content_type === 'pdf' ? (
                    <div className="aspect-[4/5] bg-gray-100 rounded-lg flex items-center justify-center">
                      {currentContent.content_url ? (
                        <iframe
                          src={currentContent.content_url}
                          className="w-full h-full rounded-lg"
                          title="PDF Content"
                        />
                      ) : (
                        <div className="text-center">
                          <File className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                          <p>PDF content will be displayed here</p>
                          <p className="text-sm text-gray-400 mt-2">
                            URL: {currentContent.content_url || 'Not provided'}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Mark as Complete Button */}
                {!progress[currentContent.id]?.completed_at && (
                  <div className="mb-6">
                    <Button 
                      onClick={() => markContentAsCompleted(currentContent.id)}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Complete
                    </Button>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between items-center pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={prevContent}
                    disabled={currentContentIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="text-sm text-gray-500">
                    Progress: {currentProgress}%
                  </div>

                  <Button
                    onClick={nextContent}
                    disabled={currentContentIndex === content.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Assistant Widget - only show if enabled for this course */}
      {course.ai_assistant_enabled && (
        <AIAssistantWidget 
          courseId={id}
          currentLesson={currentContent?.title}
          studentProgress={currentProgress}
        />
      )}
    </div>
  );
};

export default LearnCoursePage;

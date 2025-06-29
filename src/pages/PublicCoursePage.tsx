
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Play, FileText, File, Clock, DollarSign, Users, Star } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  short_description: string;
  price: number;
  currency: string;
  level: string;
  category: string;
  duration_minutes: number;
  instructor_id: string;
  is_published: boolean;
}

interface CourseContent {
  id: string;
  title: string;
  content_type: string;
  is_free: boolean;
  duration_minutes: number;
}

const PublicCoursePage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [content, setContent] = useState<CourseContent[]>([]);
  const [instructor, setInstructor] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchCourseData();
    }
  }, [slug, user]);

  const fetchCourseData = async () => {
    try {
      // Fetch course by slug
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (courseError) throw courseError;

      setCourse(courseData);

      // Fetch instructor profile
      const { data: instructorData } = await supabase
        .from('profiles')
        .select('full_name, bio')
        .eq('id', courseData.instructor_id)
        .single();

      setInstructor(instructorData);

      // Fetch course content
      const { data: contentData } = await supabase
        .from('course_content')
        .select('id, title, content_type, is_free, duration_minutes')
        .eq('course_id', courseData.id)
        .order('order_index');

      setContent(contentData || []);

      // Check if user is enrolled
      if (user) {
        const { data: purchaseData } = await supabase
          .from('course_purchases')
          .select('*')
          .eq('course_id', courseData.id)
          .eq('user_id', user.id)
          .eq('payment_status', 'completed')
          .single();

        setIsEnrolled(!!purchaseData);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast({
        title: 'Error',
        description: 'Course not found',
        variant: 'destructive',
      });
      navigate('/courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (course?.price === 0) {
      // Free course enrollment
      try {
        const { error } = await supabase
          .from('course_purchases')
          .insert({
            course_id: course.id,
            user_id: user.id,
            purchase_type: 'free',
            payment_status: 'completed',
            amount: 0,
          });

        if (error) throw error;

        toast({
          title: 'Enrolled Successfully',
          description: 'You have been enrolled in this free course',
        });

        setIsEnrolled(true);
      } catch (error) {
        console.error('Error enrolling in free course:', error);
        toast({
          title: 'Error',
          description: 'Failed to enroll in course',
          variant: 'destructive',
        });
      }
    } else {
      // Paid course - trigger payment
      handlePayment();
    }
  };

  const handlePayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          courseId: course?.id,
          amount: course?.price,
          currency: course?.currency,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to create payment session',
        variant: 'destructive',
      });
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

  if (isLoading) return <div>Loading...</div>;

  if (!course) return <div>Course not found</div>;

  const totalDuration = content.reduce((total, item) => total + (item.duration_minutes || 0), 0);
  const freeContent = content.filter(item => item.is_free);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="secondary">{course.category}</Badge>
                <Badge variant="outline">{course.level}</Badge>
              </div>
              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              <p className="text-lg text-gray-600 mb-4">{course.short_description}</p>
              
              <div className="flex items-center space-x-6 text-sm text-gray-500 mb-6">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{totalDuration} minutes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{content.length} lessons</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4" />
                  <span>4.5 (New Course)</span>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>About This Course</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{course.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {content.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getContentIcon(item.content_type)}
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-gray-500">
                            {item.content_type.toUpperCase()}
                            {item.duration_minutes && ` • ${item.duration_minutes} min`}
                          </p>
                        </div>
                      </div>
                      {item.is_free && (
                        <Badge variant="outline" className="text-green-600">
                          FREE
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {instructor && (
              <Card>
                <CardHeader>
                  <CardTitle>Instructor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <h3 className="font-semibold">{instructor.full_name}</h3>
                    {instructor.bio && (
                      <p className="text-gray-600 mt-2">{instructor.bio}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  {course.price === 0 ? (
                    <div className="text-2xl font-bold text-green-600">FREE</div>
                  ) : (
                    <div className="flex items-center justify-center space-x-1">
                      <DollarSign className="h-6 w-6" />
                      <span className="text-2xl font-bold">{course.price}</span>
                      <span className="text-gray-500">{course.currency}</span>
                    </div>
                  )}
                </div>

                {isEnrolled ? (
                  <Button className="w-full" onClick={() => navigate(`/learn/${course.id}`)}>
                    Continue Learning
                  </Button>
                ) : (
                  <Button className="w-full" onClick={handleEnroll}>
                    {course.price === 0 ? 'Enroll for Free' : 'Buy Now'}
                  </Button>
                )}

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Total Duration:</span>
                    <span>{totalDuration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lessons:</span>
                    <span>{content.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Free Preview:</span>
                    <span>{freeContent.length} lessons</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Level:</span>
                    <span className="capitalize">{course.level}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicCoursePage;

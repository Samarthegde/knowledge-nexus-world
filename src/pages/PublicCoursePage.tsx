import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Play, FileText, File, Clock, DollarSign, Users, Star, Globe, Award, CheckCircle, PlayCircle } from 'lucide-react';

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
        .maybeSingle();

      if (courseError) throw courseError;

      if (!courseData) {
        toast({
          title: 'Course Not Found',
          description: 'The course you are looking for does not exist or is not published.',
          variant: 'destructive',
        });
        navigate('/courses');
        return;
      }

      setCourse(courseData);

      // Fetch instructor profile
      const { data: instructorData } = await supabase
        .from('profiles')
        .select('full_name, bio')
        .eq('id', courseData.instructor_id)
        .maybeSingle();

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
          .maybeSingle();

        setIsEnrolled(!!purchaseData);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course information. Please try again.',
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
          <p className="text-gray-600">The course you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const totalDuration = content.reduce((total, item) => total + (item.duration_minutes || 0), 0);
  const freeContent = content.filter(item => item.is_free);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="edx-container py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 px-3 py-1">
                  {course.category}
                </Badge>
                <Badge variant="outline" className="capitalize border-gray-300">
                  {course.level}
                </Badge>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  {Math.ceil(totalDuration / 60)} hours
                </div>
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                {course.title}
              </h1>
              
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {course.short_description}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-8">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  <span className="font-medium">{content.length} lessons</span>
                </div>
                <div className="flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-blue-600" />
                  <span className="font-medium">English</span>
                </div>
                <div className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-blue-600" />
                  <span className="font-medium">Certificate included</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  <span className="font-medium">4.8 (125 reviews)</span>
                </div>
              </div>

              {/* What you'll learn */}
              <Card className="edx-card mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                    What you'll learn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      'Master the fundamentals and advanced concepts',
                      'Build real-world projects from scratch',
                      'Gain hands-on experience with industry tools',
                      'Develop problem-solving skills',
                      'Connect with a community of learners',
                      'Earn a verified certificate of completion'
                    ].map((item, index) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Course Purchase Card */}
            <div className="lg:col-span-1">
              <Card className="edx-card sticky top-6 shadow-lg">
                <CardContent className="p-6">
                  {/* Course Preview Image/Video */}
                  <div className="relative bg-gray-900 rounded-lg mb-6 aspect-video flex items-center justify-center group cursor-pointer">
                    <PlayCircle className="h-16 w-16 text-white group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-black/20 rounded-lg"></div>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    {course.price === 0 ? (
                      <div className="text-3xl font-bold text-green-600">FREE</div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-center text-3xl font-bold text-gray-900">
                          <DollarSign className="h-7 w-7" />
                          {course.price}
                          <span className="text-lg text-gray-500 ml-1">{course.currency}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">One-time purchase</p>
                      </div>
                    )}
                  </div>

                  {/* Enroll Button */}
                  {isEnrolled ? (
                    <Button 
                      className="w-full mb-4 bg-green-600 hover:bg-green-700 text-lg py-3" 
                      onClick={() => navigate(`/learn/${course.id}`)}
                    >
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Continue Learning
                    </Button>
                  ) : (
                    <Button 
                      className="w-full mb-4 edx-button-primary text-lg py-3" 
                      onClick={handleEnroll}
                    >
                      {course.price === 0 ? 'Enroll for Free' : 'Enroll Now'}
                    </Button>
                  )}

                  <p className="text-center text-sm text-gray-500 mb-6">
                    30-day money-back guarantee
                  </p>

                  {/* Course Details */}
                  <div className="space-y-4 border-t pt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">{Math.ceil(totalDuration / 60)} hours</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Lessons</span>
                      <span className="font-medium">{content.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Free Preview</span>
                      <span className="font-medium">{freeContent.length} lessons</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Level</span>
                      <span className="font-medium capitalize">{course.level}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Certificate</span>
                      <span className="font-medium">Included</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Access</span>
                      <span className="font-medium">Lifetime</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content & Details */}
      <div className="edx-container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {/* About Course */}
            <Card className="edx-card">
              <CardHeader>
                <CardTitle className="text-2xl">About this course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {course.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Course Content */}
            <Card className="edx-card">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <FileText className="h-6 w-6 mr-3 text-blue-600" />
                  Course content
                </CardTitle>
                <p className="text-gray-600">
                  {content.length} lessons • {Math.ceil(totalDuration / 60)} hours total
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {content.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {getContentIcon(item.content_type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <div className="flex items-center space-x-3 text-sm text-gray-500">
                            <span className="uppercase font-medium">{item.content_type}</span>
                            {item.duration_minutes && (
                              <>
                                <span>•</span>
                                <span>{item.duration_minutes} min</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.is_free && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            FREE
                          </Badge>
                        )}
                        {item.is_free && (
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                            Preview
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Instructor */}
            {instructor && (
              <Card className="edx-card">
                <CardHeader>
                  <CardTitle className="text-2xl">Your instructor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {instructor.full_name}
                      </h3>
                      {instructor.bio && (
                        <p className="text-gray-700 leading-relaxed">{instructor.bio}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Content */}
          <div className="lg:col-span-1">
            {/* Skills you'll gain */}
            <Card className="edx-card mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Skills you'll gain</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['Problem Solving', 'Critical Thinking', 'Project Management', 'Communication'].map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-blue-50 text-blue-700">
                      {skill}
                    </Badge>
                  ))}
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

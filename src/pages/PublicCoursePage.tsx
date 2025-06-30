
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Clock, 
  Users, 
  Star, 
  BookOpen, 
  CheckCircle, 
  Globe, 
  Award,
  Heart,
  Share2,
  Download,
  Calendar,
  Target,
  User as UserIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CourseRatingForm from '@/components/ratings/CourseRatingForm';

interface Course {
  id: string;
  title: string;
  description: string;
  short_description: string;
  price: number;
  currency: string;
  level: string;
  duration_minutes: number;
  category: string;
  thumbnail_url: string;
  instructor_id: string;
  instructor_name: string;
  instructor_bio: string;
  created_at: string;
  student_count: number;
  average_rating: number;
  rating_count: number;
  syllabus: any;
}

interface CourseContent {
  id: string;
  title: string;
  content_type: string;
  duration_minutes: number;
  is_free: boolean;
  order_index: number;
}

const PublicCoursePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        instructor_name: 'Instructor Name', // Default value
        instructor_bio: 'Instructor Bio', // Default value
        student_count: 0, // Default value
        average_rating: 0, // Default value
        rating_count: 0, // Default value
      };
    },
    enabled: !!slug,
  });

  const { data: content = [] } = useQuery({
    queryKey: ['course-content', course?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_content')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index');

      if (error) throw error;
      return data;
    },
    enabled: !!course?.id,
  });

  useEffect(() => {
    if (user && course) {
      checkEnrollment();
    }
  }, [user, course]);

  const checkEnrollment = async () => {
    if (!user || !course) return;

    const { data } = await supabase
      .from('course_purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', course.id)
      .eq('payment_status', 'completed')
      .single();

    setIsEnrolled(!!data);
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (course.price === 0) {
      // Free course enrollment
      const { error } = await supabase
        .from('course_purchases')
        .insert({
          user_id: user.id,
          course_id: course.id,
          amount: 0,
          payment_status: 'completed',
          purchase_type: 'free'
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to enroll in course",
          variant: "destructive"
        });
      } else {
        setIsEnrolled(true);
        toast({
          title: "Success",
          description: "Successfully enrolled in course!"
        });
      }
    } else {
      // Paid course - redirect to payment
      navigate(`/course/${slug}/purchase`);
    }
  };

  const handleStartLearning = () => {
    navigate(`/learn/${course.id}`);
  };

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

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/courses')} className="bg-blue-600 hover:bg-blue-700">
            Browse All Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="edx-container py-12 lg:py-16">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {course.category}
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {course.level}
                </Badge>
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                {course.title}
              </h1>
              
              <p className="text-lg text-blue-100 mb-6 leading-relaxed">
                {course.short_description || course.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="font-semibold">{course.average_rating?.toFixed(1) || 'New'}</span>
                  <span className="text-blue-200">({course.rating_count || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-200" />
                  <span>{course.student_count || 0} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-200" />
                  <span>{Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-200" />
                  <span>English</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-blue-300">
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                    {course.instructor_name?.charAt(0).toUpperCase() || 'I'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Created by {course.instructor_name}</p>
                  <p className="text-blue-200 text-sm">
                    Updated {new Date(course.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Course Preview Card */}
            <div className="lg:col-span-1">
              <Card className="bg-white shadow-xl border-0 overflow-hidden">
                <div className="relative">
                  <img 
                    src={course.thumbnail_url || '/placeholder.svg'} 
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <Button size="lg" className="bg-white/90 text-black hover:bg-white">
                      <Play className="h-5 w-5 mr-2" />
                      Preview Course
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    {course.price === 0 ? (
                      <div className="text-3xl font-bold text-green-600">Free</div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-gray-900">
                          ${course.price}
                        </span>
                        <span className="text-gray-500 ml-1">{course.currency}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {isEnrolled ? (
                      <Button 
                        onClick={handleStartLearning}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                        size="lg"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Continue Learning
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleEnroll}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                        size="lg"
                      >
                        {course.price === 0 ? 'Enroll for Free' : 'Enroll Now'}
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setIsWishlisted(!isWishlisted)}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                      {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    </Button>
                    
                    <Button variant="outline" className="w-full">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Course
                    </Button>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Full lifetime access</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Access on mobile and TV</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Certificate of completion</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">30-day money-back guarantee</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="edx-container py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="instructor">Instructor</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      About This Course
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed">
                        {course.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {course.syllabus && typeof course.syllabus === 'object' && (course.syllabus as any).learningOutcomes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Learning Outcomes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {((course.syllabus as any).learningOutcomes as string[])?.map((outcome: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="curriculum" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Content</CardTitle>
                    <p className="text-gray-600">
                      {content.length} lessons • {Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m total length
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {content.map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 w-8">{index + 1}.</span>
                            <div>
                              <h4 className="font-medium text-gray-900">{item.title}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span className="capitalize">{item.content_type}</span>
                                <span>•</span>
                                <span>{item.duration_minutes} min</span>
                                {item.is_free && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="secondary" className="text-xs">Free Preview</Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {item.is_free && (
                            <Button variant="ghost" size="sm">
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="instructor" className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-xl">
                          {course.instructor_name?.charAt(0).toUpperCase() || 'I'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{course.instructor_name}</h3>
                        <p className="text-gray-600 mb-4">{course.instructor_bio}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <UserIcon className="h-4 w-4" />
                            <span>1,234 students</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            <span>5 courses</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            <span>4.8 rating</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No reviews yet. Be the first to review this course!</p>
                      {isEnrolled && (
                        <Button 
                          onClick={() => setShowRatingForm(true)}
                          className="mt-4"
                        >
                          Write a Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">
                    {Math.floor(course.duration_minutes / 60)} hours on-demand video
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">Downloadable resources</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">Certificate of completion</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">Full lifetime access</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {showRatingForm && (
        <CourseRatingForm
          courseId={course.id}
          onClose={() => setShowRatingForm(false)}
        />
      )}
    </div>
  );
};

export default PublicCoursePage;

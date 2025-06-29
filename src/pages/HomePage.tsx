import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import CourseCard from '@/components/courses/CourseCard';
import { GraduationCap, BookOpen, Users, Award, ArrowRight, Play, Star, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Course {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  thumbnail_url: string | null;
  price: number;
  currency: string | null;
  level: string | null;
  duration_minutes: number | null;
  category: string | null;
}

const HomePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalInstructors: 0
  });
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedCourses();
    fetchStats();
  }, []);

  const fetchFeaturedCourses = async () => {
    try {
      setFetchError(null);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .limit(6)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching courses:', error);
        setFetchError('Unable to load courses. Please check your connection and try again.');
        return;
      }

      setFeaturedCourses(data || []);
    } catch (err) {
      console.error('Network error fetching courses:', err);
      setFetchError('Network error: Unable to connect to the server. Please check your internet connection.');
    }
  };

  const fetchStats = async () => {
    try {
      const [coursesResult, studentsResult, instructorsResult] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact' }).eq('is_published', true),
        supabase.from('enrollments').select('student_id', { count: 'exact' }),
        supabase.from('user_roles').select('user_id', { count: 'exact' }).eq('role', 'instructor')
      ]);

      setStats({
        totalCourses: coursesResult.count || 0,
        totalStudents: studentsResult.count || 0,
        totalInstructors: instructorsResult.count || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Don't show error for stats as it's not critical
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Error Banner */}
      {fetchError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <div className="text-red-700">
              <p className="font-medium">Connection Error</p>
              <p className="text-sm">{fetchError}</p>
              <button 
                onClick={() => {
                  fetchFeaturedCourses();
                  fetchStats();
                }}
                className="text-red-600 underline text-sm mt-1 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-600 rounded-full shadow-lg">
                <GraduationCap className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Learn Without
              <span className="text-blue-600 block">Limits</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of learners and expert instructors in our comprehensive online learning platform. 
              Build skills, advance your career, and achieve your goals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {user ? (
                <>
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/courses')}
                    className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700"
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    Browse Courses
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => navigate('/my-courses')}
                    className="text-lg px-8 py-6 border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    My Learning
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/auth')}
                    className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700"
                  >
                    Get Started Free
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => navigate('/courses')}
                    className="text-lg px-8 py-6 border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Preview Courses
                  </Button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              {[
                { icon: BookOpen, label: 'Courses', value: stats.totalCourses },
                { icon: Users, label: 'Students', value: stats.totalStudents },
                { icon: Award, label: 'Instructors', value: stats.totalInstructors }
              ].map((stat, index) => (
                <Card key={index} className="border-0 shadow-sm bg-white/60 backdrop-blur">
                  <CardContent className="p-6 text-center">
                    <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value.toLocaleString()}</div>
                    <div className="text-gray-600">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose LearnHub?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform combines cutting-edge technology with proven learning methodologies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Expert-Led Courses',
                description: 'Learn from industry professionals and subject matter experts who bring real-world experience to every lesson.'
              },
              {
                icon: TrendingUp,
                title: 'Track Your Progress',
                description: 'Monitor your learning journey with detailed analytics, progress tracking, and personalized recommendations.'
              },
              {
                icon: Users,
                title: 'Community Learning',
                description: 'Connect with fellow learners, participate in discussions, and build your professional network.'
              },
              {
                icon: Star,
                title: 'Quality Content',
                description: 'Access high-quality, up-to-date content that is regularly reviewed and updated by our expert team.'
              },
              {
                icon: Award,
                title: 'Certificates',
                description: 'Earn recognized certificates upon course completion to showcase your new skills to employers.'
              },
              {
                icon: Play,
                title: 'Flexible Learning',
                description: 'Learn at your own pace with lifetime access to course materials and mobile-friendly content.'
              }
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Featured Courses
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Discover our most popular and highly-rated courses
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  shortDescription={course.short_description}
                  thumbnailUrl={course.thumbnail_url}
                  price={course.price}
                  currency={course.currency || 'USD'}
                  level={course.level}
                  durationMinutes={course.duration_minutes}
                  category={course.category}
                  slug={course.slug}
                />
              ))}
            </div>

            <div className="text-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/courses')}
                className="px-8 py-6 text-lg"
              >
                View All Courses
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join our community of learners and start building the skills you need for tomorrow
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate(user ? '/courses' : '/auth')}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg"
          >
            {user ? 'Browse Courses' : 'Get Started Today'}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
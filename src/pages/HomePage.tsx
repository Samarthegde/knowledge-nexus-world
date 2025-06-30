
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import CourseCard from '@/components/courses/CourseCard';
import { GraduationCap, BookOpen, Users, Award, ArrowRight, Play, Star, TrendingUp, AlertCircle, CheckCircle, Globe, Clock } from 'lucide-react';
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
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Error Banner */}
      {fetchError && (
        <div className="bg-red-50 border-l-4 border-red-400">
          <div className="edx-container py-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <div className="flex-1">
                <p className="font-medium text-red-800">Connection Error</p>
                <p className="text-sm text-red-700 mt-1">{fetchError}</p>
              </div>
              <button 
                onClick={() => {
                  fetchFeaturedCourses();
                  fetchStats();
                }}
                className="ml-4 text-red-600 underline text-sm hover:text-red-800 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - edX Style */}
      <section className="relative overflow-hidden edx-hero-gradient">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative edx-container py-20 lg:py-28">
          <div className="max-w-4xl">
            <div className="animate-fade-in-up">
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Learn from the
                <span className="block text-blue-200">world's best</span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl leading-relaxed">
                Access high-quality courses from top universities and industry experts. 
                Build skills that matter and advance your career with recognized certifications.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                {user ? (
                  <>
                    <Button 
                      size="lg" 
                      onClick={() => navigate('/courses')}
                      className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 rounded-lg font-semibold shadow-lg"
                    >
                      <BookOpen className="mr-2 h-5 w-5" />
                      Explore Courses
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      onClick={() => navigate('/my-courses')}
                      className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600 rounded-lg font-semibold"
                    >
                      Continue Learning
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="lg" 
                      onClick={() => navigate('/auth')}
                      className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 rounded-lg font-semibold shadow-lg"
                    >
                      Start Learning Free
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      onClick={() => navigate('/courses')}
                      className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600 rounded-lg font-semibold"
                    >
                      <Play className="mr-2 h-5 w-5" />
                      Browse Courses
                    </Button>
                  </>
                )}
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-8 max-w-2xl">
                {[
                  { label: 'Courses', value: stats.totalCourses, icon: BookOpen },
                  { label: 'Learners', value: stats.totalStudents, icon: Users },
                  { label: 'Instructors', value: stats.totalInstructors, icon: Award }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <stat.icon className="h-8 w-8 text-blue-200 mx-auto mb-2" />
                    <div className="text-3xl font-bold text-white">{stat.value.toLocaleString()}+</div>
                    <div className="text-blue-200 text-sm font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="edx-section-padding bg-gray-50">
        <div className="edx-container">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Why millions choose LearnHub
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join learners from 190+ countries who are advancing their careers with our world-class education platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: CheckCircle,
                title: 'Verified Certificates',
                description: 'Earn certificates from top universities and institutions that employers recognize and value.',
                color: 'text-green-600 bg-green-100'
              },
              {
                icon: Globe,
                title: 'Learn Anywhere',
                description: 'Access courses on any device, anytime. Download content for offline learning on mobile.',
                color: 'text-blue-600 bg-blue-100'
              },
              {
                icon: Users,
                title: 'Expert Instructors',
                description: 'Learn from university professors and industry leaders who bring real-world experience.',
                color: 'text-purple-600 bg-purple-100'
              },
              {
                icon: TrendingUp,
                title: 'Career Advancement',
                description: 'Build in-demand skills with courses designed to help you advance in your career.',
                color: 'text-orange-600 bg-orange-100'
              },
              {
                icon: Clock,
                title: 'Self-Paced Learning',
                description: 'Learn at your own pace with flexible deadlines and personalized learning paths.',
                color: 'text-indigo-600 bg-indigo-100'
              },
              {
                icon: Star,
                title: 'Top Quality Content',
                description: 'All courses are reviewed by experts and updated regularly to ensure the highest quality.',
                color: 'text-yellow-600 bg-yellow-100'
              }
            ].map((feature, index) => (
              <Card key={index} className="edx-card group hover:scale-105 transition-all duration-300">
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex p-4 rounded-2xl ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <section className="edx-section-padding">
          <div className="edx-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Popular courses
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover our most popular courses taught by world-class instructors
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredCourses.map((course, index) => (
                <div key={course.id} className="animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <CourseCard
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
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/courses')}
                className="edx-button-primary text-lg px-8 py-4"
              >
                View All Courses
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="edx-section-padding edx-hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative edx-container text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Start learning today
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join millions of learners worldwide and take the next step in your career journey
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate(user ? '/courses' : '/auth')}
              className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 rounded-lg font-semibold shadow-lg"
            >
              {user ? 'Browse Courses' : 'Get Started Free'}
            </Button>
            {!user && (
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/courses')}
                className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600 rounded-lg font-semibold"
              >
                Explore First
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

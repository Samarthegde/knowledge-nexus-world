import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, DollarSign, BarChart3, Plus, Award, TrendingUp } from 'lucide-react';
import { useInstructorCourses } from '@/hooks/useInstructorCourses';
import CourseCard from '@/components/courses/CourseCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProgressTracker from '@/components/instructor/ProgressTracker';
import RevenueTracker from '@/components/instructor/RevenueTracker';

const InstructorDashboard = () => {
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const { courses, loading, error } = useInstructorCourses();

  if (!hasPermission('create_courses') && !hasPermission('manage_own_courses')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access the instructor dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Instructor Dashboard</h1>
            <p className="text-gray-600">Manage your courses, track progress, and monitor revenue</p>
          </div>
          {hasPermission('create_courses') && (
            <Button onClick={() => navigate('/instructor/courses/new')} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Course
            </Button>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="progress">Student Progress</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Courses</p>
                      <p className="text-2xl font-bold">{courses.length}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Published</p>
                      <p className="text-2xl font-bold">
                        {courses.filter(c => c.is_published).length}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              {hasPermission('view_own_revenue') && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold">$0</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-yellow-600" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Recent Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {courses.length > 0 ? (
                    <div className="space-y-4">
                      {courses.slice(0, 3).map((course) => (
                        <div key={course.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{course.title}</h4>
                            <p className="text-sm text-gray-600">
                              {course.is_published ? 'Published' : 'Draft'} • 
                              Created {new Date(course.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/instructor/courses/${course.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-600 text-center py-8">No courses created yet</p>
                      {hasPermission('create_courses') && (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => navigate('/instructor/courses/new')}
                        >
                          Create Your First Course
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Certificates Issued</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Average Rating</span>
                      <span className="font-medium">N/A</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Course Completion Rate</span>
                      <span className="font-medium">N/A</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Students</span>
                      <span className="font-medium">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle>My Courses</CardTitle>
              </CardHeader>
              <CardContent>
                {courses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <CourseCard
                        key={course.id}
                        id={course.id}
                        title={course.title}
                        shortDescription={course.short_description}
                        thumbnailUrl={course.thumbnail_url}
                        price={course.price ?? 0}
                        currency={course.currency ?? 'USD'}
                        level={course.level}
                        durationMinutes={course.duration_minutes}
                        category={course.category}
                        slug={course.slug}
                        isEnrolled={false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                    <p className="text-gray-500 mb-4">Create your first course to get started</p>
                    {hasPermission('create_courses') && (
                      <Button onClick={() => navigate('/instructor/courses/new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Course
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress">
            {hasPermission('view_student_progress') ? (
              <ProgressTracker />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
                  <p className="text-gray-500">You don't have permission to view student progress.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="revenue">
            {hasPermission('view_own_revenue') ? (
              <RevenueTracker />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
                  <p className="text-gray-500">You don't have permission to view revenue data.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InstructorDashboard;
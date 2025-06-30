
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import CourseCard from '@/components/courses/CourseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Grid3X3, List, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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

const CoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [enrollments, setEnrollments] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchCourses();
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, categoryFilter, levelFilter, priceFilter]);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const fetchEnrollments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', user.id);

    if (error) {
      console.error('Error fetching enrollments:', error);
    } else {
      const enrolledCourseIds = new Set(data.map(enrollment => enrollment.course_id));
      setEnrollments(enrolledCourseIds);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.short_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(course => course.category === categoryFilter);
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(course => course.level === levelFilter);
    }

    if (priceFilter !== 'all') {
      if (priceFilter === 'free') {
        filtered = filtered.filter(course => course.price === 0);
      } else if (priceFilter === 'paid') {
        filtered = filtered.filter(course => course.price > 0);
      }
    }

    setFilteredCourses(filtered);
  };

  const categories = [...new Set(courses.map(course => course.category).filter(Boolean))];
  const levels = [...new Set(courses.map(course => course.level).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="edx-container py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Explore courses
            </h1>
            <p className="text-xl text-gray-600">
              Discover thousands of courses from top universities and industry experts
            </p>
          </div>
        </div>
      </div>

      <div className="edx-container py-8">
        {/* Filters */}
        <Card className="mb-8 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search for courses, skills, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-lg border-gray-300 focus:border-blue-500"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-3"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category!}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Level Filter */}
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {levels.map(level => (
                    <SelectItem key={level} value={level!} className="capitalize">
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Filter */}
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="All Prices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setLevelFilter('all');
                  setPriceFilter('all');
                }}
                className="h-11"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{filteredCourses.length}</span> courses found
              </p>
              <p className="text-sm text-gray-500">
                Showing {filteredCourses.length} of {courses.length} total courses
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
            : "space-y-6"
          }>
            {filteredCourses.map((course, index) => (
              <div 
                key={course.id} 
                className="animate-scale-in" 
                style={{ animationDelay: `${index * 50}ms` }}
              >
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
                  isEnrolled={enrollments.has(course.id)}
                  viewMode={viewMode}
                />
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-20">
            <CardContent>
              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600 mb-6">
                  We couldn't find any courses matching your criteria. Try adjusting your filters or search terms.
                </p>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setLevelFilter('all');
                    setPriceFilter('all');
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;

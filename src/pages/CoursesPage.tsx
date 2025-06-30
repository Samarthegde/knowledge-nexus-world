import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import CourseCard from '@/components/courses/CourseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Grid, List, BookOpen, Users, Clock, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
  created_at: string;
  student_count: number;
  average_rating: number;
  slug: string;
  is_enrolled: boolean;
}

const CoursesPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchCourses = async () => {
    let query = supabase
      .from('courses')
      .select('*')
      .eq('is_published', true);

    if (user) {
      query = query.select(`
        *,
        course_purchases(payment_status)
      `);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }

    const coursesWithEnrollment = data?.map(course => ({
      ...course,
      is_enrolled: course.course_purchases?.some(purchase => purchase.payment_status === 'completed') || false,
    })) || [];

    return coursesWithEnrollment;
  };

  const { data: courses = [], isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
    const matchesPrice = priceFilter === 'all' || 
                        (priceFilter === 'free' && course.price === 0) ||
                        (priceFilter === 'paid' && course.price > 0);
    
    return matchesSearch && matchesCategory && matchesLevel && matchesPrice;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return (b.average_rating || 0) - (a.average_rating || 0);
      default:
        return (b.student_count || 0) - (a.student_count || 0);
    }
  });

  const categories = ['all', 'Technology', 'Business', 'Design', 'Marketing', 'Health', 'Language'];
  const levels = ['all', 'Beginner', 'Intermediate', 'Advanced'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading courses. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="edx-hero-gradient text-white py-16">
        <div className="edx-container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Explore Our Course Catalog
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Discover thousands of courses from leading institutions and industry experts
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for courses, skills, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg bg-white/95 backdrop-blur-sm border-0 rounded-xl shadow-lg focus:shadow-xl transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="edx-container py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700">Filters:</span>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map(level => (
                  <SelectItem key={level} value={level}>
                    {level === 'all' ? 'All Levels' : level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">{sortedCourses.length}</span> courses found
              </p>
              {(searchQuery || selectedCategory !== 'all' || selectedLevel !== 'all' || priceFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedLevel('all');
                    setPriceFilter('all');
                  }}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Clear Filters
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">View:</span>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="p-2"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="p-2"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Course Grid/List */}
        {sortedCourses.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-6"
          }>
            {sortedCourses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                shortDescription={course.short_description || course.description}
                thumbnailUrl={course.thumbnail_url}
                price={course.price}
                currency={course.currency}
                level={course.level}
                durationMinutes={course.duration_minutes}
                category={course.category}
                slug={course.slug}
                isEnrolled={course.is_enrolled}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No courses found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search criteria or filters</p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedLevel('all');
                setPriceFilter('all');
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Show All Courses
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;

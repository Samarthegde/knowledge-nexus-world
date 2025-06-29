import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit } from 'lucide-react';

const CourseViewPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching course:', error);
        navigate('/instructor/dashboard', { state: { error: 'Failed to load course' } });
        return;
      }

      if (!data || data.instructor_id !== user?.id) {
        navigate('/instructor/dashboard', { state: { error: 'Course not found or access denied' } });
        return;
      }

      setCourse(data);
      setIsLoading(false);
    };

    fetchCourse();
  }, [id]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <Button onClick={() => navigate(`/instructor/courses/${course.id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Course
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Description</h3>
            <p>{course.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Category</h3>
              <p>{course.category}</p>
            </div>
            <div>
              <h3 className="font-medium">Level</h3>
              <p>{course.level.charAt(0).toUpperCase() + course.level.slice(1)}</p>
            </div>
            <div>
              <h3 className="font-medium">Price</h3>
              <p>{course.price} {course.currency}</p>
            </div>
            <div>
              <h3 className="font-medium">Duration</h3>
              <p>{course.duration_minutes} minutes</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium">Status</h3>
            <p>{course.is_published ? 'Published' : 'Draft'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseViewPage;

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Save, ArrowLeft } from 'lucide-react';

const editCourseSchema = z.object({
  title: z.string().min(1, 'Course title is required').max(100),
  short_description: z.string().min(1).max(200),
  description: z.string().min(1),
  category: z.string().min(1),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.number().min(0),
  currency: z.string(),
  duration_minutes: z.number().min(1),
  is_published: z.boolean(),
});

type EditCourseFormData = z.infer<typeof editCourseSchema>;

const categories = [
  'Technology',
  'Business',
  'Design',
  'Marketing',
  'Personal Development',
  'Health & Fitness',
  'Music',
  'Language',
  'Photography',
  'Other'
];

const levels = ['beginner', 'intermediate', 'advanced'];

const EditCourseForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [course, setCourse] = useState<EditCourseFormData | null>(null);

  const form = useForm<EditCourseFormData>({
    resolver: zodResolver(editCourseSchema),
  });

  useEffect(() => {
    const fetchCourse = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching course:', error);
        toast({
          title: 'Error',
          description: 'Failed to load course data',
          variant: 'destructive',
        });
        return;
      }

      if (data.instructor_id !== user?.id) {
        navigate('/instructor/dashboard');
        return;
      }

      setCourse({
        title: data.title,
        short_description: data.short_description,
        description: data.description,
        category: data.category,
        level: data.level as 'beginner' | 'intermediate' | 'advanced',
        price: data.price,
        currency: data.currency,
        duration_minutes: data.duration_minutes,
        is_published: data.is_published
      });
      form.reset({
        title: data.title,
        short_description: data.short_description,
        description: data.description,
        category: data.category,
        level: data.level as 'beginner' | 'intermediate' | 'advanced',
        price: data.price,
        currency: data.currency,
        duration_minutes: data.duration_minutes,
        is_published: data.is_published
      });
    };

    fetchCourse();
  }, [id]);

  const onSubmit = async (data: EditCourseFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Course Updated',
        description: 'Your changes have been saved',
      });
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to update course',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!course) return <div>Loading...</div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Same form fields as CreateCourseForm but with existing values */}
        {/* ... */}
        
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/instructor/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditCourseForm;

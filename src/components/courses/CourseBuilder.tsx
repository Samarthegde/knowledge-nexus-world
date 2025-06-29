
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Video, FileText, File, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const contentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content_type: z.enum(['video', 'pdf', 'text']),
  content_url: z.string().url().optional().or(z.literal('')),
  text_content: z.string().optional(),
  is_free: z.boolean(),
  duration_minutes: z.number().min(0),
});

type ContentFormData = z.infer<typeof contentSchema>;

interface CourseContent {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  content_url: string | null;
  text_content: string | null;
  order_index: number;
  is_free: boolean;
  duration_minutes: number | null;
}

const CourseBuilder = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState(null);
  const [content, setContent] = useState<CourseContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<CourseContent | null>(null);

  const form = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: '',
      description: '',
      content_type: 'text',
      content_url: '',
      text_content: '',
      is_free: false,
      duration_minutes: 0,
    },
  });

  useEffect(() => {
    if (id) {
      fetchCourseAndContent();
    }
  }, [id]);

  const fetchCourseAndContent = async () => {
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;

      if (courseData.instructor_id !== user?.id) {
        toast({
          title: 'Access Denied',
          description: 'You can only edit your own courses',
          variant: 'destructive',
        });
        return;
      }

      setCourse(courseData);

      // Fetch course content
      const { data: contentData, error: contentError } = await supabase
        .from('course_content')
        .select('*')
        .eq('course_id', id)
        .order('order_index');

      if (contentError) throw contentError;

      setContent(contentData || []);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ContentFormData) => {
    try {
      const contentData = {
        course_id: id,
        title: data.title,
        description: data.description || null,
        content_type: data.content_type,
        content_url: data.content_url || null,
        text_content: data.text_content || null,
        is_free: data.is_free,
        duration_minutes: data.duration_minutes,
        order_index: editingContent ? editingContent.order_index : content.length,
      };

      if (editingContent) {
        const { error } = await supabase
          .from('course_content')
          .update(contentData)
          .eq('id', editingContent.id);

        if (error) throw error;

        toast({
          title: 'Content Updated',
          description: 'Course content has been updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('course_content')
          .insert(contentData);

        if (error) throw error;

        toast({
          title: 'Content Added',
          description: 'New course content has been added successfully',
        });
      }

      setIsDialogOpen(false);
      setEditingContent(null);
      form.reset();
      fetchCourseAndContent();
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: 'Error',
        description: 'Failed to save course content',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (contentItem: CourseContent) => {
    setEditingContent(contentItem);
    form.reset({
      title: contentItem.title,
      description: contentItem.description || '',
      content_type: contentItem.content_type as 'video' | 'pdf' | 'text',
      content_url: contentItem.content_url || '',
      text_content: contentItem.text_content || '',
      is_free: contentItem.is_free,
      duration_minutes: contentItem.duration_minutes || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('course_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      toast({
        title: 'Content Deleted',
        description: 'Course content has been deleted successfully',
      });

      fetchCourseAndContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete course content',
        variant: 'destructive',
      });
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'pdf':
        return <File className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Course Builder: {course?.title}</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingContent(null);
              form.reset();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingContent ? 'Edit Content' : 'Add New Content'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Content title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Content description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('content_type') !== 'text' && (
                  <FormField
                    control={form.control}
                    name="content_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch('content_type') === 'text' && (
                  <FormField
                    control={form.control}
                    name="text_content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Text Content</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your text content here..."
                            className="min-h-[200px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="duration_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_free"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Free Content</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Make this content available for free
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingContent ? 'Update Content' : 'Add Content'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {content.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 mb-4">No content added yet</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Content
              </Button>
            </CardContent>
          </Card>
        ) : (
          content.map((item, index) => (
            <Card key={item.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center space-x-2">
                  {getContentIcon(item.content_type)}
                  <span>{item.title}</span>
                  {item.is_free && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      FREE
                    </span>
                  )}
                </CardTitle>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {item.description && (
                  <p className="text-gray-600 mb-2">{item.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Type: {item.content_type.toUpperCase()}</span>
                  {item.duration_minutes && item.duration_minutes > 0 && (
                    <span>Duration: {item.duration_minutes} min</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CourseBuilder;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, Unlock, Lock, Save, Trash2, Calendar, CheckCircle } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type CourseContent = Tables<'course_content'>;
type ContentSchedule = Tables<'content_schedule'>;

interface ContentWithSchedule extends CourseContent {
  schedule?: ContentSchedule;
  prerequisite_title?: string;
}

const DripContentManager = () => {
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [courseContent, setCourseContent] = useState<ContentWithSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    if (!courseId) return;

    try {
      // Fetch content with schedule information
      const { data: contentData, error: contentError } = await supabase
        .from('course_content')
        .select(`
          *,
          content_schedule!content_schedule_content_id_fkey(
            id,
            unlock_after_days,
            unlock_after_content_id,
            created_at
          )
        `)
        .eq('course_id', courseId)
        .order('order_index');

      if (contentError) throw contentError;

      // Fetch prerequisite titles
      const contentWithSchedules = await Promise.all(
        (contentData || []).map(async (content: any) => {
          let prerequisite_title = null;
          
          if (content.content_schedule?.unlock_after_content_id) {
            const { data: prereqData } = await supabase
              .from('course_content')
              .select('title')
              .eq('id', content.content_schedule.unlock_after_content_id)
              .single();
            
            prerequisite_title = prereqData?.title;
          }

          return {
            ...content,
            schedule: content.content_schedule,
            prerequisite_title
          };
        })
      );

      setCourseContent(contentWithSchedules);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addContentSchedule = async (contentId: string, unlockAfterDays: number, unlockAfterContentId?: string) => {
    try {
      const { error } = await supabase
        .from('content_schedule')
        .insert({
          course_id: courseId!,
          content_id: contentId,
          unlock_after_days: unlockAfterDays,
          unlock_after_content_id: unlockAfterContentId || null
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Content schedule added successfully'
      });

      fetchData();
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to add content schedule',
        variant: 'destructive'
      });
    }
  };

  const removeContentSchedule = async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from('content_schedule')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Content schedule removed successfully'
      });

      fetchData();
    } catch (error) {
      console.error('Error removing schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove content schedule',
        variant: 'destructive'
      });
    }
  };

  const getContentStatus = (content: ContentWithSchedule) => {
    if (!content.schedule) {
      return { status: 'immediate', color: 'default', icon: Unlock };
    }
    
    if (content.schedule.unlock_after_days && content.schedule.unlock_after_days > 0) {
      return { 
        status: `${content.schedule.unlock_after_days} days`, 
        color: 'secondary', 
        icon: Clock 
      };
    }
    
    if (content.schedule.unlock_after_content_id) {
      return { 
        status: 'after prerequisite', 
        color: 'outline', 
        icon: CheckCircle 
      };
    }
    
    return { status: 'scheduled', color: 'secondary', icon: Calendar };
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Drip Content Manager</h2>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <span className="text-sm text-gray-600">
            {courseContent.filter(c => c.schedule).length} scheduled items
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Content Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courseContent.map(content => {
              const status = getContentStatus(content);
              const StatusIcon = status.icon;
              
              return (
                <Card key={content.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{content.title}</h4>
                          <Badge variant={status.color as any} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {content.schedule ? status.status : 'Immediate Access'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          Type: {content.content_type} • Order: {content.order_index + 1}
                        </p>
                        
                        {content.schedule && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                            {content.schedule.unlock_after_days && content.schedule.unlock_after_days > 0 && (
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span>Unlocks {content.schedule.unlock_after_days} days after enrollment</span>
                              </div>
                            )}
                            {content.schedule.unlock_after_content_id && (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>Unlocks after completing: {content.prerequisite_title}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {content.schedule ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeContentSchedule(content.schedule!.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Schedule
                          </Button>
                        ) : (
                          <AddScheduleForm
                            contentId={content.id}
                            courseContent={courseContent}
                            onAdd={addContentSchedule}
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drip Content Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Time-based Release</h4>
              </div>
              <p className="text-sm text-blue-700">
                Set content to unlock after a specific number of days from student enrollment. 
                This helps pace learning and maintain engagement over time.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-900">Prerequisite-based Release</h4>
              </div>
              <p className="text-sm text-green-700">
                Unlock content only after students complete specific prerequisite content. 
                This ensures proper learning progression and mastery of concepts.
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Unlock className="h-5 w-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-900">Immediate Access</h4>
              </div>
              <p className="text-sm text-yellow-700">
                Content without scheduling rules is available immediately upon enrollment. 
                Use this for introductory materials and course overviews.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface AddScheduleFormProps {
  contentId: string;
  courseContent: ContentWithSchedule[];
  onAdd: (contentId: string, unlockAfterDays: number, unlockAfterContentId?: string) => void;
}

const AddScheduleForm: React.FC<AddScheduleFormProps> = ({ contentId, courseContent, onAdd }) => {
  const [scheduleType, setScheduleType] = useState<'days' | 'content'>('days');
  const [days, setDays] = useState('0');
  const [prerequisiteContentId, setPrerequisiteContentId] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = () => {
    if (scheduleType === 'days') {
      const numDays = parseInt(days);
      if (numDays >= 0) {
        onAdd(contentId, numDays);
        setShowForm(false);
        setDays('0');
      }
    } else if (scheduleType === 'content' && prerequisiteContentId) {
      onAdd(contentId, 0, prerequisiteContentId);
      setShowForm(false);
      setPrerequisiteContentId('');
    }
  };

  if (!showForm) {
    return (
      <Button size="sm" onClick={() => setShowForm(true)}>
        <Clock className="h-4 w-4 mr-2" />
        Add Schedule
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-lg min-w-[320px] bg-white shadow-sm">
      <Select value={scheduleType} onValueChange={(value) => setScheduleType(value as 'days' | 'content')}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="days">Unlock after X days</SelectItem>
          <SelectItem value="content">Unlock after content</SelectItem>
        </SelectContent>
      </Select>

      {scheduleType === 'days' && (
        <div>
          <label className="text-sm font-medium mb-1 block">Days after enrollment</label>
          <Input
            type="number"
            min="0"
            placeholder="0"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          />
        </div>
      )}

      {scheduleType === 'content' && (
        <div>
          <label className="text-sm font-medium mb-1 block">Prerequisite content</label>
          <Select value={prerequisiteContentId} onValueChange={setPrerequisiteContentId}>
            <SelectTrigger>
              <SelectValue placeholder="Select prerequisite content" />
            </SelectTrigger>
            <SelectContent>
              {courseContent
                .filter(c => c.id !== contentId)
                .map(content => (
                  <SelectItem key={content.id} value={content.id}>
                    {content.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit}>
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default DripContentManager;
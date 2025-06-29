
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
import { Clock, Unlock, Lock, Save, Trash2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type CourseContent = Tables<'course_content'>;
type ContentSchedule = Tables<'content_schedule'>;

const DripContentManager = () => {
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [courseContent, setCourseContent] = useState<CourseContent[]>([]);
  const [schedules, setSchedules] = useState<ContentSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    if (!courseId) return;

    // Fetch content
    const { data: contentData, error: contentError } = await supabase
      .from('course_content')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');

    if (contentError) {
      console.error('Error fetching content:', contentError);
      return;
    }

    setCourseContent(contentData || []);

    // Fetch schedules
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('content_schedule')
      .select(`
        *,
        course_content!content_schedule_content_id_fkey(title),
        unlockContent:course_content!content_schedule_unlock_after_content_id_fkey(title)
      `)
      .eq('course_id', courseId);

    if (scheduleError) {
      console.error('Error fetching schedules:', scheduleError);
      return;
    }

    setSchedules(scheduleData || []);
    setLoading(false);
  };

  const addContentSchedule = async (contentId: string, unlockAfterDays: number, unlockAfterContentId?: string) => {
    const { error } = await supabase
      .from('content_schedule')
      .insert({
        course_id: courseId!,
        content_id: contentId,
        unlock_after_days: unlockAfterDays,
        unlock_after_content_id: unlockAfterContentId || null
      });

    if (error) {
      console.error('Error adding schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to add content schedule',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Content schedule added successfully'
    });

    fetchData();
  };

  const removeContentSchedule = async (scheduleId: string) => {
    const { error } = await supabase
      .from('content_schedule')
      .delete()
      .eq('id', scheduleId);

    if (error) {
      console.error('Error removing schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove content schedule',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Content schedule removed successfully'
    });

    fetchData();
  };

  const getScheduleForContent = (contentId: string) => {
    return schedules.find(s => s.content_id === contentId);
  };

  const getContentStatus = (content: CourseContent) => {
    const schedule = getScheduleForContent(content.id);
    if (!schedule) {
      return { status: 'immediate', color: 'default' };
    }
    if (schedule.unlock_after_days && schedule.unlock_after_days > 0) {
      return { status: `${schedule.unlock_after_days} days`, color: 'secondary' };
    }
    if (schedule.unlock_after_content_id) {
      return { status: 'after content', color: 'outline' };
    }
    return { status: 'scheduled', color: 'secondary' };
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Drip Content Manager</h2>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <span className="text-sm text-gray-600">{schedules.length} scheduled items</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courseContent.map(content => {
              const schedule = getScheduleForContent(content.id);
              const status = getContentStatus(content);
              
              return (
                <Card key={content.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{content.title}</h4>
                          <Badge variant={status.color as any}>
                            {schedule ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                            {schedule ? status.status : 'Immediate Access'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Type: {content.content_type} • Order: {content.order_index + 1}
                        </p>
                        
                        {schedule && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            {schedule.unlock_after_days && schedule.unlock_after_days > 0 && (
                              <p>Unlocks {schedule.unlock_after_days} days after enrollment</p>
                            )}
                            {schedule.unlock_after_content_id && (
                              <p>Unlocks after completing: {schedule.unlockContent?.title}</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {schedule ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeContentSchedule(schedule.id)}
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
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Time-based Release</h4>
              <p className="text-sm text-blue-700">
                Set content to unlock after a specific number of days from student enrollment. 
                This helps pace learning and maintain engagement over time.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Prerequisite-based Release</h4>
              <p className="text-sm text-green-700">
                Unlock content only after students complete specific prerequisite content. 
                This ensures proper learning progression and mastery of concepts.
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Immediate Access</h4>
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
  courseContent: CourseContent[];
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
    <div className="flex flex-col gap-2 p-3 border rounded min-w-[300px]">
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
        <Input
          type="number"
          min="0"
          placeholder="Days"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        />
      )}

      {scheduleType === 'content' && (
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

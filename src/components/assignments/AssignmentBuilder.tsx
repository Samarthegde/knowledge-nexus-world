import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, Calendar, FileText } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Assignment = Tables<'assignments'>;
type CourseModule = Tables<'course_modules'>;

const AssignmentBuilder = () => {
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);

  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    instructions: '',
    max_score: 100,
    due_date: '',
    module_id: null as string | null
  });

  useEffect(() => {
    fetchAssignments();
    fetchModules();
  }, [courseId]);

  const fetchAssignments = async () => {
    if (!courseId) return;

    const { data, error } = await supabase
      .from('assignments')
      .select('*, course_modules(title)')
      .eq('course_id', courseId)
      .order('order_index');

    if (error) {
      console.error('Error fetching assignments:', error);
      return;
    }

    setAssignments(data || []);
    setLoading(false);
  };

  const fetchModules = async () => {
    if (!courseId) return;

    const { data, error } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');

    if (error) {
      console.error('Error fetching modules:', error);
      return;
    }

    setModules(data || []);
  };

  const createAssignment = async () => {
    if (!courseId || !user) return;

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        ...assignmentForm,
        course_id: courseId,
        due_date: assignmentForm.due_date || null,
        order_index: assignments.length
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to create assignment',
        variant: 'destructive'
      });
      return;
    }

    setAssignments([...assignments, data]);
    setAssignmentForm({
      title: '',
      description: '',
      instructions: '',
      max_score: 100,
      due_date: '',
      module_id: null
    });

    toast({
      title: 'Success',
      description: 'Assignment created successfully'
    });
  };

  const resetForm = () => {
    setAssignmentForm({
      title: '',
      description: '',
      instructions: '',
      max_score: 100,
      due_date: '',
      module_id: null
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Assignment Builder</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Assignment Title"
              value={assignmentForm.title}
              onChange={(e) => setAssignmentForm({...assignmentForm, title: e.target.value})}
            />

            <Textarea
              placeholder="Assignment Description"
              value={assignmentForm.description}
              onChange={(e) => setAssignmentForm({...assignmentForm, description: e.target.value})}
            />

            <Textarea
              placeholder="Detailed Instructions"
              className="min-h-[120px]"
              value={assignmentForm.instructions}
              onChange={(e) => setAssignmentForm({...assignmentForm, instructions: e.target.value})}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Max Score</label>
                <Input
                  type="number"
                  value={assignmentForm.max_score}
                  onChange={(e) => setAssignmentForm({...assignmentForm, max_score: parseInt(e.target.value) || 100})}
                />
              </div>
              <div>
                <label className="text-sm">Due Date</label>
                <Input
                  type="datetime-local"
                  value={assignmentForm.due_date}
                  onChange={(e) => setAssignmentForm({...assignmentForm, due_date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-sm">Module (Optional)</label>
              <Select
                value={assignmentForm.module_id || 'none'}
                onValueChange={(value) => setAssignmentForm({...assignmentForm, module_id: value === 'none' ? null : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Module</SelectItem>
                  {modules.map(module => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={createAssignment} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
              <Button onClick={resetForm} variant="outline">
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assignments List */}
        <Card>
          <CardHeader>
            <CardTitle>Course Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No assignments created yet</p>
            ) : (
              assignments.map(assignment => (
                <Card key={assignment.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{assignment.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {assignment.max_score} points
                          </span>
                          {assignment.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {new Date(assignment.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssignmentBuilder;
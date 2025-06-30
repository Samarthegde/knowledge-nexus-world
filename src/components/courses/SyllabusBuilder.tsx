import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, Trash2, BookOpen } from 'lucide-react';

interface SyllabusItem {
  id: string;
  title: string;
  description: string;
  learningObjectives: string[];
  estimatedDuration: string;
}

interface Syllabus {
  overview: string;
  prerequisites: string[];
  learningOutcomes: string[];
  items: SyllabusItem[];
}

const SyllabusBuilder = () => {
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [syllabus, setSyllabus] = useState<Syllabus>({
    overview: '',
    prerequisites: [],
    learningOutcomes: [],
    items: []
  });
  const [loading, setLoading] = useState(true);
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newOutcome, setNewOutcome] = useState('');

  useEffect(() => {
    fetchSyllabus();
  }, [courseId]);

  const fetchSyllabus = async () => {
    if (!courseId) return;

    const { data, error } = await supabase
      .from('courses')
      .select('syllabus')
      .eq('id', courseId)
      .single();

    if (error) {
      console.error('Error fetching syllabus:', error);
      return;
    }

    if (data?.syllabus) {
      // Safely parse the JSON data with proper type checking
      try {
        const parsedSyllabus = data.syllabus as unknown as Syllabus;
        if (parsedSyllabus && typeof parsedSyllabus === 'object') {
          setSyllabus({
            overview: parsedSyllabus.overview || '',
            prerequisites: Array.isArray(parsedSyllabus.prerequisites) ? parsedSyllabus.prerequisites : [],
            learningOutcomes: Array.isArray(parsedSyllabus.learningOutcomes) ? parsedSyllabus.learningOutcomes : [],
            items: Array.isArray(parsedSyllabus.items) ? parsedSyllabus.items : []
          });
        }
      } catch (err) {
        console.error('Error parsing syllabus data:', err);
      }
    }
    setLoading(false);
  };

  const saveSyllabus = async () => {
    if (!courseId) return;

    // Convert Syllabus to JSON-compatible format
    const syllabusData = {
      overview: syllabus.overview,
      prerequisites: syllabus.prerequisites,
      learningOutcomes: syllabus.learningOutcomes,
      items: syllabus.items
    };

    const { error } = await supabase
      .from('courses')
      .update({ syllabus: syllabusData as any })
      .eq('id', courseId);

    if (error) {
      console.error('Error saving syllabus:', error);
      toast({
        title: 'Error',
        description: 'Failed to save syllabus',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Syllabus saved successfully'
    });
  };

  const addPrerequisite = () => {
    if (newPrerequisite.trim()) {
      setSyllabus({
        ...syllabus,
        prerequisites: [...syllabus.prerequisites, newPrerequisite.trim()]
      });
      setNewPrerequisite('');
    }
  };

  const removePrerequisite = (index: number) => {
    setSyllabus({
      ...syllabus,
      prerequisites: syllabus.prerequisites.filter((_, i) => i !== index)
    });
  };

  const addLearningOutcome = () => {
    if (newOutcome.trim()) {
      setSyllabus({
        ...syllabus,
        learningOutcomes: [...syllabus.learningOutcomes, newOutcome.trim()]
      });
      setNewOutcome('');
    }
  };

  const removeLearningOutcome = (index: number) => {
    setSyllabus({
      ...syllabus,
      learningOutcomes: syllabus.learningOutcomes.filter((_, i) => i !== index)
    });
  };

  const addSyllabusItem = () => {
    const newItem: SyllabusItem = {
      id: Date.now().toString(),
      title: '',
      description: '',
      learningObjectives: [],
      estimatedDuration: ''
    };
    setSyllabus({
      ...syllabus,
      items: [...syllabus.items, newItem]
    });
  };

  const updateSyllabusItem = (index: number, field: keyof SyllabusItem, value: any) => {
    const updatedItems = [...syllabus.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setSyllabus({ ...syllabus, items: updatedItems });
  };

  const removeSyllabusItem = (index: number) => {
    setSyllabus({
      ...syllabus,
      items: syllabus.items.filter((_, i) => i !== index)
    });
  };

  if (loading) return <div>Loading syllabus...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Course Syllabus
        </h2>
        <Button onClick={saveSyllabus}>
          <Save className="h-4 w-4 mr-2" />
          Save Syllabus
        </Button>
      </div>

      {/* Course Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Course Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Provide a comprehensive overview of the course..."
            value={syllabus.overview}
            onChange={(e) => setSyllabus({ ...syllabus, overview: e.target.value })}
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle>Prerequisites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a prerequisite..."
              value={newPrerequisite}
              onChange={(e) => setNewPrerequisite(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPrerequisite()}
            />
            <Button onClick={addPrerequisite}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {syllabus.prerequisites.map((prereq, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>{prereq}</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removePrerequisite(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Outcomes */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Outcomes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a learning outcome..."
              value={newOutcome}
              onChange={(e) => setNewOutcome(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addLearningOutcome()}
            />
            <Button onClick={addLearningOutcome}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {syllabus.learningOutcomes.map((outcome, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>{outcome}</span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeLearningOutcome(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Syllabus Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Course Content</CardTitle>
            <Button onClick={addSyllabusItem} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {syllabus.items.map((item, index) => (
            <Card key={item.id}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold">Section {index + 1}</h3>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeSyllabusItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <Input
                  placeholder="Section title..."
                  value={item.title}
                  onChange={(e) => updateSyllabusItem(index, 'title', e.target.value)}
                />
                
                <Textarea
                  placeholder="Section description..."
                  value={item.description}
                  onChange={(e) => updateSyllabusItem(index, 'description', e.target.value)}
                />
                
                <Input
                  placeholder="Estimated duration (e.g., 2 hours, 30 minutes)..."
                  value={item.estimatedDuration}
                  onChange={(e) => updateSyllabusItem(index, 'estimatedDuration', e.target.value)}
                />
              </CardContent>
            </Card>
          ))}
          
          {syllabus.items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No content sections added yet. Click "Add Section" to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SyllabusBuilder;

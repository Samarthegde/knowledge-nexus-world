
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save, BookOpen, Loader2 } from 'lucide-react';
import SyllabusOverview from './syllabus/SyllabusOverview';
import PrerequisitesList from './syllabus/PrerequisitesList';
import LearningOutcomesList from './syllabus/LearningOutcomesList';
import SyllabusContentSections from './syllabus/SyllabusContentSections';

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
  const [saving, setSaving] = useState(false);

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
    setSaving(true);

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
    } else {
      toast({
        title: 'Success',
        description: 'Syllabus saved successfully',
        variant: 'default'
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading syllabus...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Syllabus</h1>
            <p className="text-gray-600 mt-1">Structure your course content and learning outcomes</p>
          </div>
        </div>
        <Button 
          onClick={saveSyllabus} 
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Syllabus
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-8">
        <SyllabusOverview
          overview={syllabus.overview}
          onChange={(overview) => setSyllabus({ ...syllabus, overview })}
        />

        <div className="grid gap-8 md:grid-cols-2">
          <PrerequisitesList
            prerequisites={syllabus.prerequisites}
            onChange={(prerequisites) => setSyllabus({ ...syllabus, prerequisites })}
          />

          <LearningOutcomesList
            learningOutcomes={syllabus.learningOutcomes}
            onChange={(learningOutcomes) => setSyllabus({ ...syllabus, learningOutcomes })}
          />
        </div>

        <SyllabusContentSections
          items={syllabus.items}
          onChange={(items) => setSyllabus({ ...syllabus, items })}
        />
      </div>
    </div>
  );
};

export default SyllabusBuilder;

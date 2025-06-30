import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, Trash2, GripVertical, Edit2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Section = Tables<'sections'>;

interface SectionWithDescription extends Section {
  description?: string;
}

const SectionManager = () => {
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sections, setSections] = useState<SectionWithDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [newSection, setNewSection] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchSections();
  }, [courseId]);

  const fetchSections = async () => {
    if (!courseId) return;

    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');

    if (error) {
      console.error('Error fetching sections:', error);
      return;
    }

    // Add description field for compatibility
    const sectionsWithDescription = (data || []).map(section => ({
      ...section,
      description: '' // Default empty description since it doesn't exist in DB yet
    }));

    setSections(sectionsWithDescription);
    setLoading(false);
  };

  const createSection = async () => {
    if (!courseId || !user || !newSection.title.trim()) return;

    const { data, error } = await supabase
      .from('sections')
      .insert({
        course_id: courseId,
        title: newSection.title,
        order_index: sections.length
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating section:', error);
      toast({
        title: 'Error',
        description: 'Failed to create section',
        variant: 'destructive'
      });
      return;
    }

    setSections([...sections, { ...data, description: '' }]);
    setNewSection({ title: '', description: '' });
    toast({
      title: 'Success',
      description: 'Section created successfully'
    });
  };

  const updateSection = async (sectionId: string, updates: Partial<SectionWithDescription>) => {
    // Only update fields that exist in the database
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.order_index !== undefined) dbUpdates.order_index = updates.order_index;

    const { error } = await supabase
      .from('sections')
      .update(dbUpdates)
      .eq('id', sectionId);

    if (error) {
      console.error('Error updating section:', error);
      toast({
        title: 'Error',
        description: 'Failed to update section',
        variant: 'destructive'
      });
      return;
    }

    setSections(sections.map(s => s.id === sectionId ? { ...s, ...updates } : s));
    setEditingSection(null);
    toast({
      title: 'Success',
      description: 'Section updated successfully'
    });
  };

  const deleteSection = async (sectionId: string) => {
    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', sectionId);

    if (error) {
      console.error('Error deleting section:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete section',
        variant: 'destructive'
      });
      return;
    }

    setSections(sections.filter(s => s.id !== sectionId));
    toast({
      title: 'Success',
      description: 'Section deleted successfully'
    });
  };

  if (loading) return <div>Loading sections...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Course Sections</h2>
      </div>

      {/* Create New Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Section Title"
            value={newSection.title}
            onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
          />
          <Textarea
            placeholder="Section Description (optional - not saved to database yet)"
            value={newSection.description}
            onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
            disabled
          />
          <Button onClick={createSection} disabled={!newSection.title.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </CardContent>
      </Card>

      {/* Existing Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <Card key={section.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <GripVertical className="h-5 w-5 text-gray-400 mt-1 cursor-move" />
                  <div className="flex-1">
                    {editingSection === section.id ? (
                      <div className="space-y-3">
                        <Input
                          value={section.title}
                          onChange={(e) => setSections(sections.map(s => 
                            s.id === section.id ? { ...s, title: e.target.value } : s
                          ))}
                        />
                        <Textarea
                          placeholder="Description (not saved to database yet)"
                          value={section.description || ''}
                          onChange={(e) => setSections(sections.map(s => 
                            s.id === section.id ? { ...s, description: e.target.value } : s
                          ))}
                          disabled
                        />
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => updateSection(section.id, {
                              title: section.title
                            })}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingSection(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-semibold text-lg">{section.title}</h3>
                        <p className="text-sm text-gray-500 mt-2">
                          Order: {section.order_index + 1}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {editingSection !== section.id && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingSection(section.id)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteSection(section.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sections.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">No sections created yet. Add your first section above.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SectionManager;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, BookOpen, Clock } from 'lucide-react';

interface SyllabusItem {
  id: string;
  title: string;
  description: string;
  learningObjectives: string[];
  estimatedDuration: string;
}

interface SyllabusContentSectionsProps {
  items: SyllabusItem[];
  onChange: (items: SyllabusItem[]) => void;
}

const SyllabusContentSections = ({ items, onChange }: SyllabusContentSectionsProps) => {
  const addSyllabusItem = () => {
    const newItem: SyllabusItem = {
      id: Date.now().toString(),
      title: '',
      description: '',
      learningObjectives: [],
      estimatedDuration: ''
    };
    onChange([...items, newItem]);
  };

  const updateSyllabusItem = (index: number, field: keyof SyllabusItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    onChange(updatedItems);
  };

  const removeSyllabusItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <Card className="shadow-sm border-l-4 border-l-purple-500">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-purple-600" />
            Course Content Sections
          </CardTitle>
          <Button 
            onClick={addSyllabusItem} 
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map((item, index) => (
          <Card key={item.id} className="border border-gray-200 bg-gray-50/50">
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-700">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Section {index + 1}</h3>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeSyllabusItem(index)}
                  className="text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid gap-4">
                <Input
                  placeholder="Section title (e.g., Introduction to React Fundamentals)..."
                  value={item.title}
                  onChange={(e) => updateSyllabusItem(index, 'title', e.target.value)}
                  className="font-medium"
                />
                
                <Textarea
                  placeholder="Section description and key topics covered..."
                  value={item.description}
                  onChange={(e) => updateSyllabusItem(index, 'description', e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Estimated duration (e.g., 2 hours, 45 minutes)..."
                    value={item.estimatedDuration}
                    onChange={(e) => updateSyllabusItem(index, 'estimatedDuration', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {items.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No content sections added yet</p>
            <p className="text-sm">Click "Add Section" to start building your course structure</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SyllabusContentSections;

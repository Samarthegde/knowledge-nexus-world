
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, CheckCircle } from 'lucide-react';

interface PrerequisitesListProps {
  prerequisites: string[];
  onChange: (prerequisites: string[]) => void;
}

const PrerequisitesList = ({ prerequisites, onChange }: PrerequisitesListProps) => {
  const [newPrerequisite, setNewPrerequisite] = useState('');

  const addPrerequisite = () => {
    if (newPrerequisite.trim()) {
      onChange([...prerequisites, newPrerequisite.trim()]);
      setNewPrerequisite('');
    }
  };

  const removePrerequisite = (index: number) => {
    onChange(prerequisites.filter((_, i) => i !== index));
  };

  return (
    <Card className="shadow-sm border-l-4 border-l-amber-500">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle className="h-5 w-5 text-amber-600" />
          Prerequisites
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add a prerequisite (e.g., Basic understanding of JavaScript)..."
            value={newPrerequisite}
            onChange={(e) => setNewPrerequisite(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addPrerequisite()}
            className="flex-1"
          />
          <Button 
            onClick={addPrerequisite}
            className="px-4 bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {prerequisites.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {prerequisites.map((prereq, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="flex items-center gap-2 py-2 px-3 text-sm"
              >
                <span>{prereq}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removePrerequisite(index)}
                  className="h-4 w-4 p-0 hover:bg-red-100"
                >
                  <X className="h-3 w-3 text-red-500" />
                </Button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No prerequisites added yet</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PrerequisitesList;

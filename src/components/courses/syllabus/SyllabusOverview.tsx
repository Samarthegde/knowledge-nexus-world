
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';

interface SyllabusOverviewProps {
  overview: string;
  onChange: (overview: string) => void;
}

const SyllabusOverview = ({ overview, onChange }: SyllabusOverviewProps) => {
  return (
    <Card className="shadow-sm border-l-4 border-l-blue-500">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-blue-600" />
          Course Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Provide a comprehensive overview of the course, including what students will learn, the teaching approach, and key outcomes..."
          value={overview}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[120px] resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </CardContent>
    </Card>
  );
};

export default SyllabusOverview;

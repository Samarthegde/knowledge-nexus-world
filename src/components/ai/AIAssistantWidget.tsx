import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, X, MessageSquare } from 'lucide-react';
import AILearningAssistant from './AILearningAssistant';

interface AIAssistantWidgetProps {
  courseId?: string;
  currentLesson?: string;
  studentProgress?: number;
}

const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({
  courseId,
  currentLesson,
  studentProgress
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Bot className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] shadow-2xl rounded-lg overflow-hidden">
          <div className="relative h-full">
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 h-8 w-8 p-0 bg-white/80 hover:bg-white"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <AILearningAssistant
              courseId={courseId}
              currentLesson={currentLesson}
              studentProgress={studentProgress}
              className="h-full border-0 shadow-none"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistantWidget;
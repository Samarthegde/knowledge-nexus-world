import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, HelpCircle, FileText, Award, Clock, Layers, FileImage, TrendingUp, Bot } from 'lucide-react';
import QuizBuilder from '@/components/quizzes/QuizBuilder';
import AssignmentBuilder from '@/components/assignments/AssignmentBuilder';
import GradingInterface from '@/components/grading/GradingInterface';
import EnhancedCertificateManager from '@/components/certificates/EnhancedCertificateManager';
import DripContentManager from '@/components/content/DripContentManager';
import SectionManager from './SectionManager';
import SyllabusBuilder from './SyllabusBuilder';
import ProgressTracker from '@/components/instructor/ProgressTracker';
import AISettingsManager from './AISettingsManager';

const EnhancedCourseBuilder = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Enhanced Course Builder</h1>
      </div>

      <Tabs defaultValue="sections" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="syllabus" className="flex items-center gap-2">
            <FileImage className="h-4 w-4" />
            Syllabus
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Quizzes
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="grading" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Grading
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Certificates
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="drip-content" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Drip Content
          </TabsTrigger>
          <TabsTrigger value="ai-settings" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle>Course Sections Management</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="syllabus">
          <Card>
            <CardHeader>
              <CardTitle>Syllabus Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <SyllabusBuilder />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Management</CardTitle>
            </CardHeader>
            <CardContent>
              <QuizBuilder />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Management</CardTitle>
            </CardHeader>
            <CardContent>
              <AssignmentBuilder />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grading">
          <Card>
            <CardHeader>
              <CardTitle>Grading Center</CardTitle>
            </CardHeader>
            <CardContent>
              <GradingInterface />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Certificate Management</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedCertificateManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Student Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressTracker />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drip-content">
          <Card>
            <CardHeader>
              <CardTitle>Content Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <DripContentManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-settings">
          <Card>
            <CardHeader>
              <CardTitle>AI Assistant Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <AISettingsManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedCourseBuilder;
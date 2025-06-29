
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, HelpCircle, FileText, Award, Clock } from 'lucide-react';
import QuizBuilder from '@/components/quizzes/QuizBuilder';
import AssignmentBuilder from '@/components/assignments/AssignmentBuilder';
import GradingInterface from '@/components/grading/GradingInterface';
import CertificateManager from '@/components/certificates/CertificateManager';
import DripContentManager from '@/components/content/DripContentManager';

const CourseBuilder = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Course Builder</h1>
      </div>

      <Tabs defaultValue="quizzes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="drip-content" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Drip Content
          </TabsTrigger>
        </TabsList>

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
              <CardTitle>Certificate Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CertificateManager />
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
      </Tabs>
    </div>
  );
};

export default CourseBuilder;


import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, Eye, Download } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Assignment = Tables<'assignments'>;
type AssignmentSubmission = Tables<'assignment_submissions'>;
type QuizAttempt = Tables<'quiz_attempts'>;

interface SubmissionWithDetails extends AssignmentSubmission {
  assignment_title?: string;
  student_name?: string;
  student_email?: string;
}

interface QuizAttemptWithDetails extends QuizAttempt {
  quiz_title?: string;
  student_name?: string;
  student_email?: string;
}

const GradingInterface = () => {
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttemptWithDetails[]>([]);
  const [selectedType, setSelectedType] = useState<'assignments' | 'quizzes'>('assignments');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [courseId, selectedType]);

  const fetchData = async () => {
    if (!courseId) return;

    if (selectedType === 'assignments') {
      await fetchAssignments();
    } else {
      await fetchQuizAttempts();
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (assignmentError) throw assignmentError;
      setAssignments(assignmentData || []);

      if (assignmentData && assignmentData.length > 0) {
        const assignmentIds = assignmentData.map(a => a.id);
        
        const { data: submissionData, error: submissionError } = await supabase
          .from('assignment_submissions')
          .select('*')
          .in('assignment_id', assignmentIds)
          .order('submitted_at', { ascending: false });

        if (submissionError) throw submissionError;

        // Enrich submissions with assignment and student data
        const enrichedSubmissions = await Promise.all(
          (submissionData || []).map(async (submission) => {
            const [assignmentResult, profileResult] = await Promise.all([
              supabase.from('assignments').select('title').eq('id', submission.assignment_id).single(),
              supabase.from('profiles').select('full_name, email').eq('id', submission.student_id).single()
            ]);

            return {
              ...submission,
              assignment_title: assignmentResult.data?.title || 'Assignment',
              student_name: profileResult.data?.full_name || 'Unknown',
              student_email: profileResult.data?.email || ''
            };
          })
        );

        setSubmissions(enrichedSubmissions);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizAttempts = async () => {
    try {
      // First get quizzes for this course
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('id, title')
        .eq('course_id', courseId);

      if (quizError) throw quizError;

      if (quizData && quizData.length > 0) {
        const quizIds = quizData.map(q => q.id);
        
        const { data: attemptData, error: attemptError } = await supabase
          .from('quiz_attempts')
          .select('*')
          .in('quiz_id', quizIds)
          .order('started_at', { ascending: false });

        if (attemptError) throw attemptError;

        // Enrich attempts with quiz and student data
        const enrichedAttempts = await Promise.all(
          (attemptData || []).map(async (attempt) => {
            const [quizResult, profileResult] = await Promise.all([
              supabase.from('quizzes').select('title').eq('id', attempt.quiz_id).single(),
              supabase.from('profiles').select('full_name, email').eq('id', attempt.student_id).single()
            ]);

            return {
              ...attempt,
              quiz_title: quizResult.data?.title || 'Quiz',
              student_name: profileResult.data?.full_name || 'Unknown',
              student_email: profileResult.data?.email || ''
            };
          })
        );

        setQuizAttempts(enrichedAttempts);
      }
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const gradeSubmission = async (submissionId: string, score: number, feedback: string) => {
    const { error } = await supabase
      .from('assignment_submissions')
      .update({
        score,
        feedback,
        graded_at: new Date().toISOString(),
        graded_by: user?.id
      })
      .eq('id', submissionId);

    if (error) {
      console.error('Error grading submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to save grade',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Grade saved successfully'
    });

    fetchAssignments();
  };

  const getStatusBadge = (submission: SubmissionWithDetails) => {
    if (submission.score !== null) {
      return <Badge variant="default">Graded</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getQuizStatusBadge = (attempt: QuizAttemptWithDetails) => {
    if (attempt.passed) {
      return <Badge variant="default">Passed</Badge>;
    } else if (attempt.score !== null) {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="secondary">In Progress</Badge>;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Grading Center</h2>
        <Select value={selectedType} onValueChange={(value) => setSelectedType(value as 'assignments' | 'quizzes')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="assignments">Assignments</SelectItem>
            <SelectItem value="quizzes">Quiz Attempts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedType === 'assignments' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No submissions to grade</p>
              ) : (
                <div className="space-y-4">
                  {submissions.map(submission => (
                    <Card key={submission.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{submission.assignment_title}</h4>
                              {getStatusBadge(submission)}
                            </div>
                            <p className="text-sm text-gray-600">
                              Student: {submission.student_name || submission.student_email}
                            </p>
                            <p className="text-sm text-gray-500">
                              Submitted: {new Date(submission.submitted_at).toLocaleString()}
                            </p>
                            
                            {submission.content && (
                              <div className="mt-3 p-3 bg-gray-50 rounded">
                                <h5 className="font-medium text-sm mb-2">Submission:</h5>
                                <p className="text-sm">{submission.content}</p>
                              </div>
                            )}

                            {submission.file_urls && submission.file_urls.length > 0 && (
                              <div className="mt-3">
                                <h5 className="font-medium text-sm mb-2">Files:</h5>
                                {submission.file_urls.map((url, index) => (
                                  <Button key={index} variant="outline" size="sm" className="mr-2">
                                    <Download className="h-3 w-3 mr-1" />
                                    File {index + 1}
                                  </Button>
                                ))}
                              </div>
                            )}

                            {submission.score === null && (
                              <GradingForm
                                submission={submission}
                                onGrade={gradeSubmission}
                              />
                            )}

                            {submission.score !== null && (
                              <div className="mt-3 p-3 bg-green-50 rounded">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">Grade: {submission.score}/100</span>
                                  <span className="text-sm text-gray-500">
                                    Graded: {submission.graded_at ? new Date(submission.graded_at).toLocaleString() : ''}
                                  </span>
                                </div>
                                {submission.feedback && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium">Feedback:</p>
                                    <p className="text-sm">{submission.feedback}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {selectedType === 'quizzes' && (
        <Card>
          <CardHeader>
            <CardTitle>Quiz Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            {quizAttempts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No quiz attempts to review</p>
            ) : (
              <div className="space-y-4">
                {quizAttempts.map(attempt => (
                  <Card key={attempt.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{attempt.quiz_title}</h4>
                            {getQuizStatusBadge(attempt)}
                          </div>
                          <p className="text-sm text-gray-600">
                            Student: {attempt.student_name || attempt.student_email}
                          </p>
                          <p className="text-sm text-gray-500">
                            Started: {new Date(attempt.started_at).toLocaleString()}
                          </p>
                          {attempt.submitted_at && (
                            <p className="text-sm text-gray-500">
                              Submitted: {new Date(attempt.submitted_at).toLocaleString()}
                            </p>
                          )}
                          {attempt.score !== null && attempt.max_score && (
                            <p className="text-sm font-medium mt-2">
                              Score: {attempt.score}/{attempt.max_score} ({Math.round((attempt.score / attempt.max_score) * 100)}%)
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface GradingFormProps {
  submission: SubmissionWithDetails;
  onGrade: (submissionId: string, score: number, feedback: string) => void;
}

const GradingForm: React.FC<GradingFormProps> = ({ submission, onGrade }) => {
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    const numScore = parseInt(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      return;
    }
    onGrade(submission.id, numScore, feedback);
  };

  return (
    <div className="mt-4 p-4 border rounded space-y-3">
      <h5 className="font-medium">Grade Submission</h5>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Score (0-100)</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="Enter score"
          />
        </div>
        <div className="flex items-end">
          <Button onClick={handleSubmit} disabled={!score}>
            <Save className="h-4 w-4 mr-2" />
            Save Grade
          </Button>
        </div>
      </div>
      <div>
        <label className="text-sm">Feedback (optional)</label>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Provide feedback to the student"
          rows={3}
        />
      </div>
    </div>
  );
};

export default GradingInterface;

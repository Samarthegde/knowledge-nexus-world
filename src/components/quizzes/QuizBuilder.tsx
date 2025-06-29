
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Eye } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Quiz = Tables<'quizzes'>;
type QuizQuestion = Tables<'quiz_questions'>;

interface Question {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'short_answer';
  correct_answer?: string;
  options?: Array<{ text: string; is_correct: boolean }>;
  points: number;
  order_index: number;
}

const QuizBuilder = () => {
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    passing_score: 70,
    max_attempts: 3,
    time_limit_minutes: null as number | null,
    is_published: false
  });

  useEffect(() => {
    fetchQuizzes();
  }, [courseId]);

  const fetchQuizzes = async () => {
    if (!courseId) return;

    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');

    if (error) {
      console.error('Error fetching quizzes:', error);
      return;
    }

    setQuizzes(data || []);
    setLoading(false);
  };

  const fetchQuestions = async (quizId: string) => {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index');

    if (error) {
      console.error('Error fetching questions:', error);
      return;
    }

    const formattedQuestions = data?.map(q => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type as 'multiple_choice' | 'short_answer',
      correct_answer: q.correct_answer || '',
      options: q.options as Array<{ text: string; is_correct: boolean }> || [],
      points: q.points || 1,
      order_index: q.order_index
    })) || [];

    setQuestions(formattedQuestions);
  };

  const createNewQuiz = async () => {
    if (!courseId || !user) return;

    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        ...quizForm,
        course_id: courseId,
        order_index: quizzes.length
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to create quiz',
        variant: 'destructive'
      });
      return;
    }

    setQuizzes([...quizzes, data]);
    setSelectedQuiz(data);
    setQuestions([]);
    toast({
      title: 'Success',
      description: 'Quiz created successfully'
    });
  };

  const updateQuiz = async () => {
    if (!selectedQuiz) return;

    const { error } = await supabase
      .from('quizzes')
      .update(quizForm)
      .eq('id', selectedQuiz.id);

    if (error) {
      console.error('Error updating quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to update quiz',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Quiz updated successfully'
    });
    fetchQuizzes();
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      question_text: '',
      question_type: 'multiple_choice',
      options: [
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ],
      points: 1,
      order_index: questions.length
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, field: 'text' | 'is_correct', value: any) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options![optionIndex] = {
        ...updated[questionIndex].options![optionIndex],
        [field]: value
      };
      
      // If marking as correct, unmark others for multiple choice
      if (field === 'is_correct' && value === true) {
        updated[questionIndex].options!.forEach((opt, idx) => {
          if (idx !== optionIndex) opt.is_correct = false;
        });
      }
    }
    setQuestions(updated);
  };

  const saveQuestions = async () => {
    if (!selectedQuiz) return;

    // Delete existing questions
    await supabase
      .from('quiz_questions')
      .delete()
      .eq('quiz_id', selectedQuiz.id);

    // Insert new questions
    const questionsToInsert = questions.map((q, index) => ({
      quiz_id: selectedQuiz.id,
      question_text: q.question_text,
      question_type: q.question_type,
      correct_answer: q.question_type === 'short_answer' ? q.correct_answer : null,
      options: q.question_type === 'multiple_choice' ? q.options : null,
      points: q.points,
      order_index: index
    }));

    const { error } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert);

    if (error) {
      console.error('Error saving questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to save questions',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Questions saved successfully'
    });
  };

  const selectQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setQuizForm({
      title: quiz.title,
      description: quiz.description || '',
      passing_score: quiz.passing_score || 70,
      max_attempts: quiz.max_attempts || 3,
      time_limit_minutes: quiz.time_limit_minutes,
      is_published: quiz.is_published || false
    });
    fetchQuestions(quiz.id);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quiz Builder</h2>
        <Button onClick={createNewQuiz}>
          <Plus className="h-4 w-4 mr-2" />
          New Quiz
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quiz List */}
        <Card>
          <CardHeader>
            <CardTitle>Course Quizzes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quizzes.map(quiz => (
              <div
                key={quiz.id}
                className={`p-3 rounded cursor-pointer border ${
                  selectedQuiz?.id === quiz.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => selectQuiz(quiz)}
              >
                <div className="font-medium">{quiz.title}</div>
                <div className="text-sm text-gray-500">
                  {quiz.is_published ? 'Published' : 'Draft'}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quiz Settings */}
        {selectedQuiz && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Quiz Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Quiz Title"
                value={quizForm.title}
                onChange={(e) => setQuizForm({...quizForm, title: e.target.value})}
              />
              
              <Textarea
                placeholder="Quiz Description"
                value={quizForm.description}
                onChange={(e) => setQuizForm({...quizForm, description: e.target.value})}
              />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm">Passing Score (%)</label>
                  <Input
                    type="number"
                    value={quizForm.passing_score}
                    onChange={(e) => setQuizForm({...quizForm, passing_score: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-sm">Max Attempts</label>
                  <Input
                    type="number"
                    value={quizForm.max_attempts}
                    onChange={(e) => setQuizForm({...quizForm, max_attempts: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-sm">Time Limit (min)</label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={quizForm.time_limit_minutes || ''}
                    onChange={(e) => setQuizForm({...quizForm, time_limit_minutes: e.target.value ? parseInt(e.target.value) : null})}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={quizForm.is_published}
                  onCheckedChange={(checked) => setQuizForm({...quizForm, is_published: checked as boolean})}
                />
                <label>Published</label>
              </div>

              <Button onClick={updateQuiz}>
                <Save className="h-4 w-4 mr-2" />
                Save Quiz Settings
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Questions Builder */}
      {selectedQuiz && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Questions
              <Button onClick={addQuestion} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, qIndex) => (
              <Card key={qIndex}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-4">
                      <Textarea
                        placeholder="Question text"
                        value={question.question_text}
                        onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                      />

                      <div className="flex gap-4">
                        <Select
                          value={question.question_type}
                          onValueChange={(value) => updateQuestion(qIndex, 'question_type', value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            <SelectItem value="short_answer">Short Answer</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          type="number"
                          placeholder="Points"
                          className="w-24"
                          value={question.points}
                          onChange={(e) => updateQuestion(qIndex, 'points', parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {question.question_type === 'multiple_choice' && question.options && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Answer Options:</label>
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <Checkbox
                            checked={option.is_correct}
                            onCheckedChange={(checked) => updateOption(qIndex, oIndex, 'is_correct', checked)}
                          />
                          <Input
                            placeholder={`Option ${oIndex + 1}`}
                            value={option.text}
                            onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {question.question_type === 'short_answer' && (
                    <div>
                      <label className="text-sm font-medium">Correct Answer:</label>
                      <Input
                        placeholder="Enter the correct answer"
                        value={question.correct_answer || ''}
                        onChange={(e) => updateQuestion(qIndex, 'correct_answer', e.target.value)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {questions.length > 0 && (
              <Button onClick={saveQuestions} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save All Questions
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuizBuilder;

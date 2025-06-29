
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle, XCircle, Play, Send } from 'lucide-react';
import { useQuizAttempts } from '@/hooks/useQuizAttempts';
import { Tables } from '@/integrations/supabase/types';

type Quiz = Tables<'quizzes'>;
type QuizQuestion = Tables<'quiz_questions'>;

interface QuizInterfaceProps {
  courseId: string;
}

const QuizInterface: React.FC<QuizInterfaceProps> = ({ courseId }) => {
  const { toast } = useToast();
  const { 
    quizzes, 
    currentAttempt, 
    loading, 
    startQuizAttempt, 
    submitQuizAttempt, 
    getQuizQuestions, 
    getStudentAttempts 
  } = useQuizAttempts(courseId);

  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentAttempt && selectedQuiz?.time_limit_minutes && timeRemaining !== null) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev !== null && prev <= 0) {
            handleSubmitQuiz();
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentAttempt, selectedQuiz, timeRemaining]);

  const handleStartQuiz = async (quiz: Quiz) => {
    const attempts = await getStudentAttempts(quiz.id);
    
    if (attempts.length >= (quiz.max_attempts || 3)) {
      toast({
        title: 'Maximum attempts reached',
        description: `You have already attempted this quiz ${quiz.max_attempts || 3} times.`,
        variant: 'destructive'
      });
      return;
    }

    const attempt = await startQuizAttempt(quiz.id);
    if (attempt) {
      setSelectedQuiz(quiz);
      const quizQuestions = await getQuizQuestions(quiz.id);
      setQuestions(quizQuestions);
      setAnswers({});
      setQuizStarted(true);
      
      if (quiz.time_limit_minutes) {
        setTimeRemaining(quiz.time_limit_minutes * 60);
      }

      toast({
        title: 'Quiz started',
        description: 'Good luck! Remember to submit before time runs out.'
      });
    }
  };

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz || !currentAttempt) return;

    const result = await submitQuizAttempt(selectedQuiz.id, answers);
    
    if (result) {
      const percentage = Math.round((result.score! / result.max_score!) * 100);
      const passed = result.passed;

      toast({
        title: passed ? 'Quiz Passed!' : 'Quiz Completed',
        description: `Your score: ${result.score}/${result.max_score} (${percentage}%)`,
        variant: passed ? 'default' : 'destructive'
      });

      setQuizStarted(false);
      setSelectedQuiz(null);
      setQuestions([]);
      setAnswers({});
      setTimeRemaining(null);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (loading) return <div>Loading quizzes...</div>;

  if (quizStarted && selectedQuiz && questions.length > 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{selectedQuiz.title}</CardTitle>
              {timeRemaining !== null && (
                <Badge variant={timeRemaining < 300 ? 'destructive' : 'secondary'}>
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTime(timeRemaining)}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Progress: {getAnsweredCount()}/{questions.length} questions answered
            </p>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">
                      {index + 1}. {question.question_text}
                    </h3>
                    <Badge variant="outline">
                      {question.points} {question.points === 1 ? 'point' : 'points'}
                    </Badge>
                  </div>

                  {question.question_type === 'multiple_choice' && question.options && (
                    <RadioGroup 
                      value={answers[question.id] || ''} 
                      onValueChange={(value) => handleAnswerChange(question.id, value)}
                    >
                      {(question.options as Array<{text: string, is_correct: boolean}>).map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.text} id={`${question.id}-${optionIndex}`} />
                          <Label htmlFor={`${question.id}-${optionIndex}`}>
                            {option.text}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {question.question_type === 'short_answer' && (
                    <Input
                      placeholder="Enter your answer"
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {getAnsweredCount() === questions.length ? (
                  <span className="text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    All questions answered
                  </span>
                ) : (
                  <span className="text-orange-600 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {questions.length - getAnsweredCount()} questions remaining
                  </span>
                )}
              </div>
              <Button onClick={handleSubmitQuiz} size="lg">
                <Send className="h-4 w-4 mr-2" />
                Submit Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Course Quizzes</h2>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500 py-8">
              No quizzes available for this course yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {quizzes.map(quiz => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onStart={() => handleStartQuiz(quiz)}
              getStudentAttempts={getStudentAttempts}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface QuizCardProps {
  quiz: Quiz;
  onStart: () => void;
  getStudentAttempts: (quizId: string) => Promise<any[]>;
}

const QuizCard: React.FC<QuizCardProps> = ({ quiz, onStart, getStudentAttempts }) => {
  const [attempts, setAttempts] = useState<any[]>([]);

  useEffect(() => {
    loadAttempts();
  }, [quiz.id]);

  const loadAttempts = async () => {
    const studentAttempts = await getStudentAttempts(quiz.id);
    setAttempts(studentAttempts);
  };

  const bestScore = attempts.length > 0 
    ? Math.max(...attempts.filter(a => a.score !== null).map(a => a.score || 0))
    : null;

  const attemptsRemaining = (quiz.max_attempts || 3) - attempts.length;
  const hasPassedAttempt = attempts.some(a => a.passed);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-medium">{quiz.title}</h3>
              {hasPassedAttempt && (
                <Badge variant="default">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Passed
                </Badge>
              )}
            </div>

            {quiz.description && (
              <p className="text-gray-600 mb-3">{quiz.description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Passing Score:</span>
                <div className="font-medium">{quiz.passing_score || 70}%</div>
              </div>
              <div>
                <span className="text-gray-500">Time Limit:</span>
                <div className="font-medium">
                  {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'No limit'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Attempts:</span>
                <div className="font-medium">{attempts.length}/{quiz.max_attempts || 3}</div>
              </div>
              {bestScore !== null && (
                <div>
                  <span className="text-gray-500">Best Score:</span>
                  <div className="font-medium">{bestScore}%</div>
                </div>
              )}
            </div>

            {attempts.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Previous Attempts:</h4>
                <div className="space-y-1">
                  {attempts.slice(0, 3).map((attempt, index) => (
                    <div key={attempt.id} className="flex justify-between text-sm">
                      <span>Attempt {attempts.length - index}</span>
                      <span className={attempt.passed ? 'text-green-600' : 'text-red-600'}>
                        {attempt.score !== null 
                          ? `${Math.round((attempt.score / attempt.max_score) * 100)}% ${attempt.passed ? '(Passed)' : '(Failed)'}`
                          : 'In Progress'
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="ml-6">
            {attemptsRemaining > 0 ? (
              <Button onClick={onStart}>
                <Play className="h-4 w-4 mr-2" />
                {attempts.length === 0 ? 'Start Quiz' : 'Retake Quiz'}
              </Button>
            ) : (
              <Button disabled>
                No attempts remaining
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizInterface;

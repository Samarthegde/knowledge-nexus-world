
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables } from '@/integrations/supabase/types';

type Quiz = Tables<'quizzes'>;
type QuizQuestion = Tables<'quiz_questions'>;
type QuizAttempt = Tables<'quiz_attempts'>;

export const useQuizAttempts = (courseId?: string) => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchQuizzes();
    }
  }, [courseId, user]);

  const fetchQuizzes = async () => {
    if (!courseId || !user) return;

    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('order_index');

    if (error) {
      console.error('Error fetching quizzes:', error);
      return;
    }

    setQuizzes(data || []);
    setLoading(false);
  };

  const startQuizAttempt = async (quizId: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        student_id: user.id,
        answers: {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting quiz attempt:', error);
      return null;
    }

    setCurrentAttempt(data);
    return data;
  };

  const submitQuizAttempt = async (quizId: string, answers: Record<string, string>) => {
    if (!user || !currentAttempt) return null;

    // Fetch quiz questions to calculate score
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return null;
    }

    // Calculate score
    let score = 0;
    let maxScore = 0;

    questions?.forEach(question => {
      maxScore += question.points || 1;
      const studentAnswer = answers[question.id];

      if (question.question_type === 'short_answer') {
        // Simple string comparison for short answer (case-insensitive)
        if (studentAnswer?.toLowerCase().trim() === question.correct_answer?.toLowerCase().trim()) {
          score += question.points || 1;
        }
      } else if (question.question_type === 'multiple_choice' && question.options) {
        // Find correct option
        const correctOption = (question.options as Array<{text: string, is_correct: boolean}>)
          .find(opt => opt.is_correct);
        if (correctOption && studentAnswer === correctOption.text) {
          score += question.points || 1;
        }
      }
    });

    // Get passing score from quiz
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('passing_score')
      .eq('id', quizId)
      .single();

    const passingScore = quiz?.passing_score || 70;
    const percentage = (score / maxScore) * 100;
    const passed = percentage >= passingScore;

    // Update attempt
    const { data, error } = await supabase
      .from('quiz_attempts')
      .update({
        answers,
        score,
        max_score: maxScore,
        passed,
        submitted_at: new Date().toISOString(),
        graded_at: new Date().toISOString()
      })
      .eq('id', currentAttempt.id)
      .select()
      .single();

    if (error) {
      console.error('Error submitting quiz attempt:', error);
      return null;
    }

    setCurrentAttempt(null);
    return data;
  };

  const getQuizQuestions = async (quizId: string) => {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index');

    if (error) {
      console.error('Error fetching quiz questions:', error);
      return [];
    }

    return data || [];
  };

  const getStudentAttempts = async (quizId: string) => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('student_id', user.id)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching student attempts:', error);
      return [];
    }

    return data || [];
  };

  return {
    quizzes,
    currentAttempt,
    loading,
    startQuizAttempt,
    submitQuizAttempt,
    getQuizQuestions,
    getStudentAttempts
  };
};

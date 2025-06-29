
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId && user) {
      verifyPayment();
    }
  }, [sessionId, user]);

  const verifyPayment = async () => {
    try {
      // Update payment status to completed
      const { data: purchase, error: updateError } = await supabase
        .from('course_purchases')
        .update({ payment_status: 'completed' })
        .eq('stripe_session_id', sessionId)
        .eq('user_id', user.id)
        .select('course_id')
        .single();

      if (updateError) throw updateError;

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('id', purchase.course_id)
        .single();

      if (courseError) throw courseError;

      setCourse(courseData);

      toast({
        title: 'Payment Successful!',
        description: 'You now have access to the course',
      });
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: 'Error',
        description: 'There was an issue verifying your payment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Processing payment...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {course && (
            <>
              <p className="text-gray-600">
                You now have access to <strong>{course.title}</strong>
              </p>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={() => navigate(`/learn/${course.id}`)}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Start Learning
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/courses')}
                >
                  Browse More Courses
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;

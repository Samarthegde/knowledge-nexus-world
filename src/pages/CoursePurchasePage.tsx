
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Shield, Clock } from 'lucide-react';

const CoursePurchasePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const handlePurchase = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!course) return;

    setIsProcessing(true);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create purchase record with dummy payment
      const { error } = await supabase
        .from('course_purchases')
        .insert({
          user_id: user.id,
          course_id: course.id,
          amount: course.price,
          currency: course.currency,
          payment_status: 'completed',
          purchase_type: 'paid',
          stripe_session_id: `dummy_session_${Date.now()}`
        });

      if (error) throw error;

      toast({
        title: "Payment Successful!",
        description: "You now have access to the course",
      });

      // Redirect to course learning page
      navigate(`/learn/${course.id}`);
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/courses')} className="bg-blue-600 hover:bg-blue-700">
            Browse All Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="edx-container max-w-4xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Course Info */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {course.category}
                  </Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {course.level}
                  </Badge>
                </div>
                <CardTitle className="text-2xl">{course.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src={course.thumbnail_url || '/placeholder.svg'} 
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <p className="text-gray-600 mb-4">{course.short_description || course.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Complete Your Purchase
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Summary */}
                <div>
                  <h3 className="font-semibold mb-3">Order Summary</h3>
                  <div className="flex justify-between items-center mb-2">
                    <span>{course.title}</span>
                    <span className="font-semibold">${course.price}</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total</span>
                    <span>${course.price} {course.currency}</span>
                  </div>
                </div>

                {/* Dummy Payment Form */}
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm font-medium">Demo Payment Gateway</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      This is a demo payment system. No real payment will be processed.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value="4242 4242 4242 4242"
                        readOnly
                        className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry
                        </label>
                        <input
                          type="text"
                          value="12/25"
                          readOnly
                          className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVC
                        </label>
                        <input
                          type="text"
                          value="123"
                          readOnly
                          className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handlePurchase}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Payment...
                    </>
                  ) : (
                    `Complete Purchase - $${course.price}`
                  )}
                </Button>

                <div className="text-center text-sm text-gray-500">
                  <div className="flex items-center justify-center gap-1">
                    <Shield className="h-4 w-4" />
                    <span>30-day money-back guarantee</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePurchasePage;

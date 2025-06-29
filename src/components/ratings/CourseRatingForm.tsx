import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import StarRating from '@/components/ui/star-rating';
import { MessageSquare, Send } from 'lucide-react';

interface CourseRatingFormProps {
  courseId: string;
  existingRating?: {
    rating: number;
    review: string | null;
  };
  onRatingSubmitted?: () => void;
}

const CourseRatingForm: React.FC<CourseRatingFormProps> = ({
  courseId,
  existingRating,
  onRatingSubmitted
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [review, setReview] = useState(existingRating?.review || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to rate this course',
        variant: 'destructive'
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a star rating',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const ratingData = {
        course_id: courseId,
        student_id: user.id,
        rating,
        review: review.trim() || null
      };

      if (existingRating) {
        // Update existing rating
        const { error } = await supabase
          .from('course_ratings')
          .update(ratingData)
          .eq('course_id', courseId)
          .eq('student_id', user.id);

        if (error) throw error;

        toast({
          title: 'Rating Updated',
          description: 'Your course rating has been updated successfully'
        });
      } else {
        // Create new rating
        const { error } = await supabase
          .from('course_ratings')
          .insert(ratingData);

        if (error) throw error;

        toast({
          title: 'Rating Submitted',
          description: 'Thank you for rating this course!'
        });
      }

      onRatingSubmitted?.();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit rating. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {existingRating ? 'Update Your Rating' : 'Rate This Course'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating *
            </label>
            <StarRating
              value={rating}
              onChange={setRating}
              size="lg"
              showValue
              label="Rate this course"
            />
          </div>

          <div>
            <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
              Your Review (Optional)
            </label>
            <Textarea
              id="review"
              placeholder="Share your thoughts about this course..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 mt-1">
              {review.length}/1000 characters
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || rating === 0}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting 
              ? 'Submitting...' 
              : existingRating 
                ? 'Update Rating' 
                : 'Submit Rating'
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CourseRatingForm;
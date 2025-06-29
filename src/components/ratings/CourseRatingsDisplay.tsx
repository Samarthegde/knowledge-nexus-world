import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import RatingDisplay from '@/components/ui/rating-display';
import RatingSummary from '@/components/ui/rating-summary';
import CourseRatingForm from './CourseRatingForm';
import { MessageSquare, ThumbsUp, Flag } from 'lucide-react';

interface CourseRating {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

interface CourseRatingsDisplayProps {
  courseId: string;
}

const CourseRatingsDisplay: React.FC<CourseRatingsDisplayProps> = ({ courseId }) => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<CourseRating[]>([]);
  const [userRating, setUserRating] = useState<CourseRating | null>(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingBreakdown, setRatingBreakdown] = useState({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  });

  useEffect(() => {
    fetchRatings();
    if (user) {
      fetchUserRating();
    }
  }, [courseId, user]);

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('course_ratings')
        .select(`
          id,
          rating,
          review,
          created_at,
          profiles!course_ratings_student_id_fkey(full_name, email)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRatings(data || []);
      calculateRatingStats(data || []);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRating = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('course_ratings')
        .select('*')
        .eq('course_id', courseId)
        .eq('student_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setUserRating(data);
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  };

  const calculateRatingStats = (ratingsData: CourseRating[]) => {
    if (ratingsData.length === 0) {
      setAverageRating(0);
      setRatingBreakdown({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      return;
    }

    const total = ratingsData.reduce((sum, rating) => sum + rating.rating, 0);
    setAverageRating(total / ratingsData.length);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingsData.forEach(rating => {
      breakdown[rating.rating as keyof typeof breakdown]++;
    });
    setRatingBreakdown(breakdown);
  };

  const handleRatingSubmitted = () => {
    setShowRatingForm(false);
    fetchRatings();
    fetchUserRating();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div>Loading ratings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      {ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Course Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <RatingSummary
              averageRating={averageRating}
              totalRatings={ratings.length}
              ratingBreakdown={ratingBreakdown}
            />
          </CardContent>
        </Card>
      )}

      {/* User Rating Section */}
      {user && (
        <div>
          {userRating ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Your Rating</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRatingForm(!showRatingForm)}
                  >
                    Edit Rating
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <RatingDisplay rating={userRating.rating} showValue />
                  {userRating.review && (
                    <p className="text-gray-700">{userRating.review}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Rated on {formatDate(userRating.created_at)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-6">
              <Button onClick={() => setShowRatingForm(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Rate This Course
              </Button>
            </div>
          )}

          {showRatingForm && (
            <CourseRatingForm
              courseId={courseId}
              existingRating={userRating ? {
                rating: userRating.rating,
                review: userRating.review
              } : undefined}
              onRatingSubmitted={handleRatingSubmitted}
            />
          )}
        </div>
      )}

      {/* All Ratings */}
      {ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              All Reviews ({ratings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {ratings.map((rating) => (
                <div key={rating.id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <RatingDisplay rating={rating.rating} size="sm" showValue={false} />
                        <Badge variant="outline">
                          {rating.rating} star{rating.rating !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        By {rating.profiles?.full_name || 'Anonymous'} • {formatDate(rating.created_at)}
                      </div>
                    </div>
                  </div>

                  {rating.review && (
                    <p className="text-gray-700 leading-relaxed mb-3">
                      {rating.review}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <button className="flex items-center gap-1 hover:text-gray-700 transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      Helpful
                    </button>
                    <button className="flex items-center gap-1 hover:text-gray-700 transition-colors">
                      <Flag className="h-4 w-4" />
                      Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {ratings.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No ratings yet</h3>
            <p className="text-gray-500 mb-4">
              Be the first to rate this course and help other students!
            </p>
            {user && !userRating && (
              <Button onClick={() => setShowRatingForm(true)}>
                Rate This Course
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CourseRatingsDisplay;
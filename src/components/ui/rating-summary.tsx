import React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import RatingDisplay from './rating-display';

interface RatingSummaryProps {
  /** Average rating */
  averageRating: number;
  /** Total number of ratings */
  totalRatings: number;
  /** Breakdown of ratings by star count */
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  /** Custom className */
  className?: string;
}

const RatingSummary: React.FC<RatingSummaryProps> = ({
  averageRating,
  totalRatings,
  ratingBreakdown,
  className
}) => {
  const getPercentage = (count: number): number => {
    return totalRatings > 0 ? (count / totalRatings) * 100 : 0;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall Rating */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">
            {averageRating.toFixed(1)}
          </div>
          <RatingDisplay rating={averageRating} size="lg" showValue={false} />
          <div className="text-sm text-gray-600 mt-1">
            {totalRatings.toLocaleString()} {totalRatings === 1 ? 'rating' : 'ratings'}
          </div>
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = ratingBreakdown[stars as keyof typeof ratingBreakdown];
          const percentage = getPercentage(count);

          return (
            <div key={stars} className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1 w-12">
                <span className="font-medium">{stars}</span>
                <span className="text-yellow-400">★</span>
              </div>
              
              <div className="flex-1">
                <Progress 
                  value={percentage} 
                  className="h-2"
                />
              </div>
              
              <div className="w-12 text-right text-gray-600">
                {count.toLocaleString()}
              </div>
              
              <div className="w-12 text-right text-gray-500">
                {percentage.toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RatingSummary;
import React from 'react';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface RatingDisplayProps {
  /** Rating value (can be decimal) */
  rating: number;
  /** Maximum rating (default: 5) */
  maxRating?: number;
  /** Size of the stars */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show rating value as text */
  showValue?: boolean;
  /** Show number of reviews */
  reviewCount?: number;
  /** Custom className */
  className?: string;
  /** Precision for partial stars */
  precision?: 'full' | 'half' | 'quarter';
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-6 w-6'
};

const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = true,
  reviewCount,
  className,
  precision = 'quarter'
}) => {
  const getStarFill = (starIndex: number): number => {
    const starValue = starIndex + 1;
    
    if (rating >= starValue) {
      return 100; // Fully filled
    } else if (rating > starIndex) {
      const fillPercentage = (rating - starIndex) * 100;
      
      // Apply precision rounding
      switch (precision) {
        case 'full':
          return fillPercentage >= 50 ? 100 : 0;
        case 'half':
          return fillPercentage >= 75 ? 100 : fillPercentage >= 25 ? 50 : 0;
        case 'quarter':
          if (fillPercentage >= 87.5) return 100;
          if (fillPercentage >= 62.5) return 75;
          if (fillPercentage >= 37.5) return 50;
          if (fillPercentage >= 12.5) return 25;
          return 0;
        default:
          return Math.round(fillPercentage);
      }
    }
    
    return 0; // Empty
  };

  const formatRating = (value: number): string => {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5" role="img" aria-label={`Rating: ${formatRating(rating)} out of ${maxRating} stars`}>
        {Array.from({ length: maxRating }, (_, index) => {
          const fillPercentage = getStarFill(index);
          
          return (
            <div key={index} className="relative">
              {/* Background star (empty) */}
              <Star
                className={cn(
                  sizeClasses[size],
                  'text-gray-300 fill-transparent'
                )}
              />
              
              {/* Foreground star (filled) */}
              {fillPercentage > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star
                    className={cn(
                      sizeClasses[size],
                      'text-yellow-400 fill-yellow-400'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm font-medium text-gray-700">
          {formatRating(rating)}
        </span>
      )}

      {reviewCount !== undefined && (
        <span className="text-sm text-gray-500">
          ({reviewCount.toLocaleString()} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
};

export default RatingDisplay;
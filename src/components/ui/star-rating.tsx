import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface StarRatingProps {
  /** Current rating value (1-5) */
  value?: number;
  /** Callback when rating changes */
  onChange?: (rating: number) => void;
  /** Whether the rating is read-only */
  readOnly?: boolean;
  /** Size of the stars */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Custom className */
  className?: string;
  /** Show rating value as text */
  showValue?: boolean;
  /** Custom label for accessibility */
  label?: string;
  /** Disable the rating component */
  disabled?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8'
};

const StarRating: React.FC<StarRatingProps> = ({
  value = 0,
  onChange,
  readOnly = false,
  size = 'md',
  className,
  showValue = false,
  label = 'Rate this item',
  disabled = false
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [focusedStar, setFocusedStar] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStarClick = (rating: number) => {
    if (readOnly || disabled) return;
    onChange?.(rating);
  };

  const handleStarHover = (rating: number) => {
    if (readOnly || disabled) return;
    setHoverRating(rating);
  };

  const handleMouseLeave = () => {
    if (readOnly || disabled) return;
    setHoverRating(0);
  };

  const handleKeyDown = (event: React.KeyboardEvent, starIndex: number) => {
    if (readOnly || disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleStarClick(starIndex);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        const nextStar = Math.min(starIndex + 1, 5);
        setFocusedStar(nextStar);
        // Focus the next star element
        const nextElement = containerRef.current?.children[nextStar - 1] as HTMLElement;
        nextElement?.focus();
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        const prevStar = Math.max(starIndex - 1, 1);
        setFocusedStar(prevStar);
        // Focus the previous star element
        const prevElement = containerRef.current?.children[prevStar - 1] as HTMLElement;
        prevElement?.focus();
        break;
      case 'Home':
        event.preventDefault();
        setFocusedStar(1);
        const firstElement = containerRef.current?.children[0] as HTMLElement;
        firstElement?.focus();
        break;
      case 'End':
        event.preventDefault();
        setFocusedStar(5);
        const lastElement = containerRef.current?.children[4] as HTMLElement;
        lastElement?.focus();
        break;
    }
  };

  const getStarState = (starIndex: number) => {
    const currentRating = hoverRating || value;
    return starIndex <= currentRating;
  };

  const getAriaLabel = (starIndex: number) => {
    if (readOnly) {
      return `${starIndex} out of 5 stars`;
    }
    return `Rate ${starIndex} out of 5 stars`;
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div
        ref={containerRef}
        className="flex items-center gap-0.5"
        onMouseLeave={handleMouseLeave}
        role="radiogroup"
        aria-label={label}
        aria-required={!readOnly}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = getStarState(starIndex);
          const isHovered = hoverRating >= starIndex;
          const isFocused = focusedStar === starIndex;

          return (
            <button
              key={starIndex}
              type="button"
              className={cn(
                'relative transition-all duration-200 ease-in-out transform',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-sm',
                !readOnly && !disabled && 'hover:scale-110 cursor-pointer',
                readOnly && 'cursor-default',
                disabled && 'cursor-not-allowed opacity-50',
                isFocused && 'ring-2 ring-blue-500 ring-offset-1'
              )}
              onClick={() => handleStarClick(starIndex)}
              onMouseEnter={() => handleStarHover(starIndex)}
              onKeyDown={(e) => handleKeyDown(e, starIndex)}
              onFocus={() => setFocusedStar(starIndex)}
              onBlur={() => setFocusedStar(0)}
              disabled={readOnly || disabled}
              tabIndex={readOnly ? -1 : 0}
              role="radio"
              aria-checked={starIndex <= value}
              aria-label={getAriaLabel(starIndex)}
              aria-posinset={starIndex}
              aria-setsize={5}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-all duration-200 ease-in-out',
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-transparent text-gray-300',
                  isHovered && !readOnly && !disabled && 'text-yellow-300',
                  disabled && 'text-gray-200'
                )}
              />
              
              {/* Hover effect overlay */}
              {!readOnly && !disabled && (
                <div
                  className={cn(
                    'absolute inset-0 transition-opacity duration-200',
                    isHovered ? 'opacity-20' : 'opacity-0'
                  )}
                >
                  <Star
                    className={cn(
                      sizeClasses[size],
                      'fill-yellow-300 text-yellow-300'
                    )}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {value > 0 ? `${value}/5` : 'No rating'}
        </span>
      )}

      {/* Screen reader only text for current rating */}
      <span className="sr-only">
        {value > 0 ? `Current rating: ${value} out of 5 stars` : 'No rating selected'}
      </span>
    </div>
  );
};

export default StarRating;
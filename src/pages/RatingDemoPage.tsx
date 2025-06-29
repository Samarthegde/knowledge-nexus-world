import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/ui/star-rating';
import RatingDisplay from '@/components/ui/rating-display';
import RatingSummary from '@/components/ui/rating-summary';
import CourseRatingForm from '@/components/ratings/CourseRatingForm';
import { Separator } from '@/components/ui/separator';

const RatingDemoPage = () => {
  const [interactiveRating, setInteractiveRating] = useState(0);
  const [readOnlyRating, setReadOnlyRating] = useState(4.3);

  // Sample data for rating summary
  const sampleRatingBreakdown = {
    5: 45,
    4: 23,
    3: 8,
    2: 3,
    1: 1
  };

  const totalRatings = Object.values(sampleRatingBreakdown).reduce((sum, count) => sum + count, 0);
  const averageRating = (
    (5 * sampleRatingBreakdown[5] + 
     4 * sampleRatingBreakdown[4] + 
     3 * sampleRatingBreakdown[3] + 
     2 * sampleRatingBreakdown[2] + 
     1 * sampleRatingBreakdown[1]) / totalRatings
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">5-Star Rating System Demo</h1>
          <p className="text-gray-600">
            Comprehensive rating components with accessibility features, smooth animations, and responsive design.
          </p>
        </div>

        <div className="space-y-8">
          {/* Interactive Star Rating */}
          <Card>
            <CardHeader>
              <CardTitle>Interactive Star Rating</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Standard Interactive Rating</h3>
                <StarRating
                  value={interactiveRating}
                  onChange={setInteractiveRating}
                  showValue
                  label="Rate this demo"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Current rating: {interactiveRating}/5
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Different Sizes</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Small</Badge>
                      <StarRating value={4} size="sm" readOnly />
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Medium</Badge>
                      <StarRating value={4} size="md" readOnly />
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Large</Badge>
                      <StarRating value={4} size="lg" readOnly />
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Extra Large</Badge>
                      <StarRating value={4} size="xl" readOnly />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Different States</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Read Only</Badge>
                      <StarRating value={3} readOnly showValue />
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Disabled</Badge>
                      <StarRating value={2} disabled showValue />
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">No Rating</Badge>
                      <StarRating value={0} readOnly showValue />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rating Display */}
          <Card>
            <CardHeader>
              <CardTitle>Rating Display (Read-Only with Decimals)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Decimal Rating Display</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <RatingDisplay rating={4.7} showValue reviewCount={156} />
                  </div>
                  <div className="flex items-center gap-4">
                    <RatingDisplay rating={3.2} showValue reviewCount={89} />
                  </div>
                  <div className="flex items-center gap-4">
                    <RatingDisplay rating={2.8} showValue reviewCount={23} />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Different Precisions</h4>
                  <div className="space-y-3">
                    <div>
                      <Badge variant="outline" className="mb-2">Quarter Precision</Badge>
                      <RatingDisplay rating={3.7} precision="quarter" showValue />
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Half Precision</Badge>
                      <RatingDisplay rating={3.7} precision="half" showValue />
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Full Precision</Badge>
                      <RatingDisplay rating={3.7} precision="full" showValue />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">With Review Counts</h4>
                  <div className="space-y-3">
                    <RatingDisplay rating={4.8} showValue reviewCount={1247} />
                    <RatingDisplay rating={4.2} showValue reviewCount={89} />
                    <RatingDisplay rating={3.9} showValue reviewCount={1} />
                    <RatingDisplay rating={0} showValue reviewCount={0} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rating Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Rating Summary with Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <RatingSummary
                averageRating={averageRating}
                totalRatings={totalRatings}
                ratingBreakdown={sampleRatingBreakdown}
              />
            </CardContent>
          </Card>

          {/* Course Rating Form Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Course Rating Form</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                This is a demo of the course rating form. In a real application, this would submit to the database.
              </p>
              <CourseRatingForm
                courseId="demo-course"
                onRatingSubmitted={() => {
                  console.log('Rating submitted (demo)');
                }}
              />
            </CardContent>
          </Card>

          {/* Accessibility Features */}
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Keyboard Navigation</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Try using the keyboard to navigate the rating below:
                  </p>
                  <ul className="text-sm text-gray-600 mb-4 space-y-1">
                    <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Tab</kbd> to focus the rating</li>
                    <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Arrow keys</kbd> to navigate between stars</li>
                    <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> or <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Space</kbd> to select a rating</li>
                    <li>• <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Home</kbd>/<kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">End</kbd> to jump to first/last star</li>
                  </ul>
                  <StarRating
                    value={0}
                    onChange={(rating) => console.log('Keyboard rating:', rating)}
                    showValue
                    label="Keyboard accessible rating demo"
                  />
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Screen Reader Support</h4>
                  <p className="text-sm text-gray-600">
                    All rating components include proper ARIA labels, roles, and descriptions for screen readers.
                    The components announce the current rating and provide clear instructions for interaction.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Implementation Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Implementation Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">✨ Visual Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Smooth hover animations</li>
                    <li>• Scale effects on interaction</li>
                    <li>• Responsive sizing</li>
                    <li>• Partial star fills for decimals</li>
                    <li>• Consistent color scheme</li>
                    <li>• Focus indicators</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-3">⚡ Functional Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Full keyboard navigation</li>
                    <li>• ARIA accessibility support</li>
                    <li>• Read-only and disabled states</li>
                    <li>• Customizable sizes and precision</li>
                    <li>• Database integration ready</li>
                    <li>• TypeScript support</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RatingDemoPage;
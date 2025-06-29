
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Star, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface CourseCardProps {
  id: string;
  title: string;
  description?: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  price: number;
  currency: string;
  level?: string;
  durationMinutes?: number;
  category?: string;
  slug: string;
  enrollmentCount?: number;
  rating?: number;
  isEnrolled?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  shortDescription,
  thumbnailUrl,
  price,
  currency,
  level,
  durationMinutes,
  category,
  slug,
  enrollmentCount = 0,
  rating = 4.5,
  isEnrolled = false
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm hover:shadow-xl hover:-translate-y-1">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-100 to-purple-100 aspect-video">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="h-12 w-12 text-blue-600/50" />
            </div>
          )}
          <div className="absolute top-4 left-4">
            {price === 0 ? (
              <Badge className="bg-green-500 hover:bg-green-600">Free</Badge>
            ) : (
              <Badge className="bg-blue-600 hover:bg-blue-700">
                {formatPrice(price, currency)}
              </Badge>
            )}
          </div>
          {category && (
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="bg-white/90 text-gray-700">
                {category}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
          </div>
          
          {shortDescription && (
            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
              {shortDescription}
            </p>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              {level && (
                <div className="flex items-center space-x-1">
                  <Badge variant="outline" className="text-xs capitalize">
                    {level}
                  </Badge>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(durationMinutes)}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{enrollmentCount}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{rating}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 pt-0">
        <div className="w-full space-y-2">
          {isEnrolled ? (
            <Button 
              className="w-full" 
              onClick={() => navigate(`/course/${slug}`)}
            >
              Continue Learning
            </Button>
          ) : user?.role === 'instructor' || user?.role === 'admin' ? (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(`/instructor/courses/${id}`)}
              >
                View
              </Button>
              <Button
                className="flex-1"
                onClick={() => navigate(`/instructor/courses/${id}/edit`)}
              >
                Edit
              </Button>
            </div>
          ) : (
            <Button 
              className="w-full" 
              onClick={() => navigate(`/course/${slug}`)}
            >
              {price === 0 ? 'Enroll Free' : 'View Course'}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;

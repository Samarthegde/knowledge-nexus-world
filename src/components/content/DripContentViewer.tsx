import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Lock, Unlock, Clock, CheckCircle, Play, FileText, File } from 'lucide-react';

interface ContentItem {
  content_id: string;
  title: string;
  content_type: string;
  order_index: number;
  is_unlocked: boolean;
  unlock_date: string | null;
}

const DripContentViewer = () => {
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId && user) {
      fetchUnlockedContent();
    }
  }, [courseId, user]);

  const fetchUnlockedContent = async () => {
    if (!courseId || !user) return;

    try {
      const { data, error } = await supabase.rpc('get_unlocked_content', {
        p_user_id: user.id,
        p_course_id: courseId
      });

      if (error) throw error;

      setContentItems(data || []);
    } catch (error) {
      console.error('Error fetching unlocked content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course content',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'pdf':
        return <File className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatUnlockDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  const getTimeUntilUnlock = (dateString: string | null) => {
    if (!dateString) return null;
    const unlockDate = new Date(dateString);
    const now = new Date();
    const diffMs = unlockDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Available now';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) return <div>Loading content...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Course Content</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {contentItems.filter(item => item.is_unlocked).length} / {contentItems.length} unlocked
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {contentItems.map((item, index) => (
          <Card key={item.content_id} className={`transition-all ${
            item.is_unlocked ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/30'
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">
                      {index + 1}.
                    </span>
                    {getContentIcon(item.content_type)}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {item.content_type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {item.is_unlocked ? (
                    <>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <Unlock className="h-3 w-3 mr-1" />
                        Available
                      </Badge>
                      <Button size="sm">
                        Access Content
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-right">
                        {item.unlock_date && (
                          <>
                            <Badge variant="secondary" className="mb-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {getTimeUntilUnlock(item.unlock_date)}
                            </Badge>
                            <p className="text-xs text-gray-500">
                              Unlocks: {formatUnlockDate(item.unlock_date)}
                            </p>
                          </>
                        )}
                      </div>
                      <Badge variant="outline" className="text-gray-600">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {contentItems.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content available</h3>
            <p className="text-gray-500">
              This course doesn't have any content yet, or you don't have access to it.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DripContentViewer;
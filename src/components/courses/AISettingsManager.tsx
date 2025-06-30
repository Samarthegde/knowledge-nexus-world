import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bot, Settings, Save, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface AISettings {
  ai_assistant_enabled: boolean;
  ai_assistant_settings: {
    custom_instructions?: string;
    response_style?: 'formal' | 'casual' | 'encouraging';
    max_response_length?: 'short' | 'medium' | 'long';
    topics_allowed?: string[];
    topics_restricted?: string[];
  };
}

const AISettingsManager = () => {
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AISettings>({
    ai_assistant_enabled: true,
    ai_assistant_settings: {
      response_style: 'encouraging',
      max_response_length: 'medium',
      topics_allowed: [],
      topics_restricted: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAISettings();
  }, [courseId]);

  const fetchAISettings = async () => {
    if (!courseId) return;

    try {
      const { data, error } = await supabase
        .from('courses')
        .select('ai_assistant_enabled, ai_assistant_settings')
        .eq('id', courseId)
        .eq('instructor_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        const aiSettings = data.ai_assistant_settings;
        
        setSettings({
          ai_assistant_enabled: data.ai_assistant_enabled ?? true,
          ai_assistant_settings: typeof aiSettings === 'object' && aiSettings !== null ? {
            response_style: (aiSettings as any).response_style || 'encouraging',
            max_response_length: (aiSettings as any).max_response_length || 'medium',
            custom_instructions: (aiSettings as any).custom_instructions || '',
            topics_allowed: (aiSettings as any).topics_allowed || [],
            topics_restricted: (aiSettings as any).topics_restricted || []
          } : {
            response_style: 'encouraging',
            max_response_length: 'medium',
            topics_allowed: [],
            topics_restricted: []
          }
        });
      }
    } catch (error) {
      console.error('Error fetching AI settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI assistant settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!courseId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          ai_assistant_enabled: settings.ai_assistant_enabled,
          ai_assistant_settings: settings.ai_assistant_settings
        })
        .eq('id', courseId)
        .eq('instructor_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Settings Saved',
        description: 'AI assistant settings have been updated successfully'
      });
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save AI assistant settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<AISettings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
      ai_assistant_settings: {
        ...prev.ai_assistant_settings,
        ...updates.ai_assistant_settings
      }
    }));
  };

  if (loading) return <div>Loading AI settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6" />
          AI Assistant Settings
        </h2>
        <Badge variant="outline" className="flex items-center gap-1">
          <Settings className="h-3 w-3" />
          Course Configuration
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Assistant Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="ai-enabled" className="text-base font-medium">
                Enable AI Assistant for this Course
              </Label>
              <p className="text-sm text-gray-600">
                Allow students to access the AI learning assistant while taking this course
              </p>
            </div>
            <Switch
              id="ai-enabled"
              checked={settings.ai_assistant_enabled}
              onCheckedChange={(checked) => 
                updateSettings({ ai_assistant_enabled: checked })
              }
            />
          </div>

          {!settings.ai_assistant_enabled && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">AI Assistant Disabled</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Students will not see the AI assistant widget when learning this course. 
                    They can still access general platform help and support.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {settings.ai_assistant_enabled && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>AI Behavior Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Response Style</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'formal', label: 'Formal', description: 'Professional and structured' },
                    { value: 'casual', label: 'Casual', description: 'Friendly and conversational' },
                    { value: 'encouraging', label: 'Encouraging', description: 'Supportive and motivating' }
                  ].map((style) => (
                    <div
                      key={style.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        settings.ai_assistant_settings.response_style === style.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => updateSettings({
                        ai_assistant_settings: {
                          ...settings.ai_assistant_settings,
                          response_style: style.value as any
                        }
                      })}
                    >
                      <div className="font-medium">{style.label}</div>
                      <div className="text-xs text-gray-600">{style.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-medium">Response Length</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'short', label: 'Short', description: 'Concise answers' },
                    { value: 'medium', label: 'Medium', description: 'Balanced detail' },
                    { value: 'long', label: 'Long', description: 'Comprehensive explanations' }
                  ].map((length) => (
                    <div
                      key={length.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        settings.ai_assistant_settings.max_response_length === length.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => updateSettings({
                        ai_assistant_settings: {
                          ...settings.ai_assistant_settings,
                          max_response_length: length.value as any
                        }
                      })}
                    >
                      <div className="font-medium">{length.label}</div>
                      <div className="text-xs text-gray-600">{length.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-instructions">
                  Additional Instructions for AI Assistant
                </Label>
                <Textarea
                  id="custom-instructions"
                  placeholder="Enter any specific instructions for how the AI should behave in this course. For example: 'Focus on practical applications', 'Always provide code examples', 'Encourage hands-on experimentation', etc."
                  value={settings.ai_assistant_settings.custom_instructions || ''}
                  onChange={(e) => updateSettings({
                    ai_assistant_settings: {
                      ...settings.ai_assistant_settings,
                      custom_instructions: e.target.value
                    }
                  })}
                  rows={4}
                />
                <p className="text-sm text-gray-600">
                  These instructions will be included in the AI's context when responding to students in this course.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default AISettingsManager;

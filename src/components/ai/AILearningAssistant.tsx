import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bot, 
  Send, 
  Loader2, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare,
  Sparkles,
  Brain,
  HelpCircle
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  feedback?: 'positive' | 'negative';
}

interface AIAssistantProps {
  courseId?: string;
  currentLesson?: string;
  studentProgress?: number;
  className?: string;
}

const AILearningAssistant: React.FC<AIAssistantProps> = ({
  courseId,
  currentLesson,
  studentProgress,
  className = ''
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && courseId) {
      loadConversationHistory();
    }
  }, [user, courseId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationHistory = async () => {
    if (!user || !courseId) return;

    try {
      const { data, error } = await supabase.rpc('get_ai_conversation_context', {
        p_user_id: user.id,
        p_course_id: courseId,
        p_limit: 20
      });

      if (error) throw error;

      const historyMessages: ChatMessage[] = [];
      data?.forEach((conv: any) => {
        historyMessages.unshift(
          {
            id: crypto.randomUUID(),
            role: 'user',
            content: conv.user_message,
            timestamp: conv.created_at
          },
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: conv.ai_response,
            timestamp: conv.created_at
          }
        );
      });

      setMessages(historyMessages.slice(-10)); // Keep last 10 messages
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-learning-assistant', {
        body: {
          message: userMessage.content,
          courseId,
          context: {
            currentLesson,
            studentProgress,
            previousMessages: messages.slice(-6) // Send last 6 messages for context
          }
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || data.fallbackResponse,
        timestamp: data.timestamp || new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Track usage analytics
      await supabase.rpc('track_ai_usage', {
        p_user_id: user.id,
        p_course_id: courseId,
        p_session_id: sessionId,
        p_message_count: 1
      });

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try asking your question again, or contact your instructor for help.",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: 'Connection Error',
        description: 'Unable to reach the AI assistant. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const provideFeedback = async (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    );

    // Here you would typically send feedback to the backend
    toast({
      title: 'Feedback Received',
      description: 'Thank you for helping us improve the AI assistant!',
    });
  };

  const suggestedQuestions = [
    "Can you explain this concept in simpler terms?",
    "What are some real-world applications of this topic?",
    "Can you give me some practice questions?",
    "How does this relate to what I learned earlier?",
    "What should I focus on studying next?"
  ];

  return (
    <Card className={`flex flex-col h-[600px] ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-full">
            <Bot className="h-5 w-5 text-blue-600" />
          </div>
          AI Learning Assistant
          <Badge variant="secondary" className="ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by Gemini
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Hi! I'm your AI learning assistant
              </h3>
              <p className="text-gray-600 mb-4">
                I'm here to help you understand course concepts, answer questions, and guide your learning journey.
              </p>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Try asking me:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedQuestions.slice(0, 3).map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setInputMessage(question)}
                      className="text-xs"
                    >
                      <HelpCircle className="h-3 w-3 mr-1" />
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500">Was this helpful?</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => provideFeedback(message.id, 'positive')}
                      className={`h-6 w-6 p-0 ${
                        message.feedback === 'positive' ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => provideFeedback(message.id, 'negative')}
                      className={`h-6 w-6 p-0 ${
                        message.feedback === 'negative' ? 'text-red-600' : 'text-gray-400'
                      }`}
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                <div className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <Separator />

        {/* Input Area */}
        <div className="p-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about the course..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {suggestedQuestions.slice(3).map((question, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => setInputMessage(question)}
                  className="text-xs h-6 px-2"
                >
                  {question}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AILearningAssistant;
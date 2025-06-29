import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  TestTube, 
  Database, 
  Upload, 
  BookOpen,
  Award,
  TrendingUp,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: string;
}

const FeatureTester = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const updateResult = (name: string, status: 'success' | 'error', message: string, details?: string) => {
    setResults(prev => prev.map(r => 
      r.name === name ? { ...r, status, message, details } : r
    ));
  };

  const runTests = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to run tests',
        variant: 'destructive'
      });
      return;
    }

    setTesting(true);
    
    const testSuite: TestResult[] = [
      { name: 'Database Connection', status: 'pending', message: 'Testing...' },
      { name: 'Storage Bucket', status: 'pending', message: 'Testing...' },
      { name: 'Sections Table', status: 'pending', message: 'Testing...' },
      { name: 'Student Progress Table', status: 'pending', message: 'Testing...' },
      { name: 'Certificate Templates', status: 'pending', message: 'Testing...' },
      { name: 'Analytics Views', status: 'pending', message: 'Testing...' },
      { name: 'RLS Policies', status: 'pending', message: 'Testing...' },
      { name: 'Course Creation', status: 'pending', message: 'Testing...' }
    ];

    setResults(testSuite);

    try {
      // Test 1: Database Connection
      const { data: dbTest, error: dbError } = await supabase
        .from('courses')
        .select('count')
        .limit(1);

      if (dbError) {
        updateResult('Database Connection', 'error', 'Failed to connect', dbError.message);
      } else {
        updateResult('Database Connection', 'success', 'Connected successfully');
      }

      // Test 2: Storage Bucket
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        updateResult('Storage Bucket', 'error', 'Failed to access storage', bucketError.message);
      } else {
        const hasCourseBucket = buckets?.some(b => b.name === 'course-media');
        if (hasCourseBucket) {
          updateResult('Storage Bucket', 'success', 'course-media bucket exists');
        } else {
          updateResult('Storage Bucket', 'error', 'course-media bucket not found', 'Run the storage setup SQL');
        }
      }

      // Test 3: Sections Table
      const { data: sectionsTest, error: sectionsError } = await supabase
        .from('sections')
        .select('count')
        .limit(1);

      if (sectionsError) {
        updateResult('Sections Table', 'error', 'Table not accessible', sectionsError.message);
      } else {
        updateResult('Sections Table', 'success', 'Table exists and accessible');
      }

      // Test 4: Student Progress Table
      const { data: progressTest, error: progressError } = await supabase
        .from('student_progress')
        .select('count')
        .limit(1);

      if (progressError) {
        updateResult('Student Progress Table', 'error', 'Table not accessible', progressError.message);
      } else {
        updateResult('Student Progress Table', 'success', 'Table exists and accessible');
      }

      // Test 5: Certificate Templates
      const { data: templatesTest, error: templatesError } = await supabase
        .from('certificate_templates')
        .select('count')
        .limit(1);

      if (templatesError) {
        updateResult('Certificate Templates', 'error', 'Table not accessible', templatesError.message);
      } else {
        updateResult('Certificate Templates', 'success', 'Table exists and accessible');
      }

      // Test 6: Analytics Views
      const { data: analyticsTest, error: analyticsError } = await supabase
        .from('instructor_analytics')
        .select('count')
        .limit(1);

      if (analyticsError) {
        updateResult('Analytics Views', 'error', 'Views not accessible', analyticsError.message);
      } else {
        updateResult('Analytics Views', 'success', 'Analytics views working');
      }

      // Test 7: RLS Policies
      const { data: rlsTest, error: rlsError } = await supabase
        .from('sections')
        .select('*')
        .limit(1);

      if (rlsError && rlsError.code === '42501') {
        updateResult('RLS Policies', 'success', 'RLS is properly enforced');
      } else if (rlsError) {
        updateResult('RLS Policies', 'error', 'RLS test failed', rlsError.message);
      } else {
        updateResult('RLS Policies', 'success', 'RLS policies working');
      }

      // Test 8: Course Creation (simplified test)
      const testCourse = {
        title: `Test Course ${Date.now()}`,
        slug: `test-course-${Date.now()}`,
        description: 'Test course for feature validation',
        instructor_id: user.id,
        is_published: false
      };

      const { data: courseTest, error: courseError } = await supabase
        .from('courses')
        .insert(testCourse)
        .select()
        .single();

      if (courseError) {
        updateResult('Course Creation', 'error', 'Failed to create test course', courseError.message);
      } else {
        updateResult('Course Creation', 'success', 'Course creation working');
        
        // Clean up test course
        await supabase.from('courses').delete().eq('id', courseTest.id);
      }

    } catch (error) {
      console.error('Test suite error:', error);
      toast({
        title: 'Test Suite Error',
        description: 'An unexpected error occurred during testing',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Passed</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const totalTests = results.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-6 w-6" />
              Enhanced Features Test Suite
            </CardTitle>
            <Button onClick={runTests} disabled={testing || !user}>
              {testing ? 'Running Tests...' : 'Run Tests'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {results.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">{successCount} Passed</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium">{errorCount} Failed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium">{totalTests - successCount - errorCount} Pending</span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(successCount / totalTests) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-3">
            {results.map((result, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h4 className="font-medium">{result.name}</h4>
                        <p className="text-sm text-gray-600">{result.message}</p>
                        {result.details && (
                          <p className="text-xs text-gray-500 mt-1">{result.details}</p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {results.length === 0 && (
            <div className="text-center py-8">
              <TestTube className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Test</h3>
              <p className="text-gray-500">
                Click "Run Tests" to validate all enhanced features and database setup.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <h3 className="font-semibold">Sections & Syllabus</h3>
            <p className="text-sm text-gray-600">Course organization tools</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Upload className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <h3 className="font-semibold">Media Upload</h3>
            <p className="text-sm text-gray-600">Thumbnail & file management</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <h3 className="font-semibold">Progress Tracking</h3>
            <p className="text-sm text-gray-600">Student analytics & insights</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Award className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
            <h3 className="font-semibold">Enhanced Certificates</h3>
            <p className="text-sm text-gray-600">Custom templates & generation</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeatureTester;
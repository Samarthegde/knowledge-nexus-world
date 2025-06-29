
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, Award, Users } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Certificate = Tables<'certificates'>;

const CertificateManager = () => {
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, [courseId]);

  const fetchCertificates = async () => {
    if (!courseId) return;

    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        profiles!certificates_student_id_fkey(full_name, email),
        courses!certificates_course_id_fkey(title)
      `)
      .eq('course_id', courseId)
      .order('issued_at', { ascending: false });

    if (error) {
      console.error('Error fetching certificates:', error);
      return;
    }

    setCertificates(data || []);
    setLoading(false);
  };

  const generateCertificate = async (studentId: string) => {
    // This would integrate with a certificate generation service
    // For now, we'll create a placeholder URL
    const certificateUrl = `https://certificates.example.com/${courseId}/${studentId}`;

    const { error } = await supabase
      .from('certificates')
      .update({ certificate_url: certificateUrl })
      .eq('course_id', courseId)
      .eq('student_id', studentId);

    if (error) {
      console.error('Error updating certificate:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate certificate',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Certificate generated successfully'
    });

    fetchCertificates();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Course Certificates</h2>
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          <span className="text-sm text-gray-600">{certificates.length} certificates issued</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Issued Certificates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates issued yet</h3>
              <p className="text-gray-500">
                Certificates are automatically issued when students complete 100% of the course content.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {certificates.map(certificate => (
                <Card key={certificate.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">
                            {certificate.profiles?.full_name || certificate.profiles?.email}
                          </h4>
                          <Badge variant="default">
                            <Award className="h-3 w-3 mr-1" />
                            Certified
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Course: {certificate.courses?.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          Issued: {new Date(certificate.issued_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {certificate.certificate_url ? (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => generateCertificate(certificate.student_id)}
                          >
                            Generate Certificate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certificate Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Automatic Certificate Issuance</h4>
              <p className="text-sm text-blue-700">
                Certificates are automatically issued to students when they complete 100% of the course content. 
                This includes watching all videos, reading all materials, and completing all required assignments and quizzes.
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Completion Tracking</h4>
              <p className="text-sm text-green-700">
                The system tracks student progress automatically and triggers certificate generation 
                when completion criteria are met. Students will receive their certificates immediately upon course completion.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificateManager;

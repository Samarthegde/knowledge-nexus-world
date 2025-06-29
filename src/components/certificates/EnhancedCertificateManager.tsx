import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, Award, Users, Plus, Edit2, Save, Eye } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Certificate = Tables<'certificates'>;
type CertificateTemplate = Tables<'certificate_templates'>;

interface CertificateWithStudent extends Certificate {
  users?: {
    profiles?: {
      full_name: string | null;
      email: string;
    };
  };
  courses?: {
    title: string;
  };
}

const EnhancedCertificateManager = () => {
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<CertificateWithStudent[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    html_content: '',
    css_styles: ''
  });

  useEffect(() => {
    fetchCertificates();
    fetchTemplates();
  }, [courseId]);

  const fetchCertificates = async () => {
    if (!courseId) return;

    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        users!certificates_student_id_fkey(
          profiles(full_name, email)
        ),
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

  const fetchTemplates = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('certificate_templates')
      .select('*')
      .or(`instructor_id.eq.${user.id},is_default.eq.true`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return;
    }

    setTemplates(data || []);
  };

  const createTemplate = async () => {
    if (!user || !newTemplate.name.trim()) return;

    const { data, error } = await supabase
      .from('certificate_templates')
      .insert({
        name: newTemplate.name,
        html_content: newTemplate.html_content,
        css_styles: newTemplate.css_styles,
        instructor_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create certificate template',
        variant: 'destructive'
      });
      return;
    }

    setTemplates([data, ...templates]);
    setNewTemplate({ name: '', html_content: '', css_styles: '' });
    toast({
      title: 'Success',
      description: 'Certificate template created successfully'
    });
  };

  const updateTemplate = async (templateId: string, updates: Partial<CertificateTemplate>) => {
    const { error } = await supabase
      .from('certificate_templates')
      .update(updates)
      .eq('id', templateId);

    if (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive'
      });
      return;
    }

    setTemplates(templates.map(t => t.id === templateId ? { ...t, ...updates } : t));
    setEditingTemplate(null);
    toast({
      title: 'Success',
      description: 'Template updated successfully'
    });
  };

  const generateCertificatePDF = async (certificate: CertificateWithStudent) => {
    // This would integrate with a PDF generation service
    // For now, we'll create a simple HTML preview
    const template = templates.find(t => t.id === certificate.template_id);
    if (!template) return;

    let html = template.html_content;
    
    // Replace template variables
    html = html.replace(/{{student_name}}/g, certificate.users?.profiles?.full_name || 'Student');
    html = html.replace(/{{course_title}}/g, certificate.courses?.title || 'Course');
    html = html.replace(/{{completion_date}}/g, new Date(certificate.issued_at).toLocaleDateString());
    html = html.replace(/{{instructor_name}}/g, user?.email || 'Instructor');

    // Create a new window with the certificate
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Certificate</title>
            <style>${template.css_styles}</style>
          </head>
          <body>${html}</body>
        </html>
      `);
      newWindow.document.close();
    }

    toast({
      title: 'Certificate Generated',
      description: 'Certificate opened in new window. You can print or save as PDF.'
    });
  };

  const previewTemplate = (template: CertificateTemplate) => {
    let html = template.html_content;
    
    // Replace with sample data
    html = html.replace(/{{student_name}}/g, 'John Doe');
    html = html.replace(/{{course_title}}/g, 'Sample Course');
    html = html.replace(/{{completion_date}}/g, new Date().toLocaleDateString());
    html = html.replace(/{{instructor_name}}/g, user?.email || 'Instructor');

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Certificate Preview</title>
            <style>${template.css_styles}</style>
          </head>
          <body>${html}</body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  if (loading) return <div>Loading certificates...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Enhanced Certificate Management</h2>
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          <span className="text-sm text-gray-600">{certificates.length} certificates issued</span>
        </div>
      </div>

      <Tabs defaultValue="certificates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="certificates">Issued Certificates</TabsTrigger>
          <TabsTrigger value="templates">Certificate Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="certificates">
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
                                {certificate.users?.profiles?.full_name || certificate.users?.profiles?.email}
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
                            
                            {certificate.certificate_data && (
                              <div className="mt-2 text-xs text-gray-500">
                                <p>Completion: {new Date(certificate.certificate_data.completion_date).toLocaleDateString()}</p>
                                {certificate.certificate_data.total_time_spent && (
                                  <p>Time spent: {Math.round(certificate.certificate_data.total_time_spent / 3600)}h</p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => generateCertificatePDF(certificate)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Generate PDF
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="space-y-6">
            {/* Create New Template */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Template Name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                />
                <Textarea
                  placeholder="HTML Content (use {{student_name}}, {{course_title}}, {{completion_date}}, {{instructor_name}} as placeholders)"
                  value={newTemplate.html_content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, html_content: e.target.value })}
                  className="min-h-[120px]"
                />
                <Textarea
                  placeholder="CSS Styles"
                  value={newTemplate.css_styles}
                  onChange={(e) => setNewTemplate({ ...newTemplate, css_styles: e.target.value })}
                  className="min-h-[80px]"
                />
                <Button onClick={createTemplate} disabled={!newTemplate.name.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </CardContent>
            </Card>

            {/* Existing Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Certificate Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates.map(template => (
                    <Card key={template.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            {editingTemplate === template.id ? (
                              <div className="space-y-3">
                                <Input
                                  value={template.name}
                                  onChange={(e) => setTemplates(templates.map(t => 
                                    t.id === template.id ? { ...t, name: e.target.value } : t
                                  ))}
                                />
                                <Textarea
                                  value={template.html_content}
                                  onChange={(e) => setTemplates(templates.map(t => 
                                    t.id === template.id ? { ...t, html_content: e.target.value } : t
                                  ))}
                                  className="min-h-[120px]"
                                />
                                <Textarea
                                  value={template.css_styles || ''}
                                  onChange={(e) => setTemplates(templates.map(t => 
                                    t.id === template.id ? { ...t, css_styles: e.target.value } : t
                                  ))}
                                  className="min-h-[80px]"
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => updateTemplate(template.id, {
                                      name: template.name,
                                      html_content: template.html_content,
                                      css_styles: template.css_styles
                                    })}
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setEditingTemplate(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{template.name}</h3>
                                  {template.is_default && (
                                    <Badge variant="secondary">Default</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  Created: {new Date(template.created_at).toLocaleDateString()}
                                </p>
                                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                  {template.html_content.substring(0, 100)}...
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {editingTemplate !== template.id && !template.is_default && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => previewTemplate(template)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingTemplate(template.id)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedCertificateManager;
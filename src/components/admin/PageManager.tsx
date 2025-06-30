
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  FileText, 
  Globe, 
  Calendar,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import WYSIWYGEditor from './WYSIWYGEditor';

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const PageManager = () => {
  const { toast } = useToast();
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<CustomPage | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    meta_description: '',
    is_published: false
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_pages')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch pages",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug) {
      toast({
        title: "Error",
        description: "Title and slug are required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      if (selectedPage) {
        // Update existing page
        const { error } = await supabase
          .from('custom_pages')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedPage.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Page updated successfully!"
        });
      } else {
        // Create new page
        const { error } = await supabase
          .from('custom_pages')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Page created successfully!"
        });
      }

      fetchPages();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save page",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const { error } = await supabase
        .from('custom_pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Page deleted successfully!"
      });
      
      fetchPages();
      if (selectedPage?.id === pageId) {
        resetForm();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete page",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (page: CustomPage) => {
    setSelectedPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      meta_description: page.meta_description,
      is_published: page.is_published
    });
    setIsEditing(true);
  };

  const resetForm = () => {
    setSelectedPage(null);
    setFormData({
      title: '',
      slug: '',
      content: '',
      meta_description: '',
      is_published: false
    });
    setIsEditing(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Page Manager</h2>
          <p className="text-gray-600">Create and manage custom pages for your site</p>
        </div>
        <Button onClick={() => setIsEditing(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Page
        </Button>
      </div>

      <Tabs defaultValue="pages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pages">All Pages</TabsTrigger>
          <TabsTrigger value="editor">
            {isEditing ? (selectedPage ? 'Edit Page' : 'New Page') : 'Editor'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Custom Pages</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search pages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPages.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No pages found</h3>
                    <p className="text-gray-500 mb-4">Get started by creating your first custom page</p>
                    <Button onClick={() => setIsEditing(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Page
                    </Button>
                  </div>
                ) : (
                  filteredPages.map((page) => (
                    <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{page.title}</h3>
                          <Badge variant={page.is_published ? "default" : "secondary"}>
                            {page.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            /{page.slug}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(page.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                        {page.meta_description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {page.meta_description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/pages/${page.slug}`, '_blank')}
                          disabled={!page.is_published}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(page)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(page.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor" className="space-y-6">
          {!isEditing ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No page selected</h3>
                <p className="text-gray-500 mb-4">Select a page to edit or create a new one</p>
                <Button onClick={() => setIsEditing(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Page
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {selectedPage ? 'Edit Page' : 'Create New Page'}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Page'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Page Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => {
                          const title = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            title,
                            slug: prev.slug || generateSlug(title)
                          }));
                        }}
                        placeholder="About Us"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">URL Slug</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          /pages/
                        </span>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                          placeholder="about-us"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="meta-description">Meta Description</Label>
                    <Input
                      id="meta-description"
                      value={formData.meta_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                      placeholder="Brief description for search engines"
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.meta_description.length}/160 characters
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="published"
                      checked={formData.is_published}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="published">Publish page</Label>
                  </div>

                  <div>
                    <Label>Page Content</Label>
                    <div className="mt-2">
                      <WYSIWYGEditor
                        content={formData.content}
                        onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PageManager;

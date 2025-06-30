
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Palette, Upload, Eye, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettings {
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  site_name: string;
  favicon_url: string;
}

const SiteCustomization = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSettings>({
    primary_color: '#2563eb',
    secondary_color: '#3b82f6',
    logo_url: '',
    site_name: 'LearnHub',
    favicon_url: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const colorPresets = [
    { name: 'Blue (Default)', primary: '#2563eb', secondary: '#3b82f6' },
    { name: 'Purple', primary: '#7c3aed', secondary: '#8b5cf6' },
    { name: 'Green', primary: '#059669', secondary: '#10b981' },
    { name: 'Red', primary: '#dc2626', secondary: '#ef4444' },
    { name: 'Orange', primary: '#ea580c', secondary: '#f97316' },
    { name: 'Pink', primary: '#db2777', secondary: '#ec4899' },
    { name: 'Indigo', primary: '#4f46e5', secondary: '#6366f1' },
    { name: 'Teal', primary: '#0d9488', secondary: '#14b8a6' }
  ];

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .single();

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.log('No existing settings found, using defaults');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert(settings);

      if (error) throw error;

      // Apply the changes to CSS variables
      applyThemeChanges();

      toast({
        title: "Success",
        description: "Site customization saved successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save site customization",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyThemeChanges = () => {
    const root = document.documentElement;
    root.style.setProperty('--primary', settings.primary_color);
    root.style.setProperty('--primary-foreground', '#ffffff');
    
    // Update logo if needed
    const logos = document.querySelectorAll('[data-site-logo]');
    logos.forEach(logo => {
      if (logo instanceof HTMLImageElement && settings.logo_url) {
        logo.src = settings.logo_url;
      }
    });

    // Update site name
    const siteNames = document.querySelectorAll('[data-site-name]');
    siteNames.forEach(element => {
      element.textContent = settings.site_name;
    });
  };

  const handleColorPreset = (preset: typeof colorPresets[0]) => {
    setSettings(prev => ({
      ...prev,
      primary_color: preset.primary,
      secondary_color: preset.secondary
    }));
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      setSettings(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_url' : 'favicon_url']: publicUrl
      }));

      toast({
        title: "Success",
        description: `${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully!`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to upload ${type}`,
        variant: "destructive"
      });
    }
  };

  const resetToDefaults = () => {
    setSettings({
      primary_color: '#2563eb',
      secondary_color: '#3b82f6',
      logo_url: '',
      site_name: 'LearnHub',
      favicon_url: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Site Customization</h2>
          <p className="text-gray-600">Customize your site's appearance and branding</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Exit Preview' : 'Preview Changes'}
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="colors">Colors & Theme</TabsTrigger>
          <TabsTrigger value="branding">Logo & Branding</TabsTrigger>
          <TabsTrigger value="preview">Live Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Scheme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-16 h-10 p-1 rounded border"
                    />
                    <Input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="flex-1"
                      placeholder="#2563eb"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-16 h-10 p-1 rounded border"
                    />
                    <Input
                      type="text"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="flex-1"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Color Presets</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  {colorPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      className="h-auto p-3 flex flex-col items-center gap-2"
                      onClick={() => handleColorPreset(preset)}
                    >
                      <div className="flex gap-1">
                        <div 
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: preset.secondary }}
                        />
                      </div>
                      <span className="text-xs">{preset.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                onClick={resetToDefaults}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="site-name">Site Name</Label>
                <Input
                  id="site-name"
                  value={settings.site_name}
                  onChange={(e) => setSettings(prev => ({ ...prev, site_name: e.target.value }))}
                  placeholder="LearnHub"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Logo</Label>
                <div className="mt-2 space-y-3">
                  {settings.logo_url && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <img src={settings.logo_url} alt="Logo" className="h-12 w-12 object-contain" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Current Logo</p>
                        <p className="text-xs text-gray-500">{settings.logo_url}</p>
                      </div>
                    </div>
                  )}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload a new logo</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'logo');
                      }}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Favicon</Label>
                <div className="mt-2 space-y-3">
                  {settings.favicon_url && (
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <img src={settings.favicon_url} alt="Favicon" className="h-8 w-8 object-contain" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Current Favicon</p>
                        <p className="text-xs text-gray-500">{settings.favicon_url}</p>
                      </div>
                    </div>
                  )}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload a new favicon</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'favicon');
                      }}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <p className="text-sm text-gray-600">
                See how your changes will look on the live site
              </p>
            </CardHeader>
            <CardContent>
              <div 
                className="border rounded-lg p-6 space-y-4"
                style={{ 
                  '--primary': settings.primary_color,
                  '--secondary': settings.secondary_color 
                } as React.CSSProperties}
              >
                <div className="flex items-center gap-3">
                  {settings.logo_url ? (
                    <img src={settings.logo_url} alt="Logo" className="h-8 w-8" />
                  ) : (
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  )}
                  <h3 className="text-xl font-bold">{settings.site_name}</h3>
                </div>
                
                <div className="space-y-2">
                  <Button style={{ backgroundColor: settings.primary_color, color: 'white' }}>
                    Primary Button
                  </Button>
                  <Button 
                    variant="outline" 
                    style={{ borderColor: settings.primary_color, color: settings.primary_color }}
                  >
                    Secondary Button
                  </Button>
                </div>
                
                <div className="p-4 rounded-lg" style={{ backgroundColor: settings.primary_color + '10' }}>
                  <p className="text-sm" style={{ color: settings.primary_color }}>
                    This is how your brand colors will appear in cards and highlights
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SiteCustomization;

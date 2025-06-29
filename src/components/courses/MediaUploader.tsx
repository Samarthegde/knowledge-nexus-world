import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image, FileText, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MediaUploaderProps {
  onUpload: (url: string) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  currentUrl?: string;
  label?: string;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  onUpload,
  acceptedTypes = ['image/*', 'video/*', 'application/pdf'],
  maxSize = 50,
  currentUrl,
  label = 'Upload Media'
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `File size must be less than ${maxSize}MB`,
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `course-media/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-media')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('course-media')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
      
      toast({
        title: 'Success',
        description: 'File uploaded successfully'
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeMedia = () => {
    onUpload('');
  };

  const getFileIcon = (url: string) => {
    if (url.includes('.pdf')) return <FileText className="h-8 w-8" />;
    if (url.includes('.mp4') || url.includes('.mov') || url.includes('.avi')) return <Video className="h-8 w-8" />;
    return <Image className="h-8 w-8" />;
  };

  const getFileType = (url: string) => {
    if (url.includes('.pdf')) return 'PDF';
    if (url.includes('.mp4') || url.includes('.mov') || url.includes('.avi')) return 'Video';
    return 'Image';
  };

  return (
    <div className="space-y-4">
      {currentUrl ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getFileIcon(currentUrl)}
                <div>
                  <p className="font-medium">{getFileType(currentUrl)} uploaded</p>
                  <p className="text-sm text-gray-500 truncate max-w-xs">
                    {currentUrl.split('/').pop()}
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {currentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
              <div className="mt-4">
                <img
                  src={currentUrl}
                  alt="Uploaded content"
                  className="max-w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card
          className={`border-2 border-dashed transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">{label}</h3>
              <p className="text-gray-500 mb-4">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Supported formats: Images, Videos, PDFs (max {maxSize}MB)
              </p>
              
              <input
                type="file"
                accept={acceptedTypes.join(',')}
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              
              <Button
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Choose File'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MediaUploader;
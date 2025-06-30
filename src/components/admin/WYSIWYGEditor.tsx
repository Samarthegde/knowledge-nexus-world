
import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Quote
} from 'lucide-react';

interface WYSIWYGEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const WYSIWYGEditor: React.FC<WYSIWYGEditorProps> = ({ content, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      executeCommand('insertImage', url);
    }
  };

  const toolbarButtons = [
    { command: 'bold', icon: Bold, title: 'Bold' },
    { command: 'italic', icon: Italic, title: 'Italic' },
    { command: 'underline', icon: Underline, title: 'Underline' },
    { command: 'justifyLeft', icon: AlignLeft, title: 'Align Left' },
    { command: 'justifyCenter', icon: AlignCenter, title: 'Align Center' },
    { command: 'justifyRight', icon: AlignRight, title: 'Align Right' },
    { command: 'insertUnorderedList', icon: List, title: 'Bullet List' },
    { command: 'insertOrderedList', icon: ListOrdered, title: 'Numbered List' },
    { command: 'formatBlock', icon: Quote, title: 'Quote', value: 'blockquote' },
    { command: 'formatBlock', icon: Code, title: 'Code Block', value: 'pre' }
  ];

  return (
    <Card className="overflow-hidden">
      {/* Toolbar */}
      <div className="border-b p-3 bg-gray-50">
        <div className="flex flex-wrap gap-1">
          {toolbarButtons.map((button, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => executeCommand(button.command, button.value)}
              title={button.title}
              className="h-8 w-8 p-0"
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={insertLink}
            title="Insert Link"
            className="h-8 w-8 p-0"
          >
            <Link className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={insertImage}
            title="Insert Image"
            className="h-8 w-8 p-0"
          >
            <Image className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <select
            onChange={(e) => executeCommand('formatBlock', e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
            defaultValue=""
          >
            <option value="">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
            <option value="h5">Heading 5</option>
            <option value="h6">Heading 6</option>
          </select>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[400px] p-4 prose max-w-none focus:outline-none"
        style={{
          lineHeight: '1.6',
          fontSize: '16px'
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </Card>
  );
};

export default WYSIWYGEditor;

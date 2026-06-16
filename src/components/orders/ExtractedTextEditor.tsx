// ExtractedTextEditor - Editable textarea for OCR-extracted text
// Shows after image OCR, lets user correct errors before matching

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Wand2, X, Lightbulb } from 'lucide-react';

interface ExtractedTextEditorProps {
  extractedText: string;
  onConfirm: (editedText: string) => void;
  onCancel: () => void;
}

const ExtractedTextEditor: React.FC<ExtractedTextEditorProps> = ({
  extractedText,
  onConfirm,
  onCancel,
}) => {
  const [text, setText] = useState(extractedText);

  const lineCount = text.split('\n').filter((l) => l.trim()).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-blue-600" />
          Extracted Text
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tip */}
        <Alert className="bg-blue-50 border-blue-200">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-700">
            Review and edit the extracted text if needed. One product per line,
            e.g., <strong>Tomato 2kg</strong>
          </AlertDescription>
        </Alert>

        {/* Editable textarea */}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[180px] font-mono text-sm"
          placeholder="Tomato 2kg&#10;Onion 1bag&#10;Potato 3box"
        />

        {/* Line count */}
        <p className="text-xs text-gray-500">
          {lineCount} product{lineCount !== 1 ? 's' : ''} detected
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => onConfirm(text)}
            disabled={!text.trim()}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Match Products
          </Button>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExtractedTextEditor;

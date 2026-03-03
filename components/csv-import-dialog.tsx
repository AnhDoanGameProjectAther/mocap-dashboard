'use client';

import { useState, useRef } from 'react';
import { Upload, FileUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CSVImportDialogProps {
  sessionId: string;
  type: 'animations' | 'characters' | 'callsheet';
  onSuccess: () => void;
  buttonLabel?: string;
  expectedHeaders?: string[];
}

export function CSVImportDialog({
  sessionId,
  type,
  onSuccess,
  buttonLabel = 'Import CSV',
  expectedHeaders,
}: CSVImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target?.result as string);
      setError(null);
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      setError('Please paste CSV data or upload a file');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/import/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText, sessionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Import failed');
        return;
      }

      setResult(data);
      if (data.errors.length === 0) {
        // Auto-close on success after a delay
        setTimeout(() => {
          setIsOpen(false);
          setCsvText('');
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      setError('Failed to import. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getExampleCSV = () => {
    switch (type) {
      case 'animations':
        return `Character,Shot ID,Move Name,Duration,Description,Performer Notes,Key Poses,Talent Required,Props,Reference,Priority
Spear-Mask,C010,Appearance Intro,2s,Enemy sitting pose,Match reference image,Neutral sitting pose,Martial Artist - Male,Spear,https://example.com/ref1,High
Spear-Mask,C020,Jump Down,2s30,Jump down from platform,Follow reference clip,Jump landing pose,Martial Artist - Male,Spear,https://example.com/ref2,Medium`;
      case 'characters':
        return `Character Name,Character Image,Description,Weapon Name,Weapon Image
Spear-Mask,https://example.com/char.png,Main character with mask and spear,Spear,https://example.com/spear.png
Stunt Performer,https://example.com/stunt.png,Female stunt performer for action scenes,,`;
      case 'callsheet':
        return `Producer,Director,Contact Phone,Parking Info,Call Time,Wrap Time,Special Instructions
John Doe,Jane Smith,+84 123 456 789,Free parking in lot B,08:00,18:00,Bring ID badge. Catering provided.`;
      default:
        return '';
    }
  };

  const loadExample = () => {
    setCsvText(getExampleCSV());
    setError(null);
    setResult(null);
  };

  const clearData = () => {
    setCsvText('');
    setError(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileUp className="h-4 w-4 mr-2" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {type.charAt(0).toUpperCase() + type.slice(1)} from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Instructions */}
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            <p className="font-medium mb-1">Expected CSV format:</p>
            {type === 'animations' && (
              <ul className="list-disc list-inside space-y-1">
                <li>Character, Shot ID, Move Name, Duration, Description</li>
                <li>Performer Notes, Key Poses, Talent Required, Props, Reference, Priority</li>
              </ul>
            )}
            {type === 'characters' && (
              <ul className="list-disc list-inside space-y-1">
                <li>Character Name, Character Image, Description</li>
                <li>Weapon Name, Weapon Image</li>
              </ul>
            )}
            {type === 'callsheet' && (
              <ul className="list-disc list-inside space-y-1">
                <li>Producer, Director, Contact Phone, Parking Info</li>
                <li>Call Time, Wrap Time, Special Instructions</li>
              </ul>
            )}
            <p className="mt-2 text-xs">Headers are flexible - the importer will try to match common variations.</p>
          </div>

          {/* File Upload */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose CSV File
            </Button>
            <Button variant="ghost" onClick={loadExample}>
              Load Example
            </Button>
            {csvText && (
              <Button variant="ghost" onClick={clearData}>
                Clear
              </Button>
            )}
          </div>

          {/* CSV Text Area */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Or paste CSV data directly:
            </label>
            <Textarea
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setError(null);
                setResult(null);
              }}
              placeholder="Character,Shot ID,Move Name,..."
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Result */}
          {result && (
            <Alert variant={result.errors.length > 0 ? "default" : "default"} className={result.errors.length === 0 ? "border-green-500 bg-green-50" : ""}>
              <CheckCircle className={`h-4 w-4 ${result.errors.length === 0 ? "text-green-500" : ""}`} />
              <AlertDescription>
                <p className="font-medium">Imported {result.imported} {type} successfully!</p>
                {result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Errors ({result.errors.length}):</p>
                    <ul className="list-disc list-inside text-sm mt-1 max-h-32 overflow-y-auto">
                      {result.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isLoading || !csvText.trim()}>
              {isLoading ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

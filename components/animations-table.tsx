'use client';

import { useState } from 'react';
import { Plus, Trash2, ExternalLink, Upload, GripVertical, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Animation } from '@/types';
import { CSVImportDialog } from './csv-import-dialog';

interface AnimationsTableProps {
  sessionId: string;
  animations: Animation[];
  onUpdate: () => void;
}

const priorityColors = {
  Low: 'bg-gray-500',
  Medium: 'bg-yellow-500',
  High: 'bg-red-500',
};

export function AnimationsTable({ sessionId, animations, onUpdate }: AnimationsTableProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Animation>>({
    character: '',
    shotId: '',
    moveName: '',
    duration: '',
    description: '',
    performerNotes: '',
    keyPoses: '',
    talentRequired: '',
    props: '',
    referenceType: 'link',
    referenceUrl: '',
    priority: 'Medium',
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    try {
      if (isAdding) {
        const res = await fetch('/api/animations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            sessionId,
            order: animations.length,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || data.details || 'Failed to create animation');
        }
        setIsAdding(false);
      } else if (editingId) {
        const res = await fetch(`/api/animations/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || data.details || 'Failed to update animation');
        }
        setEditingId(null);
      }
      setFormData({
        character: '',
        shotId: '',
        moveName: '',
        duration: '',
        description: '',
        performerNotes: '',
        keyPoses: '',
        talentRequired: '',
        props: '',
        referenceType: 'link',
        referenceUrl: '',
        priority: 'Medium',
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to save animation:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  const handleClose = () => {
    setIsAdding(false);
    setEditingId(null);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this animation?')) return;
    await fetch(`/api/animations/${id}`, { method: 'DELETE' });
    onUpdate();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, animationId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(animationId);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      await fetch(`/api/animations/${animationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceType: 'file',
          referenceUrl: data.url,
        }),
      });
      onUpdate();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingId(null);
    }
  };

  const openEdit = (anim: Animation) => {
    setEditingId(anim.id);
    setFormData(anim);
  };

  const renderReferenceCell = (anim: Animation) => {
    if (anim.referenceType === 'file' && anim.referenceUrl) {
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(anim.referenceUrl);
      const isVideo = /\.(mp4|webm|mov)$/i.test(anim.referenceUrl);

      if (isImage) {
        return (
          <img
            src={anim.referenceUrl}
            alt="Reference"
            className="h-16 w-auto rounded object-cover cursor-pointer"
            onClick={() => window.open(anim.referenceUrl, '_blank')}
          />
        );
      }
      if (isVideo) {
        return (
          <video
            src={anim.referenceUrl}
            className="h-16 w-auto rounded cursor-pointer"
            controls
          />
        );
      }
      return (
        <a href={anim.referenceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          View File
        </a>
      );
    }

    if (anim.referenceUrl) {
      return (
        <a
          href={anim.referenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          Link
        </a>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Input
          placeholder="Paste URL"
          className="h-8 w-32"
          onBlur={(e) => {
            if (e.target.value) {
              fetch(`/api/animations/${anim.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  referenceType: 'link',
                  referenceUrl: e.target.value,
                }),
              }).then(onUpdate);
            }
          }}
        />
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, anim.id)}
          />
          <Upload className="h-4 w-4 text-gray-500 hover:text-gray-700" />
        </label>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Animations ({animations.length})</h3>
        <div className="flex gap-2">
          <CSVImportDialog
            sessionId={sessionId}
            type="animations"
            onSuccess={onUpdate}
            buttonLabel="Import CSV"
          />
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Animation
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-auto max-h-[calc(100vh-220px)]">
        <Table className="w-max min-w-full">
          <TableHeader className="sticky top-0 z-20">
            <TableRow className="bg-muted/50">
              <TableHead className="w-10 text-center sticky left-0 z-30 bg-muted/50 border-r">#</TableHead>
              <TableHead className="w-20 sticky left-[40px] z-30 bg-muted/50 border-r">Priority</TableHead>
              <TableHead className="w-28 sticky left-[120px] z-30 bg-muted/50 border-r">Character</TableHead>
              <TableHead className="w-24 sticky left-[232px] z-30 bg-muted/50 border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">Shot ID</TableHead>
              <TableHead className="w-40">Move Name</TableHead>
              <TableHead className="w-20">Duration</TableHead>
              <TableHead className="w-64">Description</TableHead>
              <TableHead className="w-64">Performer Notes</TableHead>
              <TableHead className="w-48">Key Poses</TableHead>
              <TableHead className="w-36">Talent Required</TableHead>
              <TableHead className="w-28">Props</TableHead>
              <TableHead className="w-32">Reference</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {animations.map((anim, idx) => (
              <TableRow
                key={anim.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => openEdit(anim)}
              >
                <TableCell className="text-muted-foreground text-center align-top sticky left-0 z-10 bg-background border-r">{idx + 1}</TableCell>
                <TableCell className="align-top sticky left-[40px] z-10 bg-background border-r">
                  <Badge className={`${priorityColors[anim.priority]} text-white text-xs`}>
                    {anim.priority}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-normal break-words align-top sticky left-[120px] z-10 bg-background border-r">{anim.character}</TableCell>
                <TableCell className="font-mono text-sm whitespace-normal break-words align-top sticky left-[232px] z-10 bg-background border-r shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">{anim.shotId}</TableCell>
                <TableCell className="font-medium whitespace-normal break-words align-top">{anim.moveName}</TableCell>
                <TableCell className="whitespace-normal break-words align-top">{anim.duration}</TableCell>
                <TableCell className="whitespace-normal break-words align-top">{anim.description}</TableCell>
                <TableCell className="whitespace-normal break-words align-top">{anim.performerNotes}</TableCell>
                <TableCell className="whitespace-normal break-words align-top">{anim.keyPoses}</TableCell>
                <TableCell className="whitespace-normal break-words align-top">{anim.talentRequired}</TableCell>
                <TableCell className="whitespace-normal break-words align-top">{anim.props}</TableCell>
                <TableCell className="align-top" onClick={(e) => e.stopPropagation()}>
                  {uploadingId === anim.id ? (
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  ) : (
                    renderReferenceCell(anim)
                  )}
                </TableCell>
                <TableCell className="align-top">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(anim.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {(isAdding || editingId) && (
        <Dialog open={true} onOpenChange={handleClose}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isAdding ? 'Add Animation' : 'Edit Animation'}</DialogTitle>
            </DialogHeader>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Character</label>
                  <Input
                    value={formData.character}
                    onChange={(e) => setFormData({ ...formData, character: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Shot ID</label>
                  <Input
                    value={formData.shotId}
                    onChange={(e) => setFormData({ ...formData, shotId: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Move Name</label>
                <Input
                  value={formData.moveName}
                  onChange={(e) => setFormData({ ...formData, moveName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 10-12 min"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v) => setFormData({ ...formData, priority: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Performer Instructions</label>
                <Textarea
                  value={formData.performerNotes}
                  onChange={(e) => setFormData({ ...formData, performerNotes: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Key Poses</label>
                <Textarea
                  value={formData.keyPoses}
                  onChange={(e) => setFormData({ ...formData, keyPoses: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Talent Required</label>
                  <Input
                    value={formData.talentRequired}
                    onChange={(e) => setFormData({ ...formData, talentRequired: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Props</label>
                  <Input
                    value={formData.props}
                    onChange={(e) => setFormData({ ...formData, props: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Reference URL</label>
                <Input
                  value={formData.referenceUrl}
                  onChange={(e) => setFormData({
                    ...formData,
                    referenceUrl: e.target.value,
                    referenceType: e.target.value ? 'link' : 'file'
                  })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {isAdding ? 'Add' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

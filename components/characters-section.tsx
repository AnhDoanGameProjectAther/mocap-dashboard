'use client';

import { useState } from 'react';
import { Plus, Trash2, Upload, User, Sword } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Character } from '@/types';

interface CharactersSectionProps {
  sessionId: string;
  characters: Character[];
  onUpdate: () => void;
}

export function CharactersSection({ sessionId, characters, onUpdate }: CharactersSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<'character' | 'weapon' | null>(null);
  const [formData, setFormData] = useState<Partial<Character>>({
    name: '',
    imageUrl: '',
    description: '',
    weaponName: '',
    weaponImageUrl: '',
  });

  const handleSubmit = async () => {
    try {
      if (isAdding) {
        const res = await fetch('/api/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            sessionId,
          }),
        });
        if (!res.ok) throw new Error('Failed to create character');
        setIsAdding(false);
      } else if (editingId) {
        const res = await fetch(`/api/characters/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to update character');
        setEditingId(null);
      }
      setFormData({
        name: '',
        imageUrl: '',
        description: '',
        weaponName: '',
        weaponImageUrl: '',
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to save character:', err);
    }
  };

  const handleClose = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this character?')) return;
    await fetch(`/api/characters/${id}`, { method: 'DELETE' });
    onUpdate();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'character' | 'weapon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingType(type);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();

      if (type === 'character') {
        setFormData({ ...formData, imageUrl: data.url });
      } else {
        setFormData({ ...formData, weaponImageUrl: data.url });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingType(null);
    }
  };

  const openEdit = (char: Character) => {
    setEditingId(char.id);
    setFormData(char);
  };

  const openAdd = () => {
    setIsAdding(true);
    setFormData({
      name: '',
      imageUrl: '',
      description: '',
      weaponName: '',
      weaponImageUrl: '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Characters ({characters.length})</h3>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Character
        </Button>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No characters yet</p>
          <Button variant="outline" className="mt-4" onClick={openAdd}>
            Add your first character
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((char) => (
            <Card
              key={char.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openEdit(char)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-lg">{char.name}</h4>
                    {char.weaponName && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Sword className="h-3 w-3" />
                        {char.weaponName}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mt-2 -mr-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(char.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3">
                  {/* Character Image */}
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    {char.imageUrl ? (
                      <img
                        src={char.imageUrl}
                        alt={char.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Weapon Image */}
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    {char.weaponImageUrl ? (
                      <img
                        src={char.weaponImageUrl}
                        alt={char.weaponName || 'Weapon'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sword className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {char.description && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-3">
                    {char.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(isAdding || editingId) && (
        <Dialog open={true} onOpenChange={handleClose}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isAdding ? 'Add Character' : 'Edit Character'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Character Name */}
              <div>
                <label className="text-sm font-medium">Character Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Spear-Mask"
                />
              </div>

              {/* Character Image */}
              <div>
                <label className="text-sm font-medium">Character Image</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="Image URL or upload"
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'character')}
                    />
                    <Button variant="outline" type="button" disabled={uploadingType === 'character'}>
                      {uploadingType === 'character' ? '...' : <Upload className="h-4 w-4" />}
                    </Button>
                  </label>
                </div>
                {formData.imageUrl && (
                  <div className="mt-2 aspect-video bg-muted rounded-lg overflow-hidden max-h-32">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Character Description */}
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Character description, notes, etc."
                  rows={3}
                />
              </div>

              {/* Weapon Name */}
              <div>
                <label className="text-sm font-medium">Weapon Name</label>
                <Input
                  value={formData.weaponName}
                  onChange={(e) => setFormData({ ...formData, weaponName: e.target.value })}
                  placeholder="e.g., Spear"
                />
              </div>

              {/* Weapon Image */}
              <div>
                <label className="text-sm font-medium">Weapon Image</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.weaponImageUrl}
                    onChange={(e) => setFormData({ ...formData, weaponImageUrl: e.target.value })}
                    placeholder="Weapon image URL or upload"
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'weapon')}
                    />
                    <Button variant="outline" type="button" disabled={uploadingType === 'weapon'}>
                      {uploadingType === 'weapon' ? '...' : <Upload className="h-4 w-4" />}
                    </Button>
                  </label>
                </div>
                {formData.weaponImageUrl && (
                  <div className="mt-2 aspect-video bg-muted rounded-lg overflow-hidden max-h-32">
                    <img
                      src={formData.weaponImageUrl}
                      alt="Weapon Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
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

'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ChecklistItem } from '@/types';

interface ChecklistProps {
  sessionId: string;
  items: ChecklistItem[];
  onUpdate: () => void;
}

const categoryColors: Record<string, string> = {
  equipment: 'bg-orange-100 text-orange-800',
  talent: 'bg-blue-100 text-blue-800',
  location: 'bg-green-100 text-green-800',
  files: 'bg-purple-100 text-purple-800',
};

const categoryLabels: Record<string, string> = {
  equipment: 'Equipment',
  talent: 'Talent',
  location: 'Location',
  files: 'Files',
};

export function Checklist({ sessionId, items, onUpdate }: ChecklistProps) {
  const [newTask, setNewTask] = useState('');
  const [newCategory, setNewCategory] = useState<ChecklistItem['category']>('equipment');

  const toggleItem = async (id: string, completed: boolean) => {
    await fetch(`/api/checklist/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    onUpdate();
  };

  const addItem = async () => {
    if (!newTask.trim()) return;
    await fetch('/api/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, category: newCategory, task: newTask }),
    });
    setNewTask('');
    onUpdate();
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/checklist/${id}`, { method: 'DELETE' });
    onUpdate();
  };

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const completedCount = items.filter(i => i.completed).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Preparation Checklist</h3>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {items.length} completed ({progress}%)
          </p>
        </div>
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Add new item */}
      <div className="flex gap-2">
        <Select value={newCategory} onValueChange={(v) => setNewCategory(v as any)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equipment">Equipment</SelectItem>
            <SelectItem value="talent">Talent</SelectItem>
            <SelectItem value="location">Location</SelectItem>
            <SelectItem value="files">Files</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          className="flex-1"
        />
        <Button onClick={addItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Checklist by category */}
      <div className="space-y-6">
        {(['equipment', 'talent', 'location', 'files'] as const).map((category) => {
          const categoryItems = grouped[category] || [];
          if (categoryItems.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              <h4 className={`inline-block px-2 py-1 rounded text-sm font-medium ${categoryColors[category]}`}>
                {categoryLabels[category]}
              </h4>
              <div className="space-y-1">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      item.completed ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={(checked) => toggleItem(item.id, checked as boolean)}
                    />
                    <span className={`flex-1 ${item.completed ? 'line-through text-gray-400' : ''}`}>
                      {item.task}
                    </span>
                    {item.owner && (
                      <span className="text-sm text-muted-foreground">@{item.owner}</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

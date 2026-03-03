'use client';

import { useState } from 'react';
import { Printer, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Session, CallsheetInfo } from '@/types';
import { CSVImportDialog } from './csv-import-dialog';

interface CallsheetProps {
  session: Session;
  callsheet: CallsheetInfo | null;
  onUpdate: () => void;
}

export function CallsheetView({ session, callsheet, onUpdate }: CallsheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CallsheetInfo>>({
    producer: callsheet?.producer || '',
    director: callsheet?.director || '',
    contactPhone: callsheet?.contactPhone || '',
    parkingInfo: callsheet?.parkingInfo || '',
    callTime: callsheet?.callTime || '',
    wrapTime: callsheet?.wrapTime || '',
    specialInstructions: callsheet?.specialInstructions || '',
  });

  const handleSave = async () => {
    await fetch(`/api/callsheet/${session.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setIsEditing(false);
    onUpdate();
  };

  const handlePrint = () => {
    window.print();
  };

  const displayData = isEditing ? formData : {
    producer: callsheet?.producer || '-',
    director: callsheet?.director || '-',
    contactPhone: callsheet?.contactPhone || '-',
    parkingInfo: callsheet?.parkingInfo || '-',
    callTime: callsheet?.callTime || '-',
    wrapTime: callsheet?.wrapTime || '-',
    specialInstructions: callsheet?.specialInstructions || '-',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center no-print">
        <h3 className="text-lg font-semibold">Callsheet</h3>
        <div className="flex gap-2">
          <CSVImportDialog
            sessionId={session.id}
            type="callsheet"
            onSuccess={onUpdate}
            buttonLabel="Import CSV"
          />
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {isEditing ? (
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>
      </div>

      <Card className="print:shadow-none print:border-none">
        <CardHeader className="border-b bg-muted/50 print:bg-white">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{session.title}</CardTitle>
              <p className="text-muted-foreground mt-1">
                {session.date} | {session.startTime} - {session.endTime}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{session.location}</p>
              <p className="text-sm text-muted-foreground">Status: {session.status}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Key Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Producer</label>
              {isEditing ? (
                <Input
                  value={formData.producer}
                  onChange={(e) => setFormData({ ...formData, producer: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">{displayData.producer}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Director</label>
              {isEditing ? (
                <Input
                  value={formData.director}
                  onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">{displayData.director}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Contact Phone</label>
              {isEditing ? (
                <Input
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">{displayData.contactPhone}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Parking Info</label>
              {isEditing ? (
                <Input
                  value={formData.parkingInfo}
                  onChange={(e) => setFormData({ ...formData, parkingInfo: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">{displayData.parkingInfo}</p>
              )}
            </div>
          </div>

          {/* Call/Wrap Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg print:bg-gray-100">
              <label className="text-sm font-medium text-blue-800">Call Time</label>
              {isEditing ? (
                <Input
                  value={formData.callTime}
                  onChange={(e) => setFormData({ ...formData, callTime: e.target.value })}
                  className="mt-1"
                  placeholder="e.g., 8:00 AM"
                />
              ) : (
                <p className="text-2xl font-bold text-blue-900 mt-1">{displayData.callTime}</p>
              )}
            </div>
            <div className="p-4 bg-green-50 rounded-lg print:bg-gray-100">
              <label className="text-sm font-medium text-green-800">Estimated Wrap</label>
              {isEditing ? (
                <Input
                  value={formData.wrapTime}
                  onChange={(e) => setFormData({ ...formData, wrapTime: e.target.value })}
                  className="mt-1"
                  placeholder="e.g., 6:00 PM"
                />
              ) : (
                <p className="text-2xl font-bold text-green-900 mt-1">{displayData.wrapTime}</p>
              )}
            </div>
          </div>

          {/* Team */}
          {session.team.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Team</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {session.team.map((member, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {member}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Special Instructions</label>
            {isEditing ? (
              <Textarea
                value={formData.specialInstructions}
                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                className="mt-1"
                rows={4}
              />
            ) : (
              <p className="mt-1 whitespace-pre-wrap">{displayData.specialInstructions}</p>
            )}
          </div>

          {/* Session Notes */}
          {session.notes && (
            <div className="pt-4 border-t">
              <label className="text-sm font-medium text-muted-foreground">Session Notes</label>
              <p className="mt-1 whitespace-pre-wrap">{session.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

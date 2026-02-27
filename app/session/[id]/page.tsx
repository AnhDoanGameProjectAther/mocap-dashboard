'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AnimationsTable } from '@/components/animations-table';
import { Checklist } from '@/components/checklist';
import { CallsheetView } from '@/components/callsheet';
import type { SessionWithDetails } from '@/types';

const statusColors: Record<string, string> = {
  planned: 'bg-blue-500',
  confirmed: 'bg-green-500',
  completed: 'bg-gray-500',
  cancelled: 'bg-red-500',
};

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/sessions/${params.id}`);
      const data = await res.json();
      setSession(data);
    } catch (error) {
      console.error('Failed to fetch session:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      await fetch(`/api/sessions/${params.id}`, { method: 'DELETE' });
      router.push('/');
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Session not found</h1>
          <Link href="/">
            <Button>Back to Calendar</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{session.title}</h1>
                <Badge className={`${statusColors[session.status]} text-white capitalize`}>
                  {session.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {session.date} | {session.startTime} - {session.endTime} | {session.location}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/session/${session.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="animations" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:w-auto">
            <TabsTrigger value="animations">
              Animations ({session.animations.length})
            </TabsTrigger>
            <TabsTrigger value="checklist">
              Checklist ({session.checklist.filter(i => i.completed).length}/{session.checklist.length})
            </TabsTrigger>
            <TabsTrigger value="callsheet">Callsheet</TabsTrigger>
          </TabsList>

          <TabsContent value="animations" className="mt-6">
            <AnimationsTable
              sessionId={session.id}
              animations={session.animations}
              onUpdate={fetchSession}
            />
          </TabsContent>

          <TabsContent value="checklist" className="mt-6">
            <Checklist
              sessionId={session.id}
              items={session.checklist}
              onUpdate={fetchSession}
            />
          </TabsContent>

          <TabsContent value="callsheet" className="mt-6">
            <CallsheetView
              session={session}
              callsheet={session.callsheet}
              onUpdate={fetchSession}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

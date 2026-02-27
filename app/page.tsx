'use client';

import { useEffect, useState } from 'react';
import { Calendar } from '@/components/calendar';
import type { Session } from '@/types';

export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async (year?: number, month?: number) => {
    try {
      const url = year && month
        ? `/api/sessions/month?year=${year}&month=${month}`
        : '/api/sessions';
      const res = await fetch(url);
      const data = await res.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" />
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mocap Planning Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Schedule and manage motion capture sessions
            </p>
          </div>
        </div>

        <Calendar
          sessions={sessions}
          onMonthChange={fetchSessions}
        />
      </div>
    </main>
  );
}

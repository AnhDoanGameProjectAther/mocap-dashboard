import { NextRequest, NextResponse } from 'next/server';
import { addChecklistItem, initTursoDb } from '@/lib/db/turso';

let initialized = false;
async function ensureDb() {
  if (!initialized) {
    await initTursoDb();
    initialized = true;
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const body = await request.json();
    const item = await addChecklistItem(body.sessionId, body.category, body.task, body.owner);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('POST /api/checklist error:', error);
    return NextResponse.json({ error: 'Failed to add checklist item' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { addChecklistItem } from '@/lib/db/operations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const item = addChecklistItem(body.sessionId, body.category, body.task, body.owner);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add checklist item' }, { status: 500 });
  }
}

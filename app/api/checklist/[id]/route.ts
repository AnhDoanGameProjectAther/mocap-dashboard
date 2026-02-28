import { NextRequest, NextResponse } from 'next/server';
import { toggleChecklistItem, deleteChecklistItem, initTursoDb } from '@/lib/db/turso';

let initialized = false;
async function ensureDb() {
  if (!initialized) {
    await initTursoDb();
    initialized = true;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDb();
    const body = await request.json();
    await toggleChecklistItem(params.id, body.completed);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/checklist/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update checklist item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDb();
    await deleteChecklistItem(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/checklist/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete checklist item' }, { status: 500 });
  }
}

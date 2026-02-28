import { NextRequest, NextResponse } from 'next/server';
import { updateAnimation, deleteAnimation, initTursoDb } from '@/lib/db/turso';

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
    const animation = await updateAnimation(params.id, body);
    return NextResponse.json(animation);
  } catch (error) {
    console.error('PATCH /api/animations/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update animation' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDb();
    await deleteAnimation(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/animations/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete animation' }, { status: 500 });
  }
}

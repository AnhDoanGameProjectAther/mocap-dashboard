import { NextRequest, NextResponse } from 'next/server';
import { updateCharacter, deleteCharacter, initTursoDb } from '@/lib/db/turso';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initTursoDb();
    const data = await request.json();
    const character = await updateCharacter(params.id, data);
    return NextResponse.json(character);
  } catch (error) {
    console.error('Failed to update character:', error);
    return NextResponse.json({ error: 'Failed to update character' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initTursoDb();
    await deleteCharacter(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete character:', error);
    return NextResponse.json({ error: 'Failed to delete character' }, { status: 500 });
  }
}

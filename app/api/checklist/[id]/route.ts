import { NextRequest, NextResponse } from 'next/server';
import { toggleChecklistItem, deleteChecklistItem, addChecklistItem } from '@/lib/db/operations';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    toggleChecklistItem(params.id, body.completed);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update checklist item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    deleteChecklistItem(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete checklist item' }, { status: 500 });
  }
}

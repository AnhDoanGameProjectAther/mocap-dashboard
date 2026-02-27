import { NextRequest, NextResponse } from 'next/server';
import { updateAnimation, deleteAnimation } from '@/lib/db/operations';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const animation = updateAnimation(params.id, body);
    return NextResponse.json(animation);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update animation' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    deleteAnimation(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete animation' }, { status: 500 });
  }
}

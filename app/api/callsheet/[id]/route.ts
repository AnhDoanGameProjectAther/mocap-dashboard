import { NextRequest, NextResponse } from 'next/server';
import { updateCallsheet } from '@/lib/db/operations';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const callsheet = updateCallsheet(params.id, body);
    return NextResponse.json(callsheet);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update callsheet' }, { status: 500 });
  }
}

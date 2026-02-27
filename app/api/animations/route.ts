import { NextRequest, NextResponse } from 'next/server';
import { createAnimation } from '@/lib/db/operations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const animation = createAnimation(body);
    return NextResponse.json(animation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create animation' }, { status: 500 });
  }
}

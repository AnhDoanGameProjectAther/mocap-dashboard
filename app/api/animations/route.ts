import { NextRequest, NextResponse } from 'next/server';
import { createAnimation, initTursoDb } from '@/lib/db/turso';

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
    console.log('Creating animation:', body);
    const animation = await createAnimation(body);
    console.log('Animation created:', animation);
    return NextResponse.json(animation, { status: 201 });
  } catch (error) {
    console.error('POST /api/animations error:', error);
    return NextResponse.json({
      error: 'Failed to create animation',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { updateCallsheet, initTursoDb } from '@/lib/db/turso';

let initialized = false;
async function ensureDb() {
  if (!initialized) {
    await initTursoDb();
    initialized = true;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDb();
    const body = await request.json();
    const callsheet = await updateCallsheet(params.id, body);
    return NextResponse.json(callsheet);
  } catch (error) {
    console.error('PUT /api/callsheet/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update callsheet' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSession, getSessionWithDetails, updateSession, deleteSession } from '@/lib/db/operations';
import { sendSlackNotification } from '@/lib/slack';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionWithDetails(params.id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const oldSession = getSession(params.id);
    if (!oldSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const body = await request.json();
    const session = updateSession(params.id, body);

    // Send Slack notification for significant changes
    const significantChanges = ['date', 'startTime', 'endTime', 'location', 'status'];
    const hasSignificantChange = significantChanges.some(key => key in body);

    if (hasSignificantChange) {
      await sendSlackNotification({
        type: 'session_updated',
        session,
        changes: body,
      });
    }

    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession(params.id);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    deleteSession(params.id);

    await sendSlackNotification({
      type: 'session_deleted',
      session,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}

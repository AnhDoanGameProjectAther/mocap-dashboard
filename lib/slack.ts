import type { Session } from '@/types';

interface SlackNotification {
  type: 'session_created' | 'session_updated' | 'session_deleted';
  session: Session;
  changes?: Partial<Session>;
}

export async function sendSlackNotification({ type, session, changes }: SlackNotification) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('Slack webhook not configured, skipping notification');
    return;
  }

  let message = '';
  const sessionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/session/${session.id}`;

  switch (type) {
    case 'session_created':
      message = `🎬 *New Mocap Session Created*\n` +
                `*Title:* ${session.title}\n` +
                `*Date:* ${session.date} | *Time:* ${session.startTime} - ${session.endTime}\n` +
                `*Location:* ${session.location}\n` +
                `*Status:* ${session.status}\n` +
                `<${sessionUrl}|View Session>`;
      break;

    case 'session_updated':
      const changeList = changes
        ? Object.entries(changes)
            .filter(([key]) => ['date', 'startTime', 'endTime', 'location', 'status'].includes(key))
            .map(([key, value]) => `• ${key}: ${value}`)
            .join('\n')
        : '';

      message = `✏️ *Mocap Session Updated*\n` +
                `*Title:* ${session.title}\n` +
                `*Changes:*\n${changeList}\n\n` +
                `<${sessionUrl}|View Session>`;
      break;

    case 'session_deleted':
      message = `🗑️ *Mocap Session Cancelled*\n` +
                `*Title:* ${session.title}\n` +
                `*Was scheduled for:* ${session.date} at ${session.startTime}\n` +
                `*Location:* ${session.location}`;
      break;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });

    if (!response.ok) {
      console.error('Failed to send Slack notification:', await response.text());
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error);
  }
}

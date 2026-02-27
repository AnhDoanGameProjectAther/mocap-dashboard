# Mocap Planning Dashboard

A web-based dashboard for planning and managing motion capture sessions.

## Features

- **Calendar View**: Visual calendar showing all mocap sessions
- **Session Management**: Create, edit, and delete sessions
- **Animation List**: Detailed animation tracking with:
  - Character, shot ID, move name
  - Duration and description
  - Performer notes and key poses
  - Talent and prop requirements
  - Reference images/videos or links
  - Priority levels
- **Checklist**: Preparation checklist by category (equipment, talent, location, files)
- **Callsheet**: Printable callsheet with session details
- **Slack Notifications**: Automatic notifications on session changes

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd mocap-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:
- `SLACK_WEBHOOK_URL` (optional): For Slack notifications
- `NEXT_PUBLIC_APP_URL`: Your app URL (use `http://localhost:3000` for local dev)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Setting Up Slack Notifications

1. Go to your Slack workspace settings
2. Create an Incoming Webhook:
   - Go to https://api.slack.com/messaging/webhooks
   - Create a new app or use an existing one
   - Enable Incoming Webhooks
   - Add to your workspace and select a channel
   - Copy the Webhook URL
3. Add the webhook URL to your `.env.local`:
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub

2. Connect to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Deploy

3. Set environment variables in Vercel dashboard:
   - `SLACK_WEBHOOK_URL`
   - `NEXT_PUBLIC_APP_URL` (your Vercel deployment URL)

### Self-Hosted

For company internal hosting:

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

3. The app will be available on port 3000. Use nginx or another reverse proxy for production.

**Note:** The database is SQLite and stored in the `data/mocap.db` file. Make sure this directory is persisted between deployments.

## Data Structure

### Session
- Title, date, time, location
- Status (planned, confirmed, completed, cancelled)
- Team members
- Notes

### Animation
- Character, shot ID, move name
- Duration, description
- Performer instructions
- Key poses
- Talent and prop requirements
- Reference (uploaded file or external link)
- Priority level

### Checklist
- Category: equipment, talent, location, files
- Task description
- Completion status
- Owner (optional)

## License

MIT

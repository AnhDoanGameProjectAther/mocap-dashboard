/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DB_PATH: process.env.DB_PATH,
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};

export default nextConfig;

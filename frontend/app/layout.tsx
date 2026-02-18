import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Student Tracking',
  description: 'NGO student tracking system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
      </body>
    </html>
  );
}


import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Radio Dashboard - Trajectory Map',
  description: 'Visualize trajectories from PostgreSQL database',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
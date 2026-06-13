import { Sora, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const sora = Sora({ 
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Memewatch AI - Analysis Engine',
  description: 'Deploy state-of-the-art neural engines to decode memes, visual irony, and viral patterns in real-time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${sora.variable} ${jetbrainsMono.variable} bg-background text-on-background antialiased`}>
        {children}
      </body>
    </html>
  );
}
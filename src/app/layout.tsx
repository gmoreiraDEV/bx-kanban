import './globals.css';
import { StackProvider, StackTheme } from '@stackframe/stack';

import { stackClientApp } from '@/stack/client';

export const metadata = {
  title: 'Forge',
  description: 'Sua produtividade em um só lugar.'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900">
        <StackProvider app={stackClientApp}>
          <StackTheme>{children}</StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}

export const metadata = {
  title: 'Kanban & Pages Pro',
  description: 'Sua produtividade em um só lugar.'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}

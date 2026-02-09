'use client';

import { useParams } from 'next/navigation';
import PublicSharePage from '@/components/views/PublicShare';

export default function PublicShareRoute() {
  const params = useParams();
  const token = typeof params?.token === 'string' ? params.token : undefined;

  return <PublicSharePage token={token} />;
}

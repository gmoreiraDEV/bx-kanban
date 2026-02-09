'use client';

import { useParams } from 'next/navigation';
import PageDetailPage from '@/components/views/PageDetail';

export default function PageDetailRoute() {
  const params = useParams();
  const pageId = typeof params?.pageId === 'string' ? params.pageId : undefined;

  return <PageDetailPage pageId={pageId} />;
}

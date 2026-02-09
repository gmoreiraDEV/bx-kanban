'use client';

import { useParams } from 'next/navigation';
import BoardsPage from '@/components/views/Boards';

export default function BoardDetailPage() {
  const params = useParams();
  const boardId = typeof params?.boardId === 'string' ? params.boardId : undefined;

  return <BoardsPage boardId={boardId} />;
}

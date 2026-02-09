'use client'

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { stackAuth } from '@/lib/stack-auth';
import { db } from '@/db';
import { bootstrapKanban } from '@/lib/kanbanApi';

const ProtectedRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const hasBootstrapped = useRef(false);
  const user = stackAuth.useUser();
  const currentSpace = stackAuth.useCurrentSpace();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (!user) {
      router.replace('/login');
    }
  }, [isMounted, user, router]);

  useEffect(() => {
    if (currentSpace && user && !hasBootstrapped.current) {
      hasBootstrapped.current = true;
      db.bootstrapSpace(currentSpace.id, user.id);
      void bootstrapKanban(currentSpace.id);
    }
  }, [currentSpace, user]);

  if (!isMounted || !user) return null;

  return <>{children}</>;
};

export default ProtectedRoute;

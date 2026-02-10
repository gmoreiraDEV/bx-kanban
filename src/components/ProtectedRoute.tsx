'use client'

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { stackAuth } from '@/lib/stack-auth';
import { bootstrapKanban } from '@/lib/kanbanApi';

const ProtectedRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const hasBootstrappedSpaces = useRef(false);
  const bootstrappedKanbanSpaces = useRef(new Set<string>());
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
    if (!isMounted || !user || hasBootstrappedSpaces.current) return;

    hasBootstrappedSpaces.current = true;
    void (async () => {
      try {
        await stackAuth.ensureBootstrap();
      } catch {
        router.replace('/login');
      }
    })();
  }, [isMounted, user, router]);

  useEffect(() => {
    if (!currentSpace || !user) return;

    if (!bootstrappedKanbanSpaces.current.has(currentSpace.id)) {
      bootstrappedKanbanSpaces.current.add(currentSpace.id);
      void bootstrapKanban(currentSpace.id);
    }
  }, [currentSpace, user]);

  if (!isMounted || !user) return null;
  if (!currentSpace) return null;

  return <>{children}</>;
};

export default ProtectedRoute;

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { stackAuth } from '@/lib/stack-auth';

export default function HomePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const user = stackAuth.useUser();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (user) {
      router.replace('/boards');
    } else {
      router.replace('/login');
    }
  }, [isMounted, router, user]);

  return null;
}

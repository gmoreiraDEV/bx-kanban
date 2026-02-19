'use client'


import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { stackAuth } from '@/lib/stack-auth';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const user = stackAuth.useUser();

  useEffect(() => {
    if (user) {
      router.replace('/boards');
    }
  }, [router, user]);

  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="mb-8 flex justify-center">
          <Image
            src="/img/logo-v.png"
            alt="Forge"
            width={480}
            height={480}
            className="h-28 w-auto"
            priority
          />
        </div>

        <Link
          href="/handler/sign-in"
          className="block w-full rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          Entrar
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;

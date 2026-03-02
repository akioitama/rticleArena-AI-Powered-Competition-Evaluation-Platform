'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { rehydrate, setCredentials, logout } from '@/store/slices/authSlice';
import { useLoginMutation } from '@/store/api/authApi';
import { useGetCompetitionsQuery } from '@/store/api/competitionsApi';
import { useGetMySubmissionsQuery } from '@/store/api/submissionsApi';
import ArticleArenaApp from '@/components/ArticleArena/ArticleArenaApp';
import ArticleArenaAuth from '@/components/ArticleArena/ArticleArenaAuth';

export default function Home() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    dispatch(rehydrate());
    setMounted(true);
  }, [dispatch]);

  if (!mounted) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <ArticleArenaAuth
        onLoginSuccess={(user, token) => {
          dispatch(setCredentials({ user, token }));
        }}
      />
    );
  }

  return <ArticleArenaApp user={user} onLogout={() => dispatch(logout())} />;
}

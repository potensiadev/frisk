import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 사용자 역할에 따라 적절한 대시보드로 리다이렉트
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role === 'admin') {
    redirect('/admin');
  } else if (userData?.role === 'nepal_agency') {
    redirect('/agency');
  } else if (userData?.role === 'university') {
    redirect('/university');
  }

  // 기본값: 로그인 페이지
  redirect('/login');
}

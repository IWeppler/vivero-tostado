'use server';

import { createClient } from '@/shared/config/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  await supabase.auth.signOut();
  
  redirect('/auth');
}
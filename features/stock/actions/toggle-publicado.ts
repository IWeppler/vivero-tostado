'use server';

import { createClient } from '@/shared/config/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function togglePublicadoAction(id: string, publicado: boolean) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase
      .from('productos')
      .update({ publicado })
      .eq('id', id);

    if (error) {
      console.error(error);
      return { error: 'Error al cambiar visibilidad.', success: false };
    }

    revalidatePath('/stock');
    revalidatePath('/store');
    
    return { error: null, success: true };
  } catch (err) {
    console.error('Error in togglePublicadoAction:', err);
    return { error: 'Ocurrió un error inesperado.', success: false };
  }
}
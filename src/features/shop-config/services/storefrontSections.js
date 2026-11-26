import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../infrastructure/supabase/supabaseClient';

export const sectionQueryKey = ['storefront-sections'];
export function useStorefrontSections() {
  return useQuery({ queryKey: sectionQueryKey, staleTime: 30000, queryFn: async () => {
    const { data, error } = await supabase.rpc('xng_public_storefront_sections');
    if (error) throw error;
    return data || {};
  }});
}
export async function saveStorefrontSection(key, value) {
  const { error } = await supabase.rpc('xng_save_storefront_section', { p_key: key, p_value: value });
  if (error) throw error;
}

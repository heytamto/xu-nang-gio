import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../infrastructure/supabase/supabaseClient';

export const shippingPolicyKey = ['shipping-policy'];
export function useShippingPolicy() {
  return useQuery({ queryKey: shippingPolicyKey, staleTime: 30000, queryFn: async () => {
    const { data, error } = await supabase.rpc('xng_public_shipping_policy');
    if (error) throw error;
    return data;
  }});
}
export async function saveShippingPolicy(value) {
  const { error } = await supabase.rpc('xng_save_shipping_policy', { p_value: value });
  if (error) throw error;
}

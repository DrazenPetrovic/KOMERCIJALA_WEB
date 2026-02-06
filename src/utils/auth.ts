import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  username: string;
  sifra_radnika: number;
}

let currentUser: User | null = null;

export const signIn = async (username: string, password: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, sifra_radnika')
    .eq('username', username)
    .eq('password', password)
    .maybeSingle();

  if (error || !data) {
    return { error: new Error('Pogrešno korisničko ime ili lozinka'), data: null };
  }

  currentUser = data;
  localStorage.setItem('user', JSON.stringify(data));
  return { data, error: null };
};

export const signOut = () => {
  currentUser = null;
  localStorage.removeItem('user');
};

export const getCurrentUser = (): User | null => {
  if (currentUser) return currentUser;

  const stored = localStorage.getItem('user');
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      return currentUser;
    } catch {
      return null;
    }
  }
  return null;
};

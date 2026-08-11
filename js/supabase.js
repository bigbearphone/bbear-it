import {SUPABASE_URL,SUPABASE_ANON_KEY} from './config.js';
const configured=Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
let client=null;
export function isSupabaseConfigured(){return configured}
export async function supabase(){
  if(!configured) return null;
  if(client) return client;
  const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2');
  client=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return client;
}
export async function getSession(){const sb=await supabase();if(!sb)return null;const {data,error}=await sb.auth.getSession();if(error)throw error;return data.session}
export async function signIn(email,password){const sb=await supabase();if(!sb)throw new Error('Supabase ยังไม่ได้ตั้งค่า');const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;return data}
export async function signOut(){const sb=await supabase();if(sb){const {error}=await sb.auth.signOut();if(error)throw error}}

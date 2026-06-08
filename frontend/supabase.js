// Frontend Supabase client (public anon key) - copied to frontend folder
const SUPABASE_URL = 'https://xaitvyfplvbchygsejjv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_IVL1sN_u0e5uF1Pmhz9HIQ_vRgK6gP8';

const supabase = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (!supabase) {
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/@supabase/supabase-js@2';
  script.onload = () => {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  };
  document.head.appendChild(script);
}

function getClient() { return window.supabaseClient || supabase; }

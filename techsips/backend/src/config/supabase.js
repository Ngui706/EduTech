import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

// Node.js 20 fallback for native WebSockets (needed by Supabase Realtime)
global.WebSocket = ws;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Service role client — full DB access (backend only, never expose to client)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: ws,
  },
});

export default supabase;

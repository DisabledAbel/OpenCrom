// db.js
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL,         // e.g., https://uassydhiqfrbbhrygbft.supabase.co
  process.env.SUPABASE_SERVICE_KEY  // service_role key
);

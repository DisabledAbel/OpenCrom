import { createClient } from "@supabase/supabase-js";

// Read secrets from environment variables
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

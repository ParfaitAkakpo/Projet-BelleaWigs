// src/integrations/supabase/client.ts

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY"
  );
}
console.log("SUPABASE URL =", import.meta.env.VITE_SUPABASE_URL);
console.log(
  "SUPABASE KEY (début) =",
  import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 15)
);



export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

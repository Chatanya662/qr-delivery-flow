// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://wjernvgrefrogxpqvrjh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZXJudmdyZWZyb2d4cHF2cmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NTM5ODIsImV4cCI6MjA2NDAyOTk4Mn0.dZIhS4NLSWCbt8gWpjeYnABiJrQdECllICk0BoSbxhE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
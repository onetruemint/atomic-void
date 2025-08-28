
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://wholpzshnpdijwlpghov.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const SupabasePersistence<T extends PersistenceData> implements Persistence<T>
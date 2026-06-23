import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function check() {
  // Query users
  const { data: users, error: uError } = await supabase.auth.admin.listUsers();
  console.log('Auth Users Count:', users?.users?.length);
  if (users?.users) {
    console.log('Auth Users:', users.users.map(u => ({ id: u.id, email: u.email })));
  }
  console.log('Auth Users Error:', uError);

  // Query profiles
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
  console.log('Profiles Count:', profiles?.length);
  console.log('Profiles:', profiles);
  console.log('Profiles Error:', pError);

  // Query reviews
  const { data: reviews, error: rError } = await supabase.from('reviews').select('*');
  console.log('Reviews Count:', reviews?.length);
  console.log('Reviews:', reviews);
  console.log('Reviews Error:', rError);
}

check();


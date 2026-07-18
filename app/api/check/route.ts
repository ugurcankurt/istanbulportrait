import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data: payments, error: pErr } = await supabaseAdmin.from('payments').select('*').limit(1);
  const { data: bookings, error: bErr } = await supabaseAdmin.from('bookings').select('*').limit(1);

  return NextResponse.json({
    payments: { data: payments, error: pErr, hasTable: !pErr || pErr.code !== '42P01' },
    bookings: {
      columns: bookings && bookings.length > 0 ? Object.keys(bookings[0]) : [],
      error: bErr
    }
  });
}
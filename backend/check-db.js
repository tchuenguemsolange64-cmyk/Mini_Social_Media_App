require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkDb() {
    console.log('Checking database tables and functions...');

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );

    // 1. Check 'users' table
    try {
        const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (error && error.code === '42P01') {
            console.log('❌ FAIL: "users" table DOES NOT exist.');
        } else if (error) {
            console.log('⚠️  WARN: Error checking "users" table:', error.message);
        } else {
            console.log('✅ PASS: "users" table exists.');
        }
    } catch (e) { console.error(e); }

    // 2. Check 'notification_preferences' table
    try {
        const { error } = await supabase.from('notification_preferences').select('count', { count: 'exact', head: true });
        if (error && error.code === '42P01') {
            console.log('❌ FAIL: "notification_preferences" table DOES NOT exist.');
            console.log('   >>> The trigger on "users" tries to insert here. If this is missing, signup FAILS.');
        } else if (error) {
            // RLS might block select, but table existence usually doesn't throw 42P01 if it exists
            console.log('⚠️  WARN: Error checking "notification_preferences":', error.message);
        } else {
            console.log('✅ PASS: "notification_preferences" table exists.');
        }
    } catch (e) { console.error(e); }

    // 3. Check uuid-ossp extension via a Remote Procedure Call (RPC) if possible, 
    // or just infer from previous success. 
    // Since we can't run raw SQL with anon key, we can't easily check extensions directly.
    // But if 'users' exists, usually extensions were attempted.

    console.log('\nIf everything passed above, but you still get "Database error", issues might be:');
    console.log('1. "uuid-ossp" extension is missing (required for uuid_generate_v4())');
    console.log('2. Triggers file was not run.');
}

checkDb();

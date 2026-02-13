require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Helper to wait
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function testAuthFlow() {
    console.log('--- STARTING AUTH FLOW TEST ---');

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );

    const timestamp = Date.now();
    const email = `test_user_${timestamp}@example.com`;
    const password = 'testPassword123!';
    const username = `user_${timestamp}`;

    console.log(`1. Attempting Signup for: ${email}`);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username,
                display_name: 'Test User'
            }
        }
    });

    if (signUpError) {
        console.error('❌ Signup Failed:', signUpError.message);
        if (signUpError.message.includes('rate limit')) {
            console.log('   (Rate limit hit - wait or disable email confirmation)');
        }
        return;
    }

    console.log('✅ Signup Successful!');
    console.log('   User ID:', signUpData.user?.id);

    console.log('\n2. Waiting 2 seconds for Triggers to run...');
    await sleep(2000);

    console.log('\n3. Verifying public.users table...');
    const { data: publicUser, error: publicError } = await supabase
        .from('users')
        .select('*')
        .eq('id', signUpData.user.id)
        .single();

    if (publicError || !publicUser) {
        console.error('❌ Public Profile Check Failed:', publicError?.message || 'User not found in public table');
    } else {
        console.log('✅ Public Profile Found!');
        console.log(`   Username: ${publicUser.username}`);
    }

    console.log('\n4. Attempting Login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error('❌ Login Failed:', loginError.message);
        return;
    }

    console.log('✅ Login Successful!');
    console.log('   Session Token:', loginData.session.access_token.substring(0, 20) + '...');

    console.log('\n5. Attempting Profile Fetch with Token (RLS Check)...');

    // Create client AS THE USER
    const userClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${loginData.session.access_token}`
                }
            }
        }
    );

    const { data: profileWithToken, error: tokenError } = await userClient
        .from('users')
        .select('*')
        .eq('id', loginData.user.id)
        .single();

    if (tokenError) {
        console.error('❌ Profile Fetch (Auth) Failed:', tokenError.message);
    } else {
        console.log('✅ Profile Fetch (Auth) Successful!');
    }

    console.log('\n--- TEST COMPLETE ---');
}

testAuthFlow();

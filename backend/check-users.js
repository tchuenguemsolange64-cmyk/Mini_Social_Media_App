require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkUsers() {
    console.log('Checking "public.users" table...');

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*');

        if (error) {
            console.error('Error fetching users:', error);
        } else {
            console.log(`Found ${data.length} users in public.users:`);
            data.forEach(u => {
                console.log(`- ID: ${u.id}`);
                console.log(`  Email: ${u.email}`);
                console.log(`  Username: ${u.username}`);
            });

            if (data.length === 0) {
                console.log('\n⚠️  TABLE IS EMPTY!');
                console.log('This means the Signup Trigger did NOT work.');
                console.log('The user exists in Auth, but not in the database.');
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkUsers();

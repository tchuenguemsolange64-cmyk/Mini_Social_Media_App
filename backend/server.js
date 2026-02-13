require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Auth middleware - NO JWT SECRET NEEDED!
const authMiddleware = async(req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        // Verify token by calling Supabase Auth server
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(403).json({ error: 'Authentication failed' });
    }
};


// ============ ROUTES ============

// Health check
app.get('/', (req, res) => {
    res.json({
        message: 'Server is running!',
        timestamp: new Date().toISOString()
    });
});

// Public route
app.get('/api/public', (req, res) => {
    res.json({ message: 'This is a public route' });
});

// Protected route example
app.get('/api/protected', authMiddleware, async(req, res) => {
    res.json({
        message: 'This is a protected route',
        user: req.user
    });
});

// Fetch public products
app.get('/api/products', async(req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, price')
            .eq('is_active', true);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        console.error('Supabase error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get user profile (protected)
app.get('/api/user-data', authMiddleware, async(req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

        res.json({ user, profile: data || null });
    } catch (err) {
        console.error('Error fetching user data:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============ AUTH ROUTES ============

// User registration
app.post('/auth/signup', async(req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;

        res.json({
            message: 'User registered successfully',
            user: data.user,
            session: data.session
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(400).json({ error: err.message });
    }
});

// User login
app.post('/auth/login', async(req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        res.json({
            message: 'Login successful',
            user: data.user,
            session: data.session
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(400).json({ error: err.message });
    }
});

// ============ ERROR HANDLING ============

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🔗 Connected to Supabase: ${process.env.SUPABASE_URL}`);
});

module.exports = app;
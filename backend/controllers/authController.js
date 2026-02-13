const { supabaseAdmin } = require('../models');

const authController = {
  // Register new user
  async signup(req, res) {
    try {
      const { email, password, username, display_name } = req.body;

      // Validation
      if (!email || !password || !username) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, and username are required'
        });
      }

      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          success: false,
          error: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
        });
      }

      // Check if username exists
      // Use req.supabase (likely anon client here) to check availability
      const { data: existingUser } = await req.supabase
        .from('users')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Username already taken'
        });
      }

      // Create auth user
      // Pass metadata so the database trigger can populate the public.users table
      const { data: authData, error: authError } = await req.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase(),
            display_name: display_name || username
          }
        }
      });

      if (authError) throw authError;

      // Note: Data insertion into public.users is handled by the database trigger 'on_auth_user_created'
      // attempting to manually insert here could cause race conditions or duplicate key errors.

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email for verification link if enabled.',
        data: {
          user: {
            id: authData.user?.id,
            email: authData.user?.email,
            username: username.toLowerCase(),
            display_name: display_name || username
          },
          session: authData.session
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      const { data, error } = await req.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Get user profile using req.supabase
      // Note: RLS policies must allow users to read their own profile

      const { data: profile, error: profileError } = await req.supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }

      // Update last login
      // We attempt to update, but if RLS prevents it (e.g. only allow update matching auth.uid()) and we are using anon client with just a session...
      // Actually, req.supabase SHOULD have the token if we set it?
      // No, in 'login', req.supabase is initialized with the request headers. The request headers do NOT contain the token yet.
      // So req.supabase is ANON.
      // To update the user's last_login, we would need to use a client authenticated with the NEW session.
      // Or use supabaseAdmin.
      // Let's use supabaseAdmin for this system task if available, or skip it.

      if (supabaseAdmin) {
        await supabaseAdmin
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: profile || data.user,
          session: data.session
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  },

  // Logout user
  async logout(req, res) {
    try {
      const { error } = await req.supabase.auth.signOut();
      if (error) throw error;

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get current user
  async me(req, res) {
    try {
      // req.user is set by middleware, but we should verify with DB
      const userId = req.user.id; // From middleware

      // Use req.supabase which is authenticated for this user
      const { data, error } = await req.supabase
        .from('users')
        .select(`
          *,
          followers_count:followers!followers_following_id_fkey(count),
          following_count:followers!followers_follower_id_fkey(count),
          posts_count:posts(count)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Update last login async
      // This works because req.supabase has the user's token
      await req.supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Refresh token
  async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
      }

      const { data, error } = await req.supabase.auth.refreshSession({
        refresh_token
      });

      if (error) throw error;

      res.json({
        success: true,
        data: {
          session: data.session
        }
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
  },

  // Request password reset
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const { error } = await req.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });

      if (error) throw error;

      res.json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Update password
  async updatePassword(req, res) {
    try {
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters'
        });
      }

      const { error } = await req.supabase.auth.updateUser({
        password
      });

      if (error) throw error;

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Verify email
  async verifyEmail(req, res) {
    try {
      const { token_hash, type } = req.query;

      if (!token_hash || type !== 'email') {
        return res.status(400).json({
          success: false,
          error: 'Invalid verification link'
        });
      }

      const { error } = await req.supabase.auth.verifyOtp({
        token_hash,
        type: 'email'
      });

      if (error) throw error;

      res.json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      console.error('Verify email error:', error);
      res.status(400).json({
        success: false,
        error: 'Invalid or expired verification link'
      });
    }
  },

  // Social login (Google, GitHub, etc.)
  async socialLogin(req, res) {
    try {
      const { provider } = req.body;

      const { data, error } = await req.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${process.env.FRONTEND_URL}/auth/callback`
        }
      });

      if (error) throw error;

      res.json({
        success: true,
        data: {
          url: data.url
        }
      });
    } catch (error) {
      console.error('Social login error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = authController;

import { supabase } from './supabase';

export interface SignUpData {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const authService = {
  // Sign up with email and password
  async signUp({ fullName, email, password }: SignUpData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: fullName,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) throw error;

    // Create user profile in users table after auth user is created
    // The database trigger should handle this automatically, but we'll add a fallback
    if (data.user) {
      // Wait for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify user was created in users table, if not create manually
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single();
      
      // Fallback: Create manually if trigger didn't work
      if (!existingProfile) {
        console.log('Trigger did not create user, creating manually...');
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              username: fullName,
              email: email,
              online: true,
              last_seen: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Still don't throw - user exists in auth
        } else {
          console.log('User profile created successfully');
        }
      } else {
        console.log('User profile already exists from trigger');
      }
    }

    return data;
  },

  // Login with email and password
  async login({ email, password }: LoginData) {
    console.log('Login attempt for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Auth error:', error);
      throw error;
    }

    console.log('Auth successful');

    // Update online status in background - don't wait for it
    if (data.user) {
      supabase
        .from('users')
        .update({
          online: true,
          last_seen: new Date().toISOString(),
        })
        .eq('id', data.user.id)
        .then(({ error: updateError }) => {
          if (updateError) {
            console.error('Profile update error:', updateError);
          } else {
            console.log('Online status updated');
          }
        });
    }

    return data;
  },

  // Logout
  async logout() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Set user offline with last_seen timestamp
      await supabase
        .from('users')
        .update({ 
          online: false,
          last_seen: new Date().toISOString()
        })
        .eq('id', user.id);
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Send verification code for password reset
  async sendPasswordResetCode(email: string) {
    // Generate 6-digit code
    const code = generateVerificationCode();
    
    // Store code in database (expires in 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    const { error } = await supabase
      .from('verification_codes')
      .insert([
        {
          email,
          code,
          type: 'password_reset',
          expires_at: expiresAt.toISOString(),
        },
      ]);

    if (error) throw error;

    // In a real app, you'd send this via email service
    // For now, we'll just return it (in production, remove this)
    console.log(`Verification code for ${email}: ${code}`);
    alert(`Your verification code is: ${code}\n(In production, this would be sent via email)`);
    
    return { code }; // Remove this in production
  },

  // Verify code
  async verifyResetCode(email: string, code: string) {
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('type', 'password_reset')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      throw new Error('Invalid or expired verification code');
    }

    return data;
  },

  // Reset password with verification code
  async resetPasswordWithCode(email: string, code: string, newPassword: string) {
    // Verify the code first
    const verification = await this.verifyResetCode(email, code);

    // Mark code as used
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', verification.id);

    // Get user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === email);

    if (!user) {
      throw new Error('User not found');
    }

    // Update password using admin API (requires service role key in production)
    // For now, we'll use the regular update which requires the user to be logged in
    // In production, you'd need to implement this on the backend with service role key
    
    // Alternative: Create a temporary session and update password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: newPassword, // This won't work, just for demo
    });

    // Since we can't update password without being logged in,
    // we'll need to use a different approach
    throw new Error('Password reset requires backend implementation with service role key');
  },

  // Update password (when user is logged in)
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },
};

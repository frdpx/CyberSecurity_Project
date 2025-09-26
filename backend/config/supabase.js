import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl =  process.env.SUPABASE_URL
const supabaseAnonKey =  process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// สำหรับใช้งานทั่วไป (client-side operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// สำหรับใช้งาน admin (bypass RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper function สำหรับ verify JWT token
export const verifySupabaseToken = async (token) => {
  try {
    const { data: user, error } = await supabase.auth.getUser(token)
    
    if (error) {
      throw new Error(error.message)
    }
    
    return { user: user.user, error: null }
  } catch (error) {
    return { user: null, error: error.message }
  }
}

// Test Supabase connection
export const testSupabaseConnection = async () => {
  console.log('🔌 Testing Supabase connection...')
  
  try {
    // Test 1: Basic connection test with profiles table
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (profilesError) {
      console.error('❌ Supabase profiles table access failed:', profilesError.message)
    } else {
      console.log('✅ Profiles table accessible')
    }
    
    // Test 2: Test audit_logs table
    const { data: auditTest, error: auditError } = await supabase
      .from('audit_logs')
      .select('count')
      .limit(1)
    
    if (auditError) {
      console.error('❌ Audit logs table access failed:', auditError.message)
    } else {
      console.log('✅ Audit logs table accessible')
    }
    
    // Test 3: Test login_attempts table
    const { data: loginTest, error: loginError } = await supabase
      .from('login_attempts')
      .select('count')
      .limit(1)
    
    if (loginError) {
      console.error('❌ Login attempts table access failed:', loginError.message)
    } else {
      console.log('✅ Login attempts table accessible')
    }
    
    // Check if any table access failed
    const hasErrors = profilesError || auditError || loginError
    
    if (hasErrors) {
      console.warn('⚠️  Some Supabase tables are not accessible')
      console.warn('   Please ensure tables exist and RLS policies are configured')
    }
    
    // Display connection info
    console.log(`📡 Supabase URL: ${supabaseUrl}`)    
    return !hasErrors
    
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error.message)
    console.error('💡 Please check your environment variables:')
    console.error('   - SUPABASE_URL')
    console.error('   - SUPABASE_ANON_KEY')
    return false
  }
}

export default { 
  supabase,
  verifySupabaseToken,
  testSupabaseConnection
}
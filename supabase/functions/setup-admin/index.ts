import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create admin user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: 'adiraj@admin.local',
      password: 'Patacharkuchi@890',
      email_confirm: true,
      user_metadata: {
        username: 'adiraj'
      }
    })

    if (userError) {
      // Check if user already exists
      if (userError.message.includes('already registered')) {
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = users.find(u => u.email === 'adiraj@admin.local')
        
        if (existingUser) {
          // Check if already has admin role
          const { data: roleData } = await supabaseAdmin
            .from('user_roles')
            .select('*')
            .eq('user_id', existingUser.id)
            .eq('role', 'admin')
            .single()

          if (!roleData) {
            // Assign admin role
            const { error: roleError } = await supabaseAdmin
              .from('user_roles')
              .insert({ user_id: existingUser.id, role: 'admin' })
            
            if (roleError) throw roleError
          }

          return new Response(
            JSON.stringify({ message: 'Admin user already exists and has admin role' }),
            { headers: { 'Content-Type': 'application/json' }, status: 200 }
          )
        }
      }
      throw userError
    }

    // Assign admin role to the new user
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userData.user.id,
        role: 'admin'
      })

    if (roleError) throw roleError

    return new Response(
      JSON.stringify({ 
        message: 'Admin user created successfully',
        email: 'adiraj@admin.local'
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

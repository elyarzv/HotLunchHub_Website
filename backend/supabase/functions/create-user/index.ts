import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, name, role, admin_code, employee_code, company_id, phone, address_line1, address_line2, city, postal_code, picture_url } = await req.json()

    const { data: authData, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) throw createError
    const userId = authData.user.id

    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: userId,
        role,
        full_name: name,
        status: 'active',
      })

    if (profileError) throw profileError
    
    let roleRecordError = null
    switch (role) {
      case 'admin':
        const { error: adminError } = await supabaseClient
          .from('admins')
          .insert({
            auth_id: userId,
            name,
            admin_code,
            email,
            phone,
          })
        roleRecordError = adminError
        break
      case 'driver':
        const { error: driverError } = await supabaseClient
          .from('drivers')
          .insert({
            auth_id: userId,
            name,
            email,
            phone,
          })
        roleRecordError = driverError
        break
      case 'cook':
        const { error: cookError } = await supabaseClient
          .from('cooks')
          .insert({
            auth_id: userId,
            name,
            email,
            phone,
            address_line1,
            address_line2,
            city,
            postal_code,
            picture_url,
          })
        roleRecordError = cookError
        break
      case 'employee':
        const { error: employeeError } = await supabaseClient
          .from('employees')
          .insert({
            auth_id: userId,
            name,
            employee_code,
            email,
            phone,
            company_id,
          })
        roleRecordError = employeeError
        break
    }

    if (roleRecordError) throw roleRecordError

    return new Response(
      JSON.stringify({ success: true, userId, message: `${role} user created successfully` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

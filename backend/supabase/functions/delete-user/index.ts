import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { recordId, recordType, authId } = await req.json()

    if (!recordId || !recordType || !authId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: recordId, recordType, authId' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Deleting ${recordType} with ID: ${recordId}, authId: ${authId}`)

    // Delete from the specific role table first
    let deleteResult
    switch (recordType) {
      case 'employee':
        deleteResult = await supabaseClient
          .from('employees')
          .delete()
          .eq('employee_id', recordId)
        break
      case 'cook':
        deleteResult = await supabaseClient
          .from('cooks')
          .delete()
          .eq('cook_id', recordId)
        break
      case 'driver':
        deleteResult = await supabaseClient
          .from('drivers')
          .delete()
          .eq('driver_id', recordId)
        break
      case 'company':
        deleteResult = await supabaseClient
          .from('companies')
          .delete()
          .eq('company_id', recordId)
        break
      case 'meal':
        deleteResult = await supabaseClient
          .from('meals')
          .delete()
          .eq('meal_id', recordId)
        break
      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Invalid record type: ${recordType}` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    if (deleteResult.error) {
      console.error('Error deleting from role table:', deleteResult.error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to delete from ${recordType} table: ${deleteResult.error.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Delete from profiles table (only for user records)
    if (recordType !== 'company' && recordType !== 'meal' && authId) {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .delete()
        .eq('id', authId)

      if (profileError) {
        console.error('Error deleting from profiles table:', profileError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to delete from profiles table: ${profileError.message}` 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Delete from auth.users table (only for user records, not companies or meals)
    if (recordType !== 'company' && recordType !== 'meal' && authId) {
      const { error: authError } = await supabaseClient.auth.admin.deleteUser(authId)
      
      if (authError) {
        console.error('Error deleting from auth.users:', authError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to delete from auth.users: ${authError.message}` 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    console.log(`Successfully deleted ${recordType} with ID: ${recordId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${recordType} deleted successfully` 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in delete-user function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

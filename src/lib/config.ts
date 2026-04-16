// Config file with Supabase values
// These will be embedded in the deployment

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hhifxpouzuwzbmrbegmg.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Zf_OlRWyy5Z2opeTe1Nh5w_RxIQC4vg',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  }
}

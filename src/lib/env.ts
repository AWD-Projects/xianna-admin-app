import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_SUPABASE_STORAGE_URL: z.string().url().optional(),
  NEXT_PUBLIC_BLOGS_BUCKET: z.string().optional(),
  NEXT_PUBLIC_OUTFITS_BUCKET: z.string().optional(),
  NEXT_PUBLIC_ADMIN_EMAIL: z.string().email(),
})

export const env = envSchema.parse(process.env)
export type Env = z.infer<typeof envSchema>

# Happy Ministry Supabase Setup

This version is prepared so the website connects to **your own Supabase project**, not Bolt's environment.

## 1. Create your Supabase project

1. Go to Supabase and create a new project.
2. Open **Project Settings → API**.
3. Copy:
   - Project URL
   - `anon` / public key
4. Put them in `.env`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Do **not** put the service role key in this frontend project.

## 2. Run the database migrations

In Supabase Dashboard, open **SQL Editor**, then run these files in order:

1. `supabase/migrations/20260616071255_001_ministry_content_system.sql`
2. `supabase/migrations/20260616083000_002_security_audio_storage.sql`

These create:

- `posts`
- `comments`
- `reactions`
- `admin_users`
- `word-audio` storage bucket
- Row Level Security policies

Supabase recommends RLS for browser apps because policies protect tables at the database layer, and Storage uploads also require explicit RLS policies. See Supabase RLS and Storage access control docs.

## 3. Create the admin login account

1. Supabase Dashboard → **Authentication → Users**.
2. Click **Add user**.
3. Create the admin email and password you want.
4. Copy the new user's `id`.

## 4. Allow that user to be admin

Run this in Supabase SQL Editor, replacing the values:

```sql
insert into public.admin_users (user_id, email)
values ('PASTE_AUTH_USER_ID_HERE', 'your-admin-email@example.com')
on conflict (user_id) do update set email = excluded.email;
```

Only users inside `admin_users` can create, edit, delete posts, or upload audio.

## 5. Run locally

```bash
npm install
npm run dev
```

## 6. Deploy under your control

You can deploy this to Netlify, Vercel, Cloudflare Pages, or your own hosting. Add the same environment variables there:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## What changed in this version

- Sign-in now navigates directly to the admin dashboard after successful login.
- Landing page now shows only the latest posted Word.
- A separate Words page shows all Words with search and date filtering.
- Comments and reactions are tied to each post.
- Admin upload form supports audio URL, audio file upload, and browser voice recording.
- Mobile admin upload layout has been adjusted to avoid overlaps without changing the existing design/color direction.
- Database security is stronger: admin rights are controlled from Supabase through `admin_users`, not just frontend email checking.

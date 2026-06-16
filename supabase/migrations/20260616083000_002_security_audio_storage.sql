/*
# Security hardening and audio storage

This migration adds a database-controlled admin allow-list and a public audio bucket.
Only users listed in admin_users can create/update/delete posts or upload audio.
*/

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "admin_users_read_own" on public.admin_users;
create policy "admin_users_read_own"
on public.admin_users for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- Tighten post admin policies: public can read published posts, only admin_users can write.
drop policy if exists "posts_admin_write" on public.posts;
create policy "posts_admin_write"
on public.posts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Admin users should also see drafts in the dashboard.
drop policy if exists "posts_admin_read_all" on public.posts;
create policy "posts_admin_read_all"
on public.posts for select
to authenticated
using (public.is_admin());

-- Allow public reaction deletion for removing the same visitor's reaction.
drop policy if exists "reactions_public_delete" on public.reactions;
create policy "reactions_public_delete"
on public.reactions for delete
to anon, authenticated
using (true);

-- Create a public bucket for audio files used by the website player.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'word-audio',
  'word-audio',
  true,
  52428800,
  array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public can read audio; only admins can upload/update/delete audio.
drop policy if exists "word_audio_public_read" on storage.objects;
create policy "word_audio_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'word-audio');

drop policy if exists "word_audio_admin_insert" on storage.objects;
create policy "word_audio_admin_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'word-audio' and public.is_admin());

drop policy if exists "word_audio_admin_update" on storage.objects;
create policy "word_audio_admin_update"
on storage.objects for update
to authenticated
using (bucket_id = 'word-audio' and public.is_admin())
with check (bucket_id = 'word-audio' and public.is_admin());

drop policy if exists "word_audio_admin_delete" on storage.objects;
create policy "word_audio_admin_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'word-audio' and public.is_admin());

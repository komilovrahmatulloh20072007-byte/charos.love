# Charos Final Love

## Ishlatish

```powershell
bun i
bun run dev
```

Ochish:

```txt
http://localhost:3000
http://localhost:3000/admin
```

## Video

Video faylni shu joyga qo'ying:

```txt
public/assets/video/vd.mp4
```

## .env

`.env.example` faylni `.env` qilib ko'chiring:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
ADMIN_PASSWORD=charos2026
PORT=3000
```

## Supabase SQL

```sql
drop table if exists love_answers cascade;

create table love_answers (
    id bigint generated always as identity primary key,
    answers jsonb not null,
    created_at timestamptz default now()
);

alter table love_answers enable row level security;

create policy "allow_insert"
on love_answers
for insert
to anon
with check (true);

create policy "allow_select"
on love_answers
for select
to anon
using (true);

create policy "allow_update"
on love_answers
for update
to anon
using (true)
with check (true);

create policy "allow_delete"
on love_answers
for delete
to anon
using (true);
```

create table if not exists public.cinema_rooms (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null unique references public.couples(id) on delete cascade,
  host_user_id uuid references public.profiles(id) on delete set null,
  title text not null default '',
  episode_label text not null default '',
  crunchyroll_url text not null default '',
  status text not null default 'idle' check (status in ('idle','countdown','playing','paused','ended')),
  position_seconds numeric(10,2) not null default 0 check (position_seconds >= 0),
  countdown_ends_at timestamptz,
  playback_started_at timestamptz,
  ready_user_ids uuid[] not null default '{}',
  last_action_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cinema_reactions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.cinema_rooms(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now()
);

create index if not exists cinema_reactions_room_created_idx
  on public.cinema_reactions(room_id, created_at desc);

create or replace function public.touch_cinema_room_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.touch_cinema_room_updated_at() from public, anon, authenticated;

drop trigger if exists cinema_rooms_touch_updated_at on public.cinema_rooms;
create trigger cinema_rooms_touch_updated_at
before update on public.cinema_rooms
for each row execute function public.touch_cinema_room_updated_at();

alter table public.cinema_rooms enable row level security;
alter table public.cinema_reactions enable row level security;

revoke all on public.cinema_rooms from anon;
revoke all on public.cinema_reactions from anon;
grant select, insert, update, delete on public.cinema_rooms to authenticated;
grant select, insert, delete on public.cinema_reactions to authenticated;

drop policy if exists cinema_rooms_select_couple on public.cinema_rooms;
create policy cinema_rooms_select_couple
on public.cinema_rooms for select
to authenticated
using (public.is_couple_member(couple_id));

drop policy if exists cinema_rooms_insert_couple on public.cinema_rooms;
create policy cinema_rooms_insert_couple
on public.cinema_rooms for insert
to authenticated
with check (public.is_couple_member(couple_id) and auth.uid() = host_user_id);

drop policy if exists cinema_rooms_update_couple on public.cinema_rooms;
create policy cinema_rooms_update_couple
on public.cinema_rooms for update
to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

drop policy if exists cinema_rooms_delete_couple on public.cinema_rooms;
create policy cinema_rooms_delete_couple
on public.cinema_rooms for delete
to authenticated
using (public.is_couple_member(couple_id));

drop policy if exists cinema_reactions_select_couple on public.cinema_reactions;
create policy cinema_reactions_select_couple
on public.cinema_reactions for select
to authenticated
using (public.is_couple_member(couple_id));

drop policy if exists cinema_reactions_insert_self on public.cinema_reactions;
create policy cinema_reactions_insert_self
on public.cinema_reactions for insert
to authenticated
with check (public.is_couple_member(couple_id) and auth.uid() = user_id);

drop policy if exists cinema_reactions_delete_self on public.cinema_reactions;
create policy cinema_reactions_delete_self
on public.cinema_reactions for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.toggle_cinema_ready(p_room_id uuid)
returns public.cinema_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.cinema_rooms;
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select * into v_room from public.cinema_rooms where id = p_room_id;
  if v_room.id is null or not public.is_couple_member(v_room.couple_id) then
    raise exception 'Sala não encontrada.';
  end if;

  update public.cinema_rooms
  set ready_user_ids = case
        when v_user = any(ready_user_ids) then array_remove(ready_user_ids, v_user)
        else array_append(ready_user_ids, v_user)
      end,
      last_action_by = v_user
  where id = p_room_id
  returning * into v_room;

  return v_room;
end;
$$;

revoke all on function public.toggle_cinema_ready(uuid) from public, anon;
grant execute on function public.toggle_cinema_ready(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cinema_rooms'
  ) then
    alter publication supabase_realtime add table public.cinema_rooms;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cinema_reactions'
  ) then
    alter publication supabase_realtime add table public.cinema_reactions;
  end if;
end $$;

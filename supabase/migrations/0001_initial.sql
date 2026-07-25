-- My love is You — banco inicial seguro para dois usuários conectados.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Meu amor',
  avatar_key text not null default 'adriel',
  level integer not null default 24 check (level between 1 and 999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Nosso espaço',
  invite_code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id),
  unique (user_id)
);

create table if not exists public.couple_settings (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  next_meeting date,
  distance_km integer not null default 125,
  theme text not null default 'sakura',
  updated_at timestamptz not null default now()
);

create table if not exists public.couple_progress (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  xp integer not null default 8480,
  affinity integer not null default 84 check (affinity between 0 and 100),
  coins integer not null default 140,
  couple_level integer not null default 8,
  streak integer not null default 0,
  last_completed_day date,
  updated_at timestamptz not null default now()
);

create table if not exists public.pet_states (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  name text not null default 'Mochi',
  level integer not null default 15,
  xp integer not null default 72 check (xp between 0 and 99),
  hunger integer not null default 78 check (hunger between 0 and 100),
  love integer not null default 84 check (love between 0 and 100),
  energy integer not null default 75 check (energy between 0 and 100),
  last_decay_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  type text not null default 'daily' check (type in ('daily','weekly','boss')),
  xp_reward integer not null default 10,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.mission_completions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  completed_by uuid not null references auth.users(id) on delete cascade,
  completion_date date not null default current_date,
  xp_earned integer not null default 0,
  created_at timestamptz not null default now(),
  unique (couple_id, mission_id, completion_date)
);

create table if not exists public.moods (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mood_key text not null,
  emoji text not null,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.drawings (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  storage_path text,
  preview_url text,
  caption text,
  seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text,
  storage_path text,
  preview_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.time_capsules (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  open_at date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cost integer not null check (cost > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  reward_id uuid not null references public.rewards(id),
  redeemed_by uuid not null references auth.users(id),
  cost integer not null,
  status text not null default 'available' check (status in ('available','used','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.is_couple_member(p_couple_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.couple_members cm where cm.couple_id = p_couple_id and cm.user_id = auth.uid()); $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_name text := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Meu amor');
  v_is_maria boolean := lower(v_name) like 'maria%';
begin
  insert into public.profiles(id, display_name, avatar_key, level)
  values(new.id, v_name, case when v_is_maria then 'maria' else 'adriel' end, case when v_is_maria then 25 else 24 end)
  on conflict(id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.create_couple(p_name text, p_invite_code text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Usuário não autenticado'; end if;
  if exists(select 1 from public.couple_members where user_id = auth.uid()) then raise exception 'Você já pertence a um casal'; end if;
  insert into public.couples(name, invite_code, created_by) values(p_name, upper(p_invite_code), auth.uid()) returning id into v_id;
  insert into public.couple_members(couple_id,user_id,role) values(v_id,auth.uid(),'owner');
  insert into public.couple_settings(couple_id) values(v_id);
  insert into public.couple_progress(couple_id) values(v_id);
  insert into public.pet_states(couple_id) values(v_id);
  return v_id;
end;
$$;

create or replace function public.join_couple(p_invite_code text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare v_id uuid; v_count integer;
begin
  if auth.uid() is null then raise exception 'Usuário não autenticado'; end if;
  if exists(select 1 from public.couple_members where user_id = auth.uid()) then raise exception 'Você já pertence a um casal'; end if;
  select id into v_id from public.couples where invite_code = upper(trim(p_invite_code));
  if v_id is null then raise exception 'Código de casal inválido'; end if;
  select count(*) into v_count from public.couple_members where couple_id = v_id;
  if v_count >= 2 then raise exception 'Este espaço já possui duas pessoas'; end if;
  insert into public.couple_members(couple_id,user_id,role) values(v_id,auth.uid(),'member');
  return v_id;
end;
$$;

grant execute on function public.create_couple(text,text) to authenticated;
grant execute on function public.join_couple(text) to authenticated;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger touch_profiles before update on public.profiles for each row execute function public.touch_updated_at();
create trigger touch_settings before update on public.couple_settings for each row execute function public.touch_updated_at();
create trigger touch_progress before update on public.couple_progress for each row execute function public.touch_updated_at();
create trigger touch_pet before update on public.pet_states for each row execute function public.touch_updated_at();

create or replace function public.handle_mission_completion()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_xp integer;
  v_active integer;
  v_done integer;
  v_last date;
  v_streak integer;
begin
  select xp_reward into v_xp from public.missions where id = new.mission_id;
  new.xp_earned := coalesce(v_xp,0);
  update public.couple_progress
  set xp = xp + new.xp_earned,
      coins = coins + greatest(1, ceil(new.xp_earned / 3.0)::integer),
      affinity = least(100, affinity + 1)
  where couple_id = new.couple_id;

  select count(*) into v_active from public.missions where active and type = 'daily';
  select count(*) into v_done from public.mission_completions mc join public.missions m on m.id=mc.mission_id
   where mc.couple_id=new.couple_id and mc.completion_date=new.completion_date and m.active and m.type='daily';
  -- NEW ainda não está visível na consulta BEFORE INSERT.
  v_done := v_done + 1;
  if v_active > 0 and v_done >= v_active then
    select last_completed_day, streak into v_last, v_streak from public.couple_progress where couple_id=new.couple_id for update;
    if v_last is distinct from new.completion_date then
      update public.couple_progress set
        streak = case when v_last = new.completion_date - 1 then v_streak + 1 else 1 end,
        last_completed_day = new.completion_date,
        xp = xp + 40,
        coins = coins + 20
      where couple_id=new.couple_id;
    end if;
  end if;
  return new;
end;
$$;
create trigger mission_completion_progress before insert on public.mission_completions for each row execute function public.handle_mission_completion();

create or replace function public.handle_message_xp()
returns trigger language plpgsql security definer set search_path = public
as $$ begin update public.couple_progress set xp=xp+3 where couple_id=new.couple_id; return new; end; $$;
create trigger message_xp after insert on public.messages for each row execute function public.handle_message_xp();

create or replace function public.handle_memory_xp()
returns trigger language plpgsql security definer set search_path = public
as $$ begin update public.couple_progress set xp=xp+12, coins=coins+4 where couple_id=new.couple_id; return new; end; $$;
create trigger memory_xp after insert on public.memories for each row execute function public.handle_memory_xp();

create or replace function public.handle_drawing_xp()
returns trigger language plpgsql security definer set search_path = public
as $$ begin update public.couple_progress set xp=xp+15, affinity=least(100,affinity+1) where couple_id=new.couple_id; return new; end; $$;
create trigger drawing_xp after insert on public.drawings for each row execute function public.handle_drawing_xp();

-- RLS
alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.couple_settings enable row level security;
alter table public.couple_progress enable row level security;
alter table public.pet_states enable row level security;
alter table public.missions enable row level security;
alter table public.mission_completions enable row level security;
alter table public.moods enable row level security;
alter table public.messages enable row level security;
alter table public.drawings enable row level security;
alter table public.memories enable row level security;
alter table public.time_capsules enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.notifications enable row level security;

create policy "profiles_self_or_partner_read" on public.profiles for select to authenticated using (
  id = auth.uid() or exists(
    select 1 from public.couple_members me join public.couple_members them on them.couple_id=me.couple_id
    where me.user_id=auth.uid() and them.user_id=profiles.id
  )
);
create policy "profiles_self_update" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy "couples_members_read" on public.couples for select to authenticated using(public.is_couple_member(id));
create policy "members_members_read" on public.couple_members for select to authenticated using(public.is_couple_member(couple_id));
create policy "settings_members_all" on public.couple_settings for all to authenticated using(public.is_couple_member(couple_id)) with check(public.is_couple_member(couple_id));
create policy "progress_members_read" on public.couple_progress for select to authenticated using(public.is_couple_member(couple_id));
create policy "pet_members_all" on public.pet_states for all to authenticated using(public.is_couple_member(couple_id)) with check(public.is_couple_member(couple_id));
create policy "missions_authenticated_read" on public.missions for select to authenticated using(active=true);
create policy "completions_members_read" on public.mission_completions for select to authenticated using(public.is_couple_member(couple_id));
create policy "completions_member_insert" on public.mission_completions for insert to authenticated with check(public.is_couple_member(couple_id) and completed_by=auth.uid());
create policy "completions_own_delete" on public.mission_completions for delete to authenticated using(public.is_couple_member(couple_id) and completed_by=auth.uid());
create policy "moods_members_read" on public.moods for select to authenticated using(public.is_couple_member(couple_id));
create policy "moods_own_insert" on public.moods for insert to authenticated with check(public.is_couple_member(couple_id) and user_id=auth.uid());
create policy "messages_members_read" on public.messages for select to authenticated using(public.is_couple_member(couple_id));
create policy "messages_own_insert" on public.messages for insert to authenticated with check(public.is_couple_member(couple_id) and sender_id=auth.uid());
create policy "messages_own_update" on public.messages for update to authenticated using(public.is_couple_member(couple_id)) with check(public.is_couple_member(couple_id));
create policy "drawings_members_read" on public.drawings for select to authenticated using(public.is_couple_member(couple_id));
create policy "drawings_own_insert" on public.drawings for insert to authenticated with check(public.is_couple_member(couple_id) and author_id=auth.uid());
create policy "memories_members_read" on public.memories for select to authenticated using(public.is_couple_member(couple_id));
create policy "memories_own_insert" on public.memories for insert to authenticated with check(public.is_couple_member(couple_id) and author_id=auth.uid());
create policy "capsules_members_read" on public.time_capsules for select to authenticated using(public.is_couple_member(couple_id));
create policy "capsules_own_insert" on public.time_capsules for insert to authenticated with check(public.is_couple_member(couple_id) and author_id=auth.uid());
create policy "rewards_authenticated_read" on public.rewards for select to authenticated using(active=true);
create policy "redemptions_members_read" on public.reward_redemptions for select to authenticated using(public.is_couple_member(couple_id));
create policy "redemptions_own_insert" on public.reward_redemptions for insert to authenticated with check(public.is_couple_member(couple_id) and redeemed_by=auth.uid());
create policy "notifications_own_read" on public.notifications for select to authenticated using(recipient_id=auth.uid());
create policy "notifications_own_update" on public.notifications for update to authenticated using(recipient_id=auth.uid()) with check(recipient_id=auth.uid());

-- Buckets privados e políticas de Storage.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('couple-media','couple-media',false,10485760,array['image/jpeg','image/png','image/webp']),
       ('drawings','drawings',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;

create policy "couple_media_members_select" on storage.objects for select to authenticated using (
  bucket_id='couple-media' and public.is_couple_member(((storage.foldername(name))[1])::uuid)
);
create policy "couple_media_members_insert" on storage.objects for insert to authenticated with check (
  bucket_id='couple-media' and public.is_couple_member(((storage.foldername(name))[1])::uuid)
);
create policy "drawings_members_select" on storage.objects for select to authenticated using (
  bucket_id='drawings' and public.is_couple_member(((storage.foldername(name))[1])::uuid)
);
create policy "drawings_members_insert" on storage.objects for insert to authenticated with check (
  bucket_id='drawings' and public.is_couple_member(((storage.foldername(name))[1])::uuid)
);

insert into public.missions(key,title,type,xp_reward,sort_order) values
  ('talk','Conversar por 30 minutos','daily',20,1),
  ('compliment','Enviar um elogio sincero','daily',15,2),
  ('watch','Assistir algo juntos','daily',25,3)
on conflict(key) do update set title=excluded.title,xp_reward=excluded.xp_reward,sort_order=excluded.sort_order,active=true;

insert into public.rewards(title,cost) values
  ('Escolher o próximo filme',80),
  ('Vale milkshake de morango',120),
  ('Planejar o próximo encontro',180),
  ('Carta secreta desbloqueada',250)
on conflict do nothing;

-- Realtime (ignora se já estiver publicado).
do $$
declare t text;
begin
  foreach t in array array['messages','moods','mission_completions','couple_progress','pet_states','memories','drawings','time_capsules','couple_settings','reward_redemptions'] loop
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

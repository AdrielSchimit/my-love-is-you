-- My love is You — endurecimento de funções expostas pela API.
-- Mantém somente as RPCs necessárias disponíveis para usuários autenticados.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_mission_completion() from public, anon, authenticated;
revoke all on function public.handle_message_xp() from public, anon, authenticated;
revoke all on function public.handle_memory_xp() from public, anon, authenticated;
revoke all on function public.handle_drawing_xp() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;

revoke all on function public.create_couple(text, text) from public, anon;
revoke all on function public.join_couple(text) from public, anon;
revoke all on function public.is_couple_member(uuid) from public, anon;

grant execute on function public.create_couple(text, text) to authenticated;
grant execute on function public.join_couple(text) to authenticated;
grant execute on function public.is_couple_member(uuid) to authenticated;

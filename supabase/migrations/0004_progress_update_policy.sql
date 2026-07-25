-- Permite que usuários atualizem diretamente sua afinidade e XP ao clicar no coração.
create policy "progress_members_update" on public.couple_progress 
  for update 
  to authenticated 
  using (public.is_couple_member(couple_id)) 
  with check (public.is_couple_member(couple_id));

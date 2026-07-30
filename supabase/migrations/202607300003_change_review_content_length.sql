begin;

alter table public.reviews
  drop constraint if exists reviews_content_check;

alter table public.reviews
  add constraint reviews_content_check
  check (
    content = btrim(content)
    and char_length(content) between 5 and 999
  );

commit;

alter table public.events
    add column if not exists is_tentative boolean not null default false;

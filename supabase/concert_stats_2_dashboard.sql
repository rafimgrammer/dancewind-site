-- =====================================================================
-- 2026 정기공연 방문 기록 — 2단계 (통계 대시보드용 함수)
-- 1단계(concert_stats_1_tracking.sql)와 비밀번호 한 줄을 먼저 실행한 뒤,
-- Supabase > SQL Editor 에 이 파일 전체를 붙여넣고 [Run]. 여러 번 실행해도 괜찮아요.
--
-- 왜 함수(security definer)로만 꺼내나요?
--   · 표에는 읽기 정책이 하나도 없어서 브라우저(anon 키)는 아무것도 직접 못 읽어요.
--   · security definer 함수는 "함수를 만든 사람(DB 주인)" 권한으로 실행돼서 RLS 를 거치지 않아요.
--     그래서 함수 안에서 먼저 비밀번호를 확인하고, 맞을 때만 "집계한 숫자"를 돌려줘요.
--   · 정책끼리 서로 다른 표를 참조할 일이 없으니 무한재귀(42P17)도 생길 수 없어요.
--   · 원본 행(visitor_id 같은 개인 식별값)은 절대 밖으로 내보내지 않아요.
--   · set search_path 를 고정하는 건, 누가 같은 이름의 가짜 함수/표를 만들어 끼워 넣는 걸 막는 보안 관례예요.
--
-- 시간은 전부 한국 시간(Asia/Seoul) 기준으로 날짜 · 요일 · 시각을 나눠요.
-- 자체 시험용 행(visitor_id 가 'selftest-' 로 시작)은 모든 집계에서 빠져요.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 비밀번호 확인 (내부용 — 브라우저에서 직접 부를 수 없게 실행 권한을 막아요)
-- ---------------------------------------------------------------------
create or replace function public.concert_stats_auth(p_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
begin
  select hash into v_hash from public.concert_stats_secret where id = 1;
  if v_hash is null or p_password is null or extensions.crypt(p_password, v_hash) <> v_hash then
    -- 틀리면 0.5초 늦게 답해서, 프로그램으로 비밀번호를 빠르게 여러 번 찍어 보기 어렵게 해요
    perform pg_sleep(0.5);
    raise exception 'invalid password' using errcode = '28P01';
  end if;
end;
$$;
revoke all on function public.concert_stats_auth(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 로그인 확인 — 맞으면 true, 틀리면 에러
-- ---------------------------------------------------------------------
create or replace function public.concert_stats_login(p_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.concert_stats_auth(p_password);
  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- 지금 보는 사람 + 방금 일어난 일 (30초마다 부르는 가벼운 함수)
-- ---------------------------------------------------------------------
create or replace function public.get_concert_live(p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v jsonb;
begin
  perform public.concert_stats_auth(p_password);
  select jsonb_build_object(
    -- 최근 90초 안에 뭐라도(ping 포함) 보낸 기기 수. ping 이 45초마다라 90초면 한 번은 놓쳐도 잡혀요
    'live', (
      select count(distinct visitor_id) from public.concert_events
      where created_at > now() - interval '90 seconds' and visitor_id not like 'selftest-%'
    ),
    -- 최근 이벤트 10개 — 누가인지(visitor_id)는 빼고 "무슨 일"만
    'recent', coalesce((
      select jsonb_agg(r order by r.t desc) from (
        select created_at as t, event, coalesce(src, 'direct') as src, detail, device
        from public.concert_events
        where event not in ('ping', 'section_view') and visitor_id not like 'selftest-%'
        order by created_at desc
        limit 10
      ) r
    ), '[]'::jsonb)
  ) into v;
  return v;
end;
$$;

-- ---------------------------------------------------------------------
-- 통계 전체 (기간: p_from ~ p_to, 한국 날짜, 둘 다 포함)
-- ---------------------------------------------------------------------
create or replace function public.get_concert_stats(p_password text, p_from date, p_to date)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  -- 한국 날짜 → 실제 시각 범위 (p_to 는 그날 밤 24시까지 포함)
  v_from timestamptz := (p_from::timestamp) at time zone 'Asia/Seoul';
  v_to   timestamptz := ((p_to + 1)::timestamp) at time zone 'Asia/Seoul';
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v jsonb;
begin
  perform public.concert_stats_auth(p_password);
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 120 then
    raise exception 'invalid range';
  end if;

  with
  -- 기간 안의 이벤트 (ping 은 "지금 보는 사람"에만 쓰고 나머지 집계에선 빼요 — 양이 제일 많아서)
  ev as (
    select e.visitor_id, e.session_id, e.event, coalesce(e.src, 'direct') as src, e.detail,
           coalesce(e.lang, 'ko') as lang, coalesce(e.device, 'etc') as device, coalesce(e.browser, 'etc') as browser,
           (e.created_at at time zone 'Asia/Seoul') as kst
    from public.concert_events e
    where e.created_at >= v_from and e.created_at < v_to
      and e.event <> 'ping' and e.visitor_id not like 'selftest-%'
  ),
  -- 기기마다 처음 온 날 (전체 기간 기준) → "새로 온 사람"
  firsts as (
    select visitor_id, min(created_at at time zone 'Asia/Seoul')::date as first_day
    from public.concert_events
    where event <> 'ping' and visitor_id not like 'selftest-%'
    group by visitor_id
  ),
  days as (
    select d::date as day from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') d
  ),
  daily as (
    select d.day,
      count(distinct ev.visitor_id) as visitors,
      count(distinct ev.session_id) as sessions,
      count(distinct ev.visitor_id) filter (where ev.event = 'apply_click') as clickers,
      count(distinct ev.visitor_id) filter (where ev.lang = 'en') as en_visitors,
      count(distinct ev.visitor_id) filter (where ev.src in ('kakao', 'insta')) as share_visitors,
      count(*) filter (where ev.event in ('share_kakao', 'share_insta')) as shares
    from days d
    left join ev on ev.kst::date = d.day
    group by d.day
  ),
  day_src as (
    select kst::date as day, src, count(distinct visitor_id) as visitors
    from ev group by 1, 2
  ),
  top_src as (
    select distinct on (day) day, src from day_src order by day, visitors desc, src
  ),
  new_per_day as (
    select first_day as day, count(*) as n from firsts
    where first_day between p_from and p_to group by 1
  ),
  vis_sessions as (
    select visitor_id, count(distinct session_id) as n from ev group by 1
  ),
  -- 오늘 / 어제 (기간 선택과 상관없이 항상)
  near as (
    select e.visitor_id, e.event, (e.created_at at time zone 'Asia/Seoul') as kst
    from public.concert_events e
    where e.created_at >= ((v_today - 1)::timestamp at time zone 'Asia/Seoul')
      and e.event <> 'ping' and e.visitor_id not like 'selftest-%'
  )
  select jsonb_build_object(
    'today', v_today,
    'from', p_from,
    'to', p_to,

    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', d.day, 'visitors', d.visitors, 'sessions', d.sessions, 'clickers', d.clickers,
        'en', d.en_visitors, 'share_visitors', d.share_visitors, 'shares', d.shares,
        'new', coalesce(n.n, 0), 'top_src', t.src
      ) order by d.day), '[]'::jsonb)
      from daily d
      left join new_per_day n on n.day = d.day
      left join top_src t on t.day = d.day
    ),

    'day_src', (
      select coalesce(jsonb_agg(jsonb_build_object('day', day, 'src', src, 'visitors', visitors)), '[]'::jsonb) from day_src
    ),

    'totals', (
      select jsonb_build_object(
        'visitors', count(distinct visitor_id),
        'sessions', count(distinct session_id),
        'clickers', count(distinct visitor_id) filter (where event = 'apply_click'),
        'shares_kakao', count(*) filter (where event = 'share_kakao'),
        'shares_insta', count(*) filter (where event = 'share_insta'),
        'kakao_visitors', count(distinct visitor_id) filter (where src = 'kakao'),
        'insta_visitors', count(distinct visitor_id) filter (where src = 'insta'),
        'returning', (select count(*) from vis_sessions where n >= 2)
      ) from ev
    ),

    'sources', (
      select coalesce(jsonb_agg(s order by s.visitors desc), '[]'::jsonb) from (
        select src, count(distinct visitor_id) as visitors,
               count(distinct visitor_id) filter (where event = 'apply_click') as clickers
        from ev group by src
      ) s
    ),

    -- 신청까지 단계: 들어옴 → 공연 소개 봄 → 사전 신청 섹션 봄 → 신청 버튼 누름 (→ 폼 제출은 수동 입력 숫자)
    'funnel', (
      select jsonb_build_object(
        'visitors', count(distinct visitor_id),
        'about', count(distinct visitor_id) filter (where event = 'section_view' and detail = 'about'),
        'lineup', count(distinct visitor_id) filter (where event = 'section_view' and detail = 'lineup'),
        'apply', count(distinct visitor_id) filter (where event = 'section_view' and detail = 'apply'),
        'click', count(distinct visitor_id) filter (where event = 'apply_click')
      ) from ev
    ),

    'devices', (
      select coalesce(jsonb_agg(s order by s.visitors desc), '[]'::jsonb) from (
        select device, count(distinct visitor_id) as visitors,
               count(distinct visitor_id) filter (where event = 'apply_click') as clickers
        from ev group by device
      ) s
    ),
    'browsers', (
      select coalesce(jsonb_agg(s order by s.visitors desc), '[]'::jsonb) from (
        select browser, count(distinct visitor_id) as visitors from ev group by browser
      ) s
    ),
    'langs', (
      select coalesce(jsonb_agg(s order by s.visitors desc), '[]'::jsonb) from (
        select lang, count(distinct visitor_id) as visitors from ev group by lang
      ) s
    ),

    -- 요일(1=월 … 7=일) × 시각(0~23) 칸마다 들어온 사람 수
    'heat', (
      select coalesce(jsonb_agg(jsonb_build_object('dow', dow, 'hour', hr, 'visitors', n)), '[]'::jsonb) from (
        select extract(isodow from kst)::int as dow, extract(hour from kst)::int as hr, count(distinct visitor_id) as n
        from ev group by 1, 2
      ) h
    ),

    'teams', (
      select coalesce(jsonb_agg(jsonb_build_object('id', detail, 'opens', n) order by n desc), '[]'::jsonb) from (
        select detail, count(*) as n from ev where event = 'team_open' and detail is not null group by detail
      ) t
    ),

    -- 오늘 시간대별 방문자 (0~23시)
    'today_hours', (
      select coalesce(jsonb_agg(jsonb_build_object('hour', hr, 'visitors', n)), '[]'::jsonb) from (
        select extract(hour from kst)::int as hr, count(distinct visitor_id) as n
        from near where kst::date = v_today group by 1
      ) h
    ),
    'today_visitors', (select count(distinct visitor_id) from near where kst::date = v_today),
    'yesterday_visitors', (select count(distinct visitor_id) from near where kst::date = v_today - 1),

    -- 목표 진행률은 기간 선택과 상관없이 "전체" 기준
    'all_visitors', (select count(*) from firsts),
    'all_en_visitors', (
      select count(distinct visitor_id) from public.concert_events
      where lang = 'en' and event <> 'ping' and visitor_id not like 'selftest-%'
    ),

    'notes', (
      select coalesce(jsonb_agg(jsonb_build_object('id', id, 'day', day, 'memo', memo) order by day, created_at), '[]'::jsonb)
      from public.concert_promo_notes
    ),
    'manual', (
      select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) from public.concert_manual
    )
  ) into v;

  return v;
end;
$$;

-- ---------------------------------------------------------------------
-- 홍보 기록 추가 / 삭제
-- ---------------------------------------------------------------------
create or replace function public.concert_add_note(p_password text, p_day date, p_memo text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  perform public.concert_stats_auth(p_password);
  if p_day is null or p_memo is null or char_length(btrim(p_memo)) = 0 then
    raise exception 'empty note';
  end if;
  insert into public.concert_promo_notes (day, memo) values (p_day, left(btrim(p_memo), 200)) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.concert_delete_note(p_password text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.concert_stats_auth(p_password);
  delete from public.concert_promo_notes where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 수동 입력 숫자 저장 (구글 폼 제출 수 · 목표치) — 정해진 이름만 받아요
-- ---------------------------------------------------------------------
create or replace function public.concert_set_manual(p_password text, p_key text, p_value int)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform public.concert_stats_auth(p_password);
  if p_key not in ('form_submissions', 'goal_visitors', 'goal_submissions', 'goal_en') then
    raise exception 'unknown key';
  end if;
  if p_value is null or p_value < 0 or p_value > 1000000 then
    raise exception 'invalid value';
  end if;
  insert into public.concert_manual (key, value) values (p_key, p_value)
  on conflict (key) do update set value = excluded.value;
end;
$$;

insert into public.concert_manual (key, value) values ('goal_submissions', 300) on conflict (key) do nothing;
insert into public.concert_manual (key, value) values ('goal_en', 50) on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 실행 권한 — 브라우저(anon)에서 부를 수 있게. (비밀번호 없이는 함수가 바로 에러를 내요)
-- Supabase 는 새 함수에 기본으로 권한을 주기도 해서, 일단 다 걷고 필요한 것만 다시 줘요.
-- ---------------------------------------------------------------------
revoke all on function public.concert_stats_login(text) from public;
revoke all on function public.get_concert_live(text) from public;
revoke all on function public.get_concert_stats(text, date, date) from public;
revoke all on function public.concert_add_note(text, date, text) from public;
revoke all on function public.concert_delete_note(text, uuid) from public;
revoke all on function public.concert_set_manual(text, text, int) from public;

grant execute on function public.concert_stats_login(text) to anon, authenticated;
grant execute on function public.get_concert_live(text) to anon, authenticated;
grant execute on function public.get_concert_stats(text, date, date) to anon, authenticated;
grant execute on function public.concert_add_note(text, date, text) to anon, authenticated;
grant execute on function public.concert_delete_note(text, uuid) to anon, authenticated;
grant execute on function public.concert_set_manual(text, text, int) to anon, authenticated;

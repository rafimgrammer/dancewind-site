-- =====================================================================
-- 2026 정기공연 방문 기록 — 3단계 (presence 분리 + 방문별 기록)
-- 1단계와 2단계 SQL 실행 후 이 파일을 Supabase SQL Editor에서 실행하세요.
--
-- 방문자 브라우저는 presence를 security definer 함수로만 갱신하고,
-- 방문 기록은 비밀번호 확인 후 요약 형태로만 반환합니다.
-- RLS 정책 간 테이블 참조로 생기는 무한재귀(42P17)를 막기 위해
-- 여러 테이블을 읽거나 쓰는 작업은 처음부터 security definer로 처리합니다.
-- =====================================================================

create table if not exists public.concert_presence (
  visitor_id text primary key,
  src text,
  last_seen timestamptz not null default now()
);

alter table public.concert_presence enable row level security;
revoke all on public.concert_presence from public, anon, authenticated;
-- 정책 없음: 브라우저는 직접 읽거나 쓰지 못하고 아래 함수만 사용할 수 있어요.

create or replace function public.concert_ping(p_visitor text, p_src text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_visitor is null or p_visitor !~ '^[A-Za-z0-9-]{8,64}$'
     or p_visitor like 'selftest-%' then
    raise exception 'invalid visitor';
  end if;
  if p_src is null or p_src !~ '^[a-z0-9_-]{1,30}$' then
    raise exception 'invalid source';
  end if;

  insert into public.concert_presence (visitor_id, src)
  values (p_visitor, p_src)
  on conflict (visitor_id) do update set last_seen = now();
end;
$$;
revoke all on function public.concert_ping(text, text) from public;
grant execute on function public.concert_ping(text, text) to anon, authenticated;

create index if not exists concert_events_session_created_idx
  on public.concert_events (session_id, created_at);

-- live는 presence 테이블에서 계산하고 최근 활동 목록은 ping을 제외한 이벤트만 사용해요.
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
    'live', (
      select count(*) from public.concert_presence
      where last_seen > now() - interval '90 seconds'
        and visitor_id not like 'selftest-%'
    ),
    'recent', coalesce((
      select jsonb_agg(r order by r.t desc) from (
        select created_at as t, event, coalesce(src, 'direct') as src, detail, device
        from public.concert_events
        where event not in ('ping', 'section_view')
          and visitor_id not like 'selftest-%'
        order by created_at desc
        limit 10
      ) r
    ), '[]'::jsonb)
  ) into v;
  return v;
end;
$$;

-- 방문 단위는 session_id. visitor_id는 md5 앞 4자리 코드로만 반환합니다.
create or replace function public.get_concert_visitors(
  p_password text,
  p_from date,
  p_to date,
  p_filter text,
  p_offset int,
  p_limit int
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_from timestamptz;
  v_to timestamptz;
  v_filter text := coalesce(btrim(p_filter), '');
  v_offset int := greatest(0, least(coalesce(p_offset, 0), 1000000));
  v_limit int := greatest(1, least(coalesce(p_limit, 30), 50));
  v jsonb;
begin
  perform public.concert_stats_auth(p_password);
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'invalid range';
  end if;
  if v_filter not in ('', 'all', 'clicked', 'browsed', 'bounced', 'insta', 'kakao', 'qr', 'notice', 'direct')
     and upper(v_filter) !~ '^[0-9A-F]{1,4}$' then
    raise exception 'invalid filter';
  end if;

  v_from := (p_from::timestamp) at time zone 'Asia/Seoul';
  v_to := ((p_to + 1)::timestamp) at time zone 'Asia/Seoul';

  with session_rollup as (
    select
      e.visitor_id,
      e.session_id,
      min(e.created_at) as started_at,
      max(e.created_at) as last_event_at,
      (array_agg(coalesce(e.src, 'direct') order by e.created_at))[1] as src,
      (array_agg(coalesce(e.device, 'etc') order by e.created_at))[1] as device,
      (array_agg(coalesce(e.browser, 'etc') order by e.created_at))[1] as browser,
      (array_agg(coalesce(e.lang, 'ko') order by e.created_at))[1] as lang,
      bool_or(e.event = 'section_view' and e.detail = 'about') as about,
      bool_or(e.event = 'section_view' and e.detail = 'lineup') as lineup,
      bool_or(e.event = 'section_view' and e.detail = 'apply') as apply,
      count(*) filter (where e.event = 'team_open') as team_open,
      bool_or(e.event = 'apply_click') as apply_click,
      bool_or(e.event = 'share_kakao') as share_kakao,
      bool_or(e.event = 'share_insta') as share_insta,
      bool_or(e.event = 'calendar_save') as calendar_save,
      bool_or(e.event = 'map_click') as map_click,
      bool_or(e.event = 'lang_switch') as lang_switch,
      bool_or(e.event = 'section_view') as browsed
    from public.concert_events e
    where e.event <> 'ping' and e.visitor_id not like 'selftest-%'
    group by e.visitor_id, e.session_id
  ), ranked as (
    select s.*,
      lead(s.started_at) over (partition by s.visitor_id order by s.started_at, s.session_id) as next_started_at,
      row_number() over (partition by s.visitor_id order by s.started_at, s.session_id) as visit_no,
      upper(substr(md5(s.visitor_id), 1, 4)) as code,
      case when s.apply_click then 'clicked' when s.browsed then 'browsed' else 'bounced' end as result
    from session_rollup s
  ), visits as (
    select
      r.code, r.started_at,
      case
        when r.next_started_at is null
          and p.last_seen > r.last_event_at
          and p.last_seen > now() - interval '90 seconds'
        then p.last_seen
        else r.last_event_at
      end as ended_at,
      r.src, r.device, r.browser, r.lang, r.visit_no, r.result,
      jsonb_build_object(
        'about', r.about, 'lineup', r.lineup, 'apply', r.apply,
        'team_open', r.team_open, 'apply_click', r.apply_click,
        'share_kakao', r.share_kakao, 'share_insta', r.share_insta,
        'calendar_save', r.calendar_save, 'map_click', r.map_click,
        'lang_switch', r.lang_switch
      ) as flags
    from ranked r
    left join public.concert_presence p on p.visitor_id = r.visitor_id
    where r.started_at >= v_from and r.started_at < v_to
  ), filtered as (
    select * from visits v
    where v_filter in ('', 'all')
      or v.result = v_filter
      or v.src = v_filter
      or v.code like upper(v_filter) || '%'
  ), page as (
    select * from filtered
    order by started_at desc
    offset v_offset limit v_limit
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'visits', coalesce((
      select jsonb_agg(jsonb_build_object(
        'code', p.code,
        'started_at', p.started_at,
        'ended_at', p.ended_at,
        'duration_sec', greatest(0, floor(extract(epoch from (p.ended_at - p.started_at)))::int),
        'src', p.src,
        'device', p.device,
        'browser', p.browser,
        'lang', p.lang,
        'visit_no', p.visit_no,
        'result', p.result,
        'flags', p.flags
      ) order by p.started_at desc)
      from page p
    ), '[]'::jsonb)
  ) into v;
  return v;
end;
$$;

create or replace function public.get_concert_visit_detail(
  p_password text,
  p_code text,
  p_started_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_visitor text;
  v_session text;
  v_matches int;
  v jsonb;
begin
  perform public.concert_stats_auth(p_password);
  if p_code is null or p_code !~ '^[0-9A-Fa-f]{4}$' or p_started_at is null then
    raise exception 'invalid visit';
  end if;

  select count(*), min(s.visitor_id), min(s.session_id)
    into v_matches, v_visitor, v_session
  from (
    select distinct e.visitor_id, e.session_id
    from public.concert_events e
    where e.created_at = p_started_at
      and e.event <> 'ping'
      and e.visitor_id not like 'selftest-%'
      and upper(substr(md5(e.visitor_id), 1, 4)) = upper(p_code)
      and not exists (
        select 1 from public.concert_events earlier
        where earlier.visitor_id = e.visitor_id
          and earlier.session_id = e.session_id
          and earlier.event <> 'ping'
          and earlier.created_at < p_started_at
      )
  ) s;

  if v_matches = 0 then
    raise exception 'visit not found';
  elsif v_matches > 1 then
    raise exception 'ambiguous visit code';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    't', e.created_at,
    'event', e.event,
    'detail', e.detail
  ) order by e.created_at), '[]'::jsonb)
    into v
  from public.concert_events e
  where e.visitor_id = v_visitor
    and e.session_id = v_session
    and e.event <> 'ping';

  return jsonb_build_object('events', v);
end;
$$;

revoke all on function public.get_concert_live(text) from public;
revoke all on function public.get_concert_visitors(text, date, date, text, int, int) from public;
revoke all on function public.get_concert_visit_detail(text, text, timestamptz) from public;
grant execute on function public.get_concert_live(text) to anon, authenticated;
grant execute on function public.get_concert_visitors(text, date, date, text, int, int) to anon, authenticated;
grant execute on function public.get_concert_visit_detail(text, text, timestamptz) to anon, authenticated;

-- 기존 ping 이벤트를 지우는 작업은 아래 별도 SQL을 확인한 뒤 실행하세요.

-- =====================================================================
-- [별도 실행] 예전에 concert_events 에 쌓인 ping 행 정리
--
-- 왜 주석으로 막아 뒀나요?
--   - 지운 행은 되돌릴 수 없어서, 위 SQL 을 붙여넣을 때 같이 실행되지 않게 했어요.
--   - 사이트 새 버전(concert_ping 사용)이 배포된 "뒤에" 실행해야 해요.
--     배포 전에 지우면 옛 버전 브라우저가 계속 ping 을 쌓아서 또 지워야 해요.
--   - 통계 함수들은 이미 전부 event <> 'ping' 으로 걸러서, 지워도 숫자는 바뀌지 않아요.
--
-- 실행 방법: ① 먼저 개수 확인 → ② 아래 delete 의 주석(--)을 풀고 그 줄만 선택해서 실행
-- =====================================================================
-- ① 몇 줄이 지워질지 확인
-- select count(*) from public.concert_events where event = 'ping';
--
-- ② 실제 삭제
-- delete from public.concert_events where event = 'ping';

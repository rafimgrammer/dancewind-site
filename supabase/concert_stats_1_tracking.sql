-- =====================================================================
-- 2026 정기공연 페이지 방문 기록 — 1단계 (테이블 + 보안 규칙)
-- Supabase > SQL Editor 에 이 파일 전체를 붙여넣고 [Run] 하면 돼요. 여러 번 실행해도 괜찮아요.
--
-- 보안 설계 (한 줄 요약: "쓰기는 누구나, 읽기는 아무도 직접 못 함")
--   · 방문자 브라우저(anon)는 concert_events 에 "정해진 모양의 행 추가"만 할 수 있어요.
--   · 어떤 테이블에도 select/update/delete 정책을 만들지 않아요.
--     RLS 를 켜고 정책이 없으면 = 그 동작은 전부 거절이라서, anon 키로는 아무것도 읽을 수 없어요.
--   · 통계는 2단계에서 만드는 "security definer 함수"로만 꺼내요.
--     그 함수는 테이블 주인 권한으로 실행돼서 RLS 를 거치지 않으므로,
--     테이블끼리 정책이 서로를 참조하다 생기는 무한재귀(42P17)가 처음부터 생길 수 없어요.
-- =====================================================================

-- 비밀번호 해시용 (Supabase 는 extensions 스키마에 설치하는 게 기본)
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1) 방문 이벤트
-- ---------------------------------------------------------------------
create table if not exists public.concert_events (
  id          uuid primary key default gen_random_uuid(),   -- 숫자 자동증가 대신 uuid: anon 에게 시퀀스 권한을 따로 줄 필요가 없어요
  created_at  timestamptz not null default now(),
  visitor_id  text not null,   -- 기기(브라우저)마다 하나. localStorage 에 저장된 랜덤 값
  session_id  text not null,   -- 탭을 열 때마다 새로. sessionStorage
  event       text not null,   -- page_view, apply_click ... (아래 정책에서 목록 검사)
  src         text,            -- 어디서 왔는지 (insta, kakao, qr, direct ...)
  detail      text,            -- 이벤트별 추가 정보 (섹션 id, 팀 id, 언어 ...)
  lang        text,            -- ko / en
  device      text,            -- ios / android / pc / etc
  browser     text,            -- kakao / instagram / safari / chrome ...
  screen_w    int,
  referrer    text
);

create index if not exists concert_events_created_at_idx on public.concert_events (created_at);
create index if not exists concert_events_event_created_idx on public.concert_events (event, created_at);

alter table public.concert_events enable row level security;

-- 브라우저에서 쓰는 anon 키에는 "추가" 권한만. (Supabase 기본값은 전부 주는 거라 명시적으로 줄여요)
revoke all on public.concert_events from anon, authenticated;
grant insert on public.concert_events to anon, authenticated;

-- 추가할 때 검사: 정해진 이벤트만, 글자 수 제한 — 누가 anon 키로 장난 데이터를 넣는 걸 막아요
drop policy if exists "concert_events_insert_only" on public.concert_events;
create policy "concert_events_insert_only"
  on public.concert_events
  for insert
  to anon, authenticated
  with check (
    event in (
      'page_view', 'section_view', 'apply_click', 'share_kakao', 'share_insta',
      'team_open', 'calendar_save', 'map_click', 'lang_switch', 'ping'
    )
    and char_length(visitor_id) between 8 and 64
    and char_length(session_id) between 8 and 64
    and (src is null or char_length(src) <= 40)
    and (detail is null or char_length(detail) <= 200)
    and (lang is null or char_length(lang) <= 8)
    and (device is null or char_length(device) <= 20)
    and (browser is null or char_length(browser) <= 20)
    and (referrer is null or char_length(referrer) <= 200)
    and (screen_w is null or screen_w between 0 and 10000)
    -- 시각을 과거/미래로 조작해서 넣는 것도 막아요 (기본값 now() 를 쓰면 항상 통과)
    and created_at between now() - interval '1 minute' and now() + interval '1 minute'
  );
-- select / update / delete 정책은 일부러 없음 → 아무도 직접 못 읽고 못 고쳐요.

-- ---------------------------------------------------------------------
-- 2) 홍보 기록 (예: "11/24 인스타 릴스 업로드") — 대시보드 그래프에 금색 점으로
-- ---------------------------------------------------------------------
create table if not exists public.concert_promo_notes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  day         date not null,
  memo        text not null check (char_length(memo) between 1 and 200)
);
alter table public.concert_promo_notes enable row level security;
revoke all on public.concert_promo_notes from anon, authenticated;
-- 정책 없음 → 비밀번호 확인하는 함수로만 추가/삭제/조회

-- ---------------------------------------------------------------------
-- 3) 수동 입력 숫자 (구글 폼 제출 수, 목표 방문자 수 등)
-- ---------------------------------------------------------------------
create table if not exists public.concert_manual (
  key    text primary key,
  value  int not null
);
alter table public.concert_manual enable row level security;
revoke all on public.concert_manual from anon, authenticated;
insert into public.concert_manual (key, value) values ('goal_visitors', 1500) on conflict (key) do nothing;
insert into public.concert_manual (key, value) values ('form_submissions', 0) on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 4) 통계 비밀번호 — 해시(crypt)만 저장. 평문은 어디에도 남기지 않아요.
--    실제 비밀번호를 넣는 한 줄은 이 파일에 없어요. (git 에 올라가지 않게 따로 받으세요)
-- ---------------------------------------------------------------------
create table if not exists public.concert_stats_secret (
  id    int primary key default 1 check (id = 1),   -- 행은 딱 하나만
  hash  text not null
);
alter table public.concert_stats_secret enable row level security;
revoke all on public.concert_stats_secret from anon, authenticated;

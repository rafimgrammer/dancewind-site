// src/routes/FeatureLayouts.tsx
//
// 각 컴포넌트는 "이 라우트 그룹에서만 필요한 Context Provider"로 감싸고 <Outlet/>을 렌더링해요.
// App.tsx에서 <Route element={<XxxLayout />}> 형태의 부모 라우트로 사용됩니다.
// 이렇게 하면 예를 들어 게시판 관련 페이지에 있을 때만 BoardProvider가 활성화되고,
// 데이터를 fetch해요. 홈 화면이나 다른 기능 페이지에서는 아예 로드되지 않아요.

import { Outlet } from "react-router-dom";
import { NoticesProvider } from "../context/NoticesContext";
import { BoardProvider } from "../context/BoardContext";
import { AnonBoardProvider } from "../context/AnonBoardContext";
import { TeachingProvider } from "../context/TeachingContext";
import { PracticeProvider } from "../context/PracticeContext";
import { CalendarProvider } from "../context/CalendarContext";
import { TracklistProvider } from "../context/TracklistContext";
import { ReelsProvider } from "../context/ReelsContext";
import { MemberManageProvider } from "../context/MemberManageContext";
import { UpdatesProvider } from "../context/UpdatesContext";
import { HomeContentProvider } from "../context/HomeContentContext";
import { AboutContentProvider } from "../context/AboutContentContext";
import { OfficersProvider } from "../context/OfficersContext";
import { LocationContentProvider } from "../context/LocationContentContext";
import { RecruitContentProvider } from "../context/RecruitContentContext";
import { GalleryProvider } from "../context/GalleryContext";
import { FormationProvider } from "../context/FormationContext";
import { CircleGameProvider } from "../context/CircleGameContext";
import { ReactionGameProvider } from "../context/ReactionGameContext";

export function NoticesLayout() {
  return (
    <NoticesProvider>
      <Outlet />
    </NoticesProvider>
  );
}

export function BoardLayout() {
  return (
    <BoardProvider>
      <Outlet />
    </BoardProvider>
  );
}

export function AnonBoardLayout() {
  return (
    <AnonBoardProvider>
      <Outlet />
    </AnonBoardProvider>
  );
}

export function TeachingLayout() {
  return (
    <TeachingProvider>
      <Outlet />
    </TeachingProvider>
  );
}

export function ReelsLayout() {
  return (
    <ReelsProvider>
      <Outlet />
    </ReelsProvider>
  );
}

export function PracticeLayout() {
  return (
    <PracticeProvider>
      <Outlet />
    </PracticeProvider>
  );
}

// 캘린더 페이지는 usePractice()도 같이 쓰고 있어서 Practice + Calendar를 함께 감쌈
export function CalendarFeatureLayout() {
  return (
    <PracticeProvider>
      <CalendarProvider>
        <Outlet />
      </CalendarProvider>
    </PracticeProvider>
  );
}

export function TracklistLayout() {
  return (
    <TracklistProvider>
      <Outlet />
    </TracklistProvider>
  );
}

export function MemberManageLayout() {
  return (
    <MemberManageProvider>
      <Outlet />
    </MemberManageProvider>
  );
}

export function UpdatesLayout() {
  return (
    <UpdatesProvider>
      <Outlet />
    </UpdatesProvider>
  );
}

export function HomeContentLayout() {
  return (
    <HomeContentProvider>
      <Outlet />
    </HomeContentProvider>
  );
}

export function AboutContentLayout() {
  return (
    <AboutContentProvider>
      <Outlet />
    </AboutContentProvider>
  );
}

export function OfficersLayout() {
  return (
    <OfficersProvider>
      <Outlet />
    </OfficersProvider>
  );
}

export function LocationContentLayout() {
  return (
    <LocationContentProvider>
      <Outlet />
    </LocationContentProvider>
  );
}

export function RecruitContentLayout() {
  return (
    <RecruitContentProvider>
      <Outlet />
    </RecruitContentProvider>
  );
}

export function GalleryLayout() {
  return (
    <GalleryProvider>
      <Outlet />
    </GalleryProvider>
  );
}

export function FormationLayout() {
  return (
    <FormationProvider>
      <Outlet />
    </FormationProvider>
  );
}

export function CircleGameLayout() {
  return (
    <CircleGameProvider>
      <Outlet />
    </CircleGameProvider>
  );
}

export function ReactionGameLayout() {
  return (
    <ReactionGameProvider>
      <Outlet />
    </ReactionGameProvider>
  );
}

// 마이페이지는 여러 기능의 "내 활동"을 종합해서 보여주는 페이지라
// 공지/게시판/익명게시판/티칭/릴스 5개 Context를 한 번에 감쌈
export function MyPageLayout() {
  return (
    <NoticesProvider>
      <BoardProvider>
        <AnonBoardProvider>
          <TeachingProvider>
            <ReelsProvider>
              <Outlet />
            </ReelsProvider>
          </TeachingProvider>
        </AnonBoardProvider>
      </BoardProvider>
    </NoticesProvider>
  );
}
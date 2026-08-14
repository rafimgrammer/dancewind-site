import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PresenceProvider } from "./context/PresenceContext";
import { NotificationProvider } from "./context/NotificationContext";
import {
  NoticesLayout,
  BoardLayout,
  AnonBoardLayout,
  TeachingLayout,
  ReelsLayout,
  PracticeLayout,
  CalendarFeatureLayout,
  TracklistLayout,
  MemberManageLayout,
  MyPageLayout,
  UpdatesLayout,
  HomeContentLayout,
  AboutContentLayout,
  OfficersLayout,
  LocationContentLayout,
  RecruitContentLayout,
  GalleryLayout,
  FormationLayout,
} from "./routes/FeatureLayouts";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import About from "./pages/About";
import Videos from "./pages/Videos";
import Officers from "./pages/Officers";
import Location from "./pages/Location";
import CalendarPage from "./pages/Calendar";
import Recruit from "./pages/Recruit";
import Gallery from "./pages/Gallery";
import Notices from "./pages/Notices";
import NoticeDetail from "./pages/NoticeDetail";
import NoticeForm from "./pages/NoticeForm";
import Board from "./pages/Board";
import BoardForm from "./pages/BoardForm";
import BoardDetail from "./pages/BoardDetail";
import AnonBoard from "./pages/AnonBoard";
import AnonBoardForm from "./pages/AnonBoardForm";
import AnonBoardDetail from "./pages/AnonBoardDetail";
import Teaching from "./pages/Teaching";
import TeachingForm from "./pages/TeachingForm";
import TeachingDetail from "./pages/TeachingDetail";
import PracticeMatcher from "./pages/PracticeMatcher";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import TracklistList from "./pages/TracklistList";
import TracklistMaster from "./pages/TracklistMaster";
import ReelsList from "./pages/ReelsList";
import ReelsForm from "./pages/ReelsForm";
import ReelsDetail from "./pages/ReelsDetail";
import MemberManage from "./pages/MemberManage";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Pending from "./pages/Pending";
import MyPage from "./pages/MyPage";
import PracticeMatcherList from "./pages/PracticeMatcherList";
import Updates from "./pages/Updates";
import GalleryAlbum from "./pages/GalleryAlbum";
import FormationList from "./pages/FormationList";
import FormationEditor from "./pages/FormationEditor";


export default function App() {
  return (
    <AuthProvider>
      <PresenceProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                {/* 공개 페이지 — 기능별 Context 필요 없음 */}
                <Route element={<HomeContentLayout />}>
                  <Route path="/" element={<Home />} />
                </Route>
                <Route element={<AboutContentLayout />}>
                  <Route path="/about" element={<About />} />
                </Route>
                <Route path="/videos" element={<Videos />} />
                <Route element={<OfficersLayout />}>
                  <Route path="/officers" element={<Officers />} />
                </Route>
                <Route element={<LocationContentLayout />}>
                  <Route path="/location" element={<Location />} />
                </Route>
                <Route element={<RecruitContentLayout />}>
                  <Route path="/recruit" element={<Recruit />} />
                </Route>
                <Route element={<GalleryLayout />}>
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/gallery/:id" element={<GalleryAlbum />} />
                </Route>
                <Route element={<FormationLayout />}>
                  <Route path="/formation" element={<FormationList />} />
                  <Route path="/formation/:id" element={<FormationEditor />} />
                </Route>

                {/* 인증 / 온보딩 */}
                <Route path="/login" element={<Login />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/pending" element={<Pending />} />

                {/* 약관 */}
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />

                {/* 마이페이지 — 공지/게시판/익명게시판/티칭/릴스 종합 */}
                <Route element={<MyPageLayout />}>
                  <Route path="/mypage" element={<MyPage />} />
                </Route>

                {/* 공지사항 */}
                <Route element={<NoticesLayout />}>
                  <Route path="/notices" element={<Notices />} />
                  <Route path="/notices/new" element={<NoticeForm />} />
                  <Route path="/notices/:id" element={<NoticeDetail />} />
                  <Route path="/notices/:id/edit" element={<NoticeForm />} />
                </Route>

                {/* 사이트 업데이트 로그 */}
                <Route element={<UpdatesLayout />}>
                  <Route path="/updates" element={<Updates />} />
                </Route>

                {/* 팀 연습 매칭 */}
                <Route element={<PracticeLayout />}>
                  <Route path="/practice-matcher" element={<PracticeMatcherList />} />
                  <Route path="/practice-matcher/:id" element={<PracticeMatcher />} />
                </Route>

                {/* 캘린더 — 연습매칭 데이터도 같이 사용 */}
                <Route element={<CalendarFeatureLayout />}>
                  <Route path="/calendar" element={<CalendarPage />} />
                </Route>

                {/* 자유게시판 */}
                <Route element={<BoardLayout />}>
                  <Route path="/board" element={<Board />} />
                  <Route path="/board/new" element={<BoardForm />} />
                  <Route path="/board/:id" element={<BoardDetail />} />
                  <Route path="/board/:id/edit" element={<BoardForm />} />
                </Route>

                {/* 익명게시판 */}
                <Route element={<AnonBoardLayout />}>
                  <Route path="/anonymous" element={<AnonBoard />} />
                  <Route path="/anonymous/:id" element={<AnonBoardDetail />} />
                  <Route path="/anonymous/:id/edit" element={<AnonBoardForm />} />
                </Route>

                {/* 티칭 클래스 */}
                <Route element={<TeachingLayout />}>
                  <Route path="/classes" element={<Teaching />} />
                  <Route path="/classes/new" element={<TeachingForm />} />
                  <Route path="/classes/:id/edit" element={<TeachingForm />} />
                  <Route path="/classes/:id" element={<TeachingDetail />} />
                </Route>

                {/* 같이 릴스찍자! */}
                <Route element={<ReelsLayout />}>
                  <Route path="/reels" element={<ReelsList />} />
                  <Route path="/reels/new" element={<ReelsForm />} />
                  <Route path="/reels/:id/edit" element={<ReelsForm />} />
                  <Route path="/reels/:id" element={<ReelsDetail />} />
                </Route>

                {/* 트랙리스트 마스터 */}
                <Route element={<TracklistLayout />}>
                  <Route path="/tracklist-master" element={<TracklistList />} />
                  <Route path="/tracklist-master/:id" element={<TracklistMaster />} />
                </Route>

                {/* 회장단 전용 */}
                <Route element={<MemberManageLayout />}>
                  <Route path="/member-manage" element={<MemberManage />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </NotificationProvider>
      </PresenceProvider>
    </AuthProvider>
  );
}
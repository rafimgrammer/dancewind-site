import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NoticesProvider } from "./context/NoticesContext";
import { BoardProvider } from "./context/BoardContext";
import { TeachingProvider } from "./context/TeachingContext";
import { PracticeProvider } from "./context/PracticeContext";
import { CalendarProvider } from "./context/CalendarContext";
import { AnonBoardProvider } from "./context/AnonBoardContext";
import { TracklistProvider } from "./context/TracklistContext";
import { ReelsProvider } from "./context/ReelsContext";
import { MemberManageProvider } from "./context/MemberManageContext";
import { NotificationProvider } from "./context/NotificationContext";
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


export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <NoticesProvider>
          <BoardProvider>
            <TeachingProvider>
              <PracticeProvider>
                <CalendarProvider>
                  <AnonBoardProvider>
                    <TracklistProvider>
                      <MemberManageProvider>
                        <ReelsProvider>

                          <BrowserRouter>
                            <Layout>
                              <Routes>
                                {/* 공개 페이지 */}
                                <Route path="/" element={<Home />} />
                                <Route path="/about" element={<About />} />
                                <Route path="/videos" element={<Videos />} />
                                <Route path="/officers" element={<Officers />} />
                                <Route path="/location" element={<Location />} />
                                <Route path="/recruit" element={<Recruit />} />
                                <Route path="/gallery" element={<Gallery />} />
                                <Route path="/calendar" element={<CalendarPage />} />

                                {/* 인증 / 온보딩 */}
                                <Route path="/login" element={<Login />} />
                                <Route path="/onboarding" element={<Onboarding />} />
                                <Route path="/pending" element={<Pending />} />
                                <Route path="/mypage" element={<MyPage />} />

                                {/* 약관 */}
                                <Route path="/privacy" element={<PrivacyPolicy />} />
                                <Route path="/terms" element={<Terms />} />

                                {/* 공지사항 */}
                                <Route path="/notices" element={<Notices />} />
                                <Route path="/notices/new" element={<NoticeForm />} />
                                <Route path="/notices/:id" element={<NoticeDetail />} />
                                <Route path="/notices/:id/edit" element={<NoticeForm />} />

                                {/* 자유게시판 */}
                                <Route path="/board" element={<Board />} />
                                <Route path="/board/new" element={<BoardForm />} />
                                <Route path="/board/:id" element={<BoardDetail />} />
                                <Route path="/board/:id/edit" element={<BoardForm />} />

                                {/* 익명게시판 */}
                                <Route path="/anonymous" element={<AnonBoard />} />
                                <Route path="/anonymous/:id" element={<AnonBoardDetail />} />
                                <Route path="/anonymous/:id/edit" element={<AnonBoardForm />} />

                                {/* 티칭 클래스 */}
                                <Route path="/classes" element={<Teaching />} />
                                <Route path="/classes/new" element={<TeachingForm />} />
                                <Route path="/classes/:id/edit" element={<TeachingForm />} />
                                <Route path="/classes/:id" element={<TeachingDetail />} />

                                {/* 같이 릴스찍자! */}
                                <Route path="/reels" element={<ReelsList />} />
                                <Route path="/reels/new" element={<ReelsForm />} />
                                <Route path="/reels/:id/edit" element={<ReelsForm />} />
                                <Route path="/reels/:id" element={<ReelsDetail />} />

                                {/* 도구 */}
                                <Route path="/practice-matcher" element={<PracticeMatcher />} />
                                <Route path="/tracklist-master" element={<TracklistList />} />
                                <Route path="/tracklist-master/:id" element={<TracklistMaster />} />

                                {/* 회장단 전용 */}
                                <Route path="/member-manage" element={<MemberManage />} />

                                {/* 404 */}
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </Layout>
                          </BrowserRouter>

                        </ReelsProvider>
                      </MemberManageProvider>
                    </TracklistProvider>
                  </AnonBoardProvider>
                </CalendarProvider>
              </PracticeProvider>
            </TeachingProvider>
          </BoardProvider>
        </NoticesProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
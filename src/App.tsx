import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NoticesProvider } from "./context/NoticesContext";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import About from "./pages/About";
import Videos from "./pages/Videos";
import Officers from "./pages/Officers";
import Location from "./pages/Location";
import Recruit from "./pages/Recruit";
import Gallery from "./pages/Gallery";
import Notices from "./pages/Notices";
import NoticeDetail from "./pages/NoticeDetail";
import NoticeForm from "./pages/NoticeForm";
import Board from "./pages/Board";
import AnonBoard from "./pages/AnonBoard";
import Teaching from "./pages/Teaching";
import PracticeMatcher from "./pages/PracticeMatcher";
import TracklistMaster from "./pages/TracklistMaster";
import MemberManage from "./pages/MemberManage";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <NoticesProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/officers" element={<Officers />} />
              <Route path="/location" element={<Location />} />
              <Route path="/recruit" element={<Recruit />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/notices" element={<Notices />} />
              <Route path="/notices/new" element={<NoticeForm />} />
              <Route path="/notices/:id" element={<NoticeDetail />} />
              <Route path="/board" element={<Board />} />
              <Route path="/anonymous" element={<AnonBoard />} />
              <Route path="/classes" element={<Teaching />} />
              <Route path="/practice-matcher" element={<PracticeMatcher />} />
              <Route path="/tracklist-master" element={<TracklistMaster />} />
              <Route path="/member-manage" element={<MemberManage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </NoticesProvider>
    </AuthProvider>
  );
}
// src/pages/MyPage.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Card, Pill, RequireRole, EmptyState } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useNotices } from "../context/NoticesContext";
import { useBoard } from "../context/BoardContext";
import { useAnonBoard } from "../context/AnonBoardContext";
import { useTeaching } from "../context/TeachingContext";

type Tab = "activity" | "applications" | "saved" | "settings";

const TABS: { key: Tab; label: string }[] = [
  { key: "activity", label: "내 활동" },
  { key: "applications", label: "신청 내역" },
  { key: "saved", label: "저장함" },
  { key: "settings", label: "계정 설정" },
];

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

export default function MyPage() {
  const { role, name, user } = useAuth();
  const { notices } = useNotices();
  const { posts: boardPosts, savedIds } = useBoard();
  const { posts: anonPosts } = useAnonBoard();
  const { classes } = useTeaching();

  const myName = name ?? "익명의 부원";
  const isPresident = role === "president";
  const [tab, setTab] = useState<Tab>("activity");

  // 내 활동: 공지(회장단만), 자유게시판, 익명게시판
  const myNotices = useMemo(() => (isPresident ? notices : []), [notices, isPresident]);
  const myBoardPosts = useMemo(
    () => boardPosts.filter((p) => p.author === myName),
    [boardPosts, myName]
  );
  const myAnonPosts = useMemo(
    () => anonPosts.filter((p) => p.authorId === user?.id),
    [anonPosts, user]
  );

  const totalActivityCount = myNotices.length + myBoardPosts.length + myAnonPosts.length;

  // 신청 내역: 티칭 클래스
  const appliedClasses = useMemo(
    () => classes.filter((c) => c.applicants.includes(myName)),
    [classes, myName]
  );
  const today = new Date().toISOString().slice(0, 10);
  const upcomingClasses = appliedClasses.filter((c) => c.classDate >= today);
  const pastClasses = appliedClasses.filter((c) => c.classDate < today);

  // 저장함: 자유게시판 저장 글
  const savedBoardPosts = useMemo(
    () => boardPosts.filter((p) => savedIds.has(p.id)),
    [boardPosts, savedIds]
  );

  return (
    <RequireRole allow={["member", "president"]} what="마이페이지">
      <div>
        <PageHeader eyebrow="My Page" title="마이페이지" desc="내가 쓴 글과 참여한 활동을 한눈에 확인해요." />

        {/* 프로필 카드 */}
        <Card className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-afterglow-2 font-display text-2xl text-wind-gold">
            {myName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-lg text-backstage">{myName}</p>
              <Pill tone={isPresident ? "gold" : "teal"}>{isPresident ? "회장단" : "부원"}</Pill>
            </div>
            <p className="mt-1 font-mono text-xs text-mute">
              작성글 {myBoardPosts.length + myAnonPosts.length}개 · 신청 클래스 {appliedClasses.length}개 · 저장 {savedBoardPosts.length}개
            </p>
          </div>
        </Card>

        {/* 탭 */}
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-line">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "border-wind-gold text-wind-gold"
                  : "border-transparent text-mute hover:text-backstage"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 내 활동 */}
        {tab === "activity" && (
          <div className="space-y-3">
            {totalActivityCount === 0 ? (
              <EmptyState title="아직 작성한 글이 없어요" desc="공지, 게시판, 익명게시판에 글을 남겨보세요." />
            ) : (
              <>
                {myNotices.map((n) => (
                  <Link key={`notice-${n.id}`} to={`/notices/${n.id}`}>
                    <Card className="transition-colors hover:border-dawn-teal/40">
                      <div className="flex items-center gap-2">
                        <Pill tone="gold">공지사항</Pill>
                        <p className="text-sm font-medium text-backstage">{n.title}</p>
                      </div>
                      <p className="mt-1.5 font-mono text-xs text-mute">
                        {n.date} · 조회 {n.views}
                      </p>
                    </Card>
                  </Link>
                ))}
                {myBoardPosts.map((p) => (
                  <Link key={`board-${p.id}`} to={`/board/${p.id}`}>
                    <Card className="transition-colors hover:border-dawn-teal/40">
                      <div className="flex items-center gap-2">
                        <Pill tone="teal">자유게시판</Pill>
                        <p className="text-sm font-medium text-backstage">{p.title}</p>
                      </div>
                      <p className="mt-1.5 font-mono text-xs text-mute">
                        {p.date} · 조회 {p.views} · 좋아요 {p.likes}
                      </p>
                    </Card>
                  </Link>
                ))}
                {myAnonPosts.map((p) => (
                  <Link key={`anon-${p.id}`} to={`/anonymous/${p.id}`}>
                    <Card className="transition-colors hover:border-dawn-teal/40">
                      <div className="flex items-center gap-2">
                        <Pill tone="mute">익명게시판</Pill>
                        <p className="text-sm font-medium text-backstage">
                          {p.blinded ? "블라인드 처리된 글" : stripHtml(p.body).slice(0, 40)}
                        </p>
                      </div>
                      <p className="mt-1.5 font-mono text-xs text-mute">
                        {p.displayName} · 조회 {p.views} · 좋아요 {p.likes}
                      </p>
                    </Card>
                  </Link>
                ))}
              </>
            )}
          </div>
        )}

        {/* 신청 내역 */}
        {tab === "applications" && (
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-xs text-mute">다가오는 클래스</p>
              {upcomingClasses.length === 0 ? (
                <p className="text-sm text-mute">신청한 예정 클래스가 없어요.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingClasses.map((c) => (
                    <Link key={c.id} to={`/classes/${c.id}`}>
                      <Card className="transition-colors hover:border-dawn-teal/40">
                        <div className="flex items-center gap-2">
                          <Pill tone="teal">{c.category}</Pill>
                          <p className="text-sm font-medium text-backstage">{c.title}</p>
                        </div>
                        <p className="mt-1.5 font-mono text-xs text-mute">
                          {c.classDate} · {c.classTime}
                        </p>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs text-mute">지난 클래스</p>
              {pastClasses.length === 0 ? (
                <p className="text-sm text-mute">지난 신청 내역이 없어요.</p>
              ) : (
                <div className="space-y-2 opacity-70">
                  {pastClasses.map((c) => (
                    <Link key={c.id} to={`/classes/${c.id}`}>
                      <Card>
                        <div className="flex items-center gap-2">
                          <Pill tone="mute">{c.category}</Pill>
                          <p className="text-sm font-medium text-backstage">{c.title}</p>
                        </div>
                        <p className="mt-1.5 font-mono text-xs text-mute">
                          {c.classDate} · {c.classTime}
                        </p>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 저장함 */}
        {tab === "saved" && (
          <div className="space-y-3">
            {savedBoardPosts.length === 0 ? (
              <EmptyState title="저장한 글이 없어요" desc="자유게시판에서 마음에 드는 글을 저장해보세요." />
            ) : (
              savedBoardPosts.map((p) => (
                <Link key={p.id} to={`/board/${p.id}`}>
                  <Card className="transition-colors hover:border-dawn-teal/40">
                    <p className="text-sm font-medium text-backstage">{p.title}</p>
                    <p className="mt-1.5 font-mono text-xs text-mute">
                      {p.author} · {p.date} · 좋아요 {p.likes}
                    </p>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}

        {/* 계정 설정 */}
        {tab === "settings" && (
          <Card className="space-y-5">
            <div>
              <p className="mb-1.5 text-xs text-mute">이름</p>
              <p className="text-sm text-backstage">{myName}</p>
            </div>
            <div>
              <p className="mb-1.5 text-xs text-mute">권한</p>
              <Pill tone={isPresident ? "gold" : "teal"}>{isPresident ? "회장단" : "부원"}</Pill>
            </div>
            <div className="rounded-lg border border-line bg-stage p-3 text-xs leading-relaxed text-mute">
              프로필 정보 수정, 로그아웃/회원 탈퇴 등은 마이페이지 계정 설정에서 이어서 관리할 예정이에요.
            </div>
          </Card>
        )}
      </div>
    </RequireRole>
  );
}
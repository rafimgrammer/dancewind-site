// src/pages/MyPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Card, Pill, RequireRole, EmptyState } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useNotices } from "../context/NoticesContext";
import { useBoard, type MyBoardComment } from "../context/BoardContext";
import { useAnonBoard, type MyAnonComment } from "../context/AnonBoardContext";
import { useTeaching, type MyTeachingComment } from "../context/TeachingContext";
import { useReels, type MyReelsComment } from "../context/ReelsContext";
import { formatTimeAgo } from "../utils/timeAgo";

type Tab = "activity" | "applications" | "saved" | "account";
type BoardKey = "notices" | "board" | "anonymous" | "classes" | "reels";
type SubTab = "liked" | "posted" | "commented";
type SaveBoardKey = "board" | "anonymous" | "classes" | "reels";

const TABS: { key: Tab; label: string }[] = [
  { key: "activity", label: "내 활동" },
  { key: "applications", label: "신청 내역" },
  { key: "saved", label: "저장함" },
  { key: "account", label: "계정 정보" },
];

const SUB_TAB_LABEL: Record<SubTab, string> = {
  liked: "좋아요 누른 글",
  posted: "내가 올린 글",
  commented: "댓글 쓴 글",
};

const SAVE_CONFIGS: { key: SaveBoardKey; label: string }[] = [
  { key: "board", label: "자유게시판" },
  { key: "anonymous", label: "익명게시판" },
  { key: "classes", label: "티칭 클래스" },
  { key: "reels", label: "같이 릴스찍자!" },
];

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

interface ListItem {
  id: string;
  title: string;
  preview?: string;
  meta: string;
  href: string;
}

export default function MyPage() {
  const { role, name, user, profile } = useAuth();
  const { notices } = useNotices();
  const { posts: boardPosts, likedIds: boardLikedIds, savedIds, fetchMyComments: fetchMyBoardComments } = useBoard();
  const {
    posts: anonPosts,
    likedIds: anonLikedIds,
    savedIds: anonSavedIds,
    fetchMyComments: fetchMyAnonComments,
  } = useAnonBoard();
  const { classes, savedIds: teachingSavedIds, fetchMyComments: fetchMyTeachingComments } = useTeaching();
  const {
    posts: reelsPosts,
    isApplied: isReelsApplied,
    savedIds: reelsSavedIds,
    fetchMyComments: fetchMyReelsComments,
  } = useReels();

  const myName = name ?? "익명의 부원";
  const isPresident = role === "president";
  const [tab, setTab] = useState<Tab>("activity");

  const BOARD_CONFIGS: { key: BoardKey; label: string; presidentOnly?: boolean; subTabs: SubTab[] }[] = [
    { key: "notices", label: "공지사항", presidentOnly: true, subTabs: ["posted"] },
    { key: "board", label: "자유게시판", subTabs: ["liked", "posted", "commented"] },
    { key: "anonymous", label: "익명게시판", subTabs: ["liked", "posted", "commented"] },
    { key: "classes", label: "티칭 클래스", subTabs: ["posted", "commented"] },
    { key: "reels", label: "같이 릴스찍자!", subTabs: ["posted", "commented"] },
  ];
  const visibleBoards = BOARD_CONFIGS.filter((b) => !b.presidentOnly || isPresident);

  const [selectedBoard, setSelectedBoard] = useState<BoardKey>("board");
  const [selectedSubTab, setSelectedSubTab] = useState<SubTab>("liked");
  const [selectedSaveBoard, setSelectedSaveBoard] = useState<SaveBoardKey>("board");

  const currentConfig = visibleBoards.find((b) => b.key === selectedBoard) ?? visibleBoards[0];
  const activeSubTab = currentConfig.subTabs.includes(selectedSubTab)
    ? selectedSubTab
    : currentConfig.subTabs[0];

  const handleSelectBoard = (key: BoardKey) => {
    setSelectedBoard(key);
    const cfg = visibleBoards.find((b) => b.key === key)!;
    setSelectedSubTab(cfg.subTabs[0]);
  };

  // "댓글 쓴 글" 탭은 게시판 전체를 다 훑는 대신, 내가 쓴 댓글만 딱 필요한 만큼 불러와요.
  const [myBoardComments, setMyBoardComments] = useState<MyBoardComment[]>([]);
  const [myAnonComments, setMyAnonComments] = useState<MyAnonComment[]>([]);

  useEffect(() => {
    if (selectedBoard === "board" && activeSubTab === "commented") {
      fetchMyBoardComments().then(setMyBoardComments);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoard, activeSubTab]);

  useEffect(() => {
    if (selectedBoard === "anonymous" && activeSubTab === "commented") {
      fetchMyAnonComments().then(setMyAnonComments);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoard, activeSubTab]);

  const [myTeachingComments, setMyTeachingComments] = useState<MyTeachingComment[]>([]);
  const [myReelsComments, setMyReelsComments] = useState<MyReelsComment[]>([]);

  useEffect(() => {
    if (selectedBoard === "classes" && activeSubTab === "commented") {
      fetchMyTeachingComments().then(setMyTeachingComments);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoard, activeSubTab]);

  useEffect(() => {
    if (selectedBoard === "reels" && activeSubTab === "commented") {
      fetchMyReelsComments().then(setMyReelsComments);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoard, activeSubTab]);

  const myNoticesCount = isPresident ? notices.filter((n) => n.author === myName).length : 0;
  const myBoardPostCount = boardPosts.filter((p) => p.authorId === user?.id).length;
  const myAnonPostCount = anonPosts.filter((p) => p.authorId === user?.id).length;
  const totalActivityCount =
    myNoticesCount +
    myBoardPostCount +
    myAnonPostCount +
    classes.filter((c) => c.teacherId === user?.id).length +
    reelsPosts.filter((p) => p.creatorId === user?.id).length;

  const items: ListItem[] = useMemo(() => {
    if (selectedBoard === "notices") {
      return notices
        .filter((n) => n.author === myName)
        .map((n) => ({
          id: n.id,
          title: n.title,
          meta: `${n.date} · 조회 ${n.views}`,
          href: `/notices/${n.id}`,
        }));
    }

    if (selectedBoard === "board") {
      if (activeSubTab === "liked") {
        return boardPosts
          .filter((p) => boardLikedIds.has(p.id))
          .map((p) => ({
            id: p.id,
            title: p.title,
            meta: `${p.author} · ${p.date} · 좋아요 ${p.likes}`,
            href: `/board/${p.id}`,
          }));
      }
      if (activeSubTab === "posted") {
        return boardPosts
          .filter((p) => p.authorId === user?.id)
          .map((p) => ({
            id: p.id,
            title: p.title,
            meta: `${p.date} · 조회 ${p.views} · 좋아요 ${p.likes}`,
            href: `/board/${p.id}`,
          }));
      }
      const map = new Map<string, ListItem>();
      myBoardComments.forEach((c) => {
        if (!map.has(c.postId)) {
          map.set(c.postId, {
            id: c.postId,
            title: c.postTitle,
            preview: c.content,
            meta: formatTimeAgo(new Date(c.createdAt).getTime()),
            href: `/board/${c.postId}`,
          });
        }
      });
      return Array.from(map.values());
    }

    if (selectedBoard === "anonymous") {
      if (activeSubTab === "liked") {
        return anonPosts
          .filter((p) => anonLikedIds.has(p.id))
          .map((p) => ({
            id: p.id,
            title: p.blinded ? "블라인드 처리된 글" : stripHtml(p.body).slice(0, 50),
            meta: `${p.displayName} · 좋아요 ${p.likes}`,
            href: `/anonymous/${p.id}`,
          }));
      }
      if (activeSubTab === "posted") {
        return anonPosts
          .filter((p) => p.authorId === user?.id)
          .map((p) => ({
            id: p.id,
            title: p.blinded ? "블라인드 처리된 글" : stripHtml(p.body).slice(0, 50),
            meta: `조회 ${p.views} · 좋아요 ${p.likes}`,
            href: `/anonymous/${p.id}`,
          }));
      }
      const map = new Map<string, ListItem>();
      myAnonComments.forEach((c) => {
        if (!map.has(c.postId)) {
          map.set(c.postId, {
            id: c.postId,
            title: c.postPreview,
            preview: c.content,
            meta: formatTimeAgo(new Date(c.createdAt).getTime()),
            href: `/anonymous/${c.postId}`,
          });
        }
      });
      return Array.from(map.values());
    }

    if (selectedBoard === "classes") {
      if (activeSubTab === "posted") {
        return classes
          .filter((c) => c.teacherId === user?.id)
          .map((c) => ({
            id: c.id,
            title: c.title,
            meta: `${c.classDate} · ${c.classTime} · 신청 ${c.applicants.length}${c.maxSpots === null ? "명" : `/${c.maxSpots}`
              }`,
            href: `/classes/${c.id}`,
          }));
      }
      const map = new Map<string, ListItem>();
      myTeachingComments.forEach((cm) => {
        if (!map.has(cm.classId)) {
          map.set(cm.classId, {
            id: cm.classId,
            title: cm.classTitle,
            preview: cm.content,
            meta: cm.date,
            href: `/classes/${cm.classId}`,
          });
        }
      });
      return Array.from(map.values());
    }

    if (selectedBoard === "reels") {
      if (activeSubTab === "posted") {
        return reelsPosts
          .filter((p) => p.creatorId === user?.id)
          .map((p) => ({
            id: p.id,
            title: p.title,
            meta: `${p.shootDate ?? "날짜 미정"} · 참여 ${p.applicants.length}${p.maxSpots === null ? "명" : `/${p.maxSpots}`
              }`,
            href: `/reels/${p.id}`,
          }));
      }
      const map = new Map<string, ListItem>();
      myReelsComments.forEach((cm) => {
        if (!map.has(cm.postId)) {
          map.set(cm.postId, {
            id: cm.postId,
            title: cm.postTitle,
            preview: cm.content,
            meta: cm.date,
            href: `/reels/${cm.postId}`,
          });
        }
      });
      return Array.from(map.values());
    }

    return [];
  }, [
    selectedBoard,
    activeSubTab,
    notices,
    boardPosts,
    boardLikedIds,
    myBoardComments,
    anonPosts,
    anonLikedIds,
    myAnonComments,
    classes,
    myTeachingComments,
    reelsPosts,
    myReelsComments,
    myName,
    user,
  ]);

  const appliedClasses = useMemo(
    () => classes.filter((c) => c.applicants.includes(myName)),
    [classes, myName]
  );
  const today = new Date().toISOString().slice(0, 10);
  const upcomingClasses = appliedClasses.filter((c) => c.classDate >= today);
  const pastClasses = appliedClasses.filter((c) => c.classDate < today);

  const appliedReels = useMemo(
    () => reelsPosts.filter((p) => isReelsApplied(p.id)),
    [reelsPosts, isReelsApplied]
  );

  const savedBoardPosts = useMemo(() => boardPosts.filter((p) => savedIds.has(p.id)), [boardPosts, savedIds]);
  const savedAnonPosts = useMemo(() => anonPosts.filter((p) => anonSavedIds.has(p.id)), [anonPosts, anonSavedIds]);
  const savedClasses = useMemo(() => classes.filter((c) => teachingSavedIds.has(c.id)), [classes, teachingSavedIds]);
  const savedReels = useMemo(() => reelsPosts.filter((p) => reelsSavedIds.has(p.id)), [reelsPosts, reelsSavedIds]);

  const totalSavedCount =
    savedBoardPosts.length + savedAnonPosts.length + savedClasses.length + savedReels.length;

  return (
    <RequireRole allow={["member", "president"]} what="마이페이지">
      <div>
        <PageHeader eyebrow="My Page" title="마이페이지" desc="내가 쓴 글과 참여한 활동을 한눈에 확인해요." />

        {/* 프로필 카드 */}
        <Card className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-afterglow-2">
            <img src="/dancewindlogo.png" alt="" className="h-full w-full object-contain p-2" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-lg text-backstage">{myName}</p>
              <Pill tone={isPresident ? "gold" : "teal"}>{isPresident ? "회장단" : "부원"}</Pill>
            </div>
            <p className="mt-1 font-mono text-xs text-mute">
              작성글 {totalActivityCount}개 · 신청 {appliedClasses.length + appliedReels.length}개 · 저장{" "}
              {totalSavedCount}개
            </p>
          </div>
        </Card>

        {/* 메인 탭 */}
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-line">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${tab === t.key
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
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <div className="flex gap-1.5 overflow-x-auto sm:flex-col sm:overflow-visible">
              {visibleBoards.map((b) => (
                <button
                  key={b.key}
                  onClick={() => handleSelectBoard(b.key)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors sm:shrink ${selectedBoard === b.key
                      ? "bg-wind-gold/10 text-wind-gold"
                      : "text-backstage/75 hover:bg-afterglow-2"
                    }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${selectedBoard === b.key ? "bg-wind-gold" : "bg-transparent"
                      }`}
                  />
                  {b.label}
                </button>
              ))}
            </div>

            <div>
              {currentConfig.subTabs.length > 1 && (
                <div className="mb-3 flex gap-2">
                  {currentConfig.subTabs.map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedSubTab(st)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${activeSubTab === st
                          ? "border-dawn-teal/50 bg-dawn-teal/10 text-dawn-teal"
                          : "border-line text-mute hover:border-dawn-teal/30"
                        }`}
                    >
                      {SUB_TAB_LABEL[st]}
                    </button>
                  ))}
                </div>
              )}

              {items.length === 0 ? (
                <EmptyState
                  title="아직 없어요"
                  desc={`${currentConfig.label}에서 ${SUB_TAB_LABEL[activeSubTab]} 항목이 없어요.`}
                />
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <Link key={item.id} to={item.href}>
                      <Card className="transition-colors hover:border-dawn-teal/40">
                        <p className="text-sm font-medium text-backstage">{item.title}</p>
                        {item.preview && (
                          <p className="mt-1 truncate text-xs text-dawn-teal">💬 {item.preview}</p>
                        )}
                        <p className="mt-1.5 font-mono text-xs text-mute">{item.meta}</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 신청 내역 */}
        {tab === "applications" && (
          <div className="space-y-8">
            <div>
              <p className="mb-2 text-xs font-semibold text-wind-gold">🎵 티칭 클래스</p>
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
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-dawn-teal">🎬 같이 릴스찍자!</p>
              {appliedReels.length === 0 ? (
                <p className="text-sm text-mute">신청한 릴스가 없어요.</p>
              ) : (
                <div className="space-y-2">
                  {appliedReels.map((p) => (
                    <Link key={p.id} to={`/reels/${p.id}`}>
                      <Card className="transition-colors hover:border-dawn-teal/40">
                        <p className="text-sm font-medium text-backstage">{p.title}</p>
                        <p className="mt-1.5 font-mono text-xs text-mute">
                          {p.shootDate ?? "날짜 미정"} {p.shootTime ?? ""}
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
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <div className="flex gap-1.5 overflow-x-auto sm:flex-col sm:overflow-visible">
              {SAVE_CONFIGS.map((b) => (
                <button
                  key={b.key}
                  onClick={() => setSelectedSaveBoard(b.key)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors sm:shrink ${selectedSaveBoard === b.key
                      ? "bg-wind-gold/10 text-wind-gold"
                      : "text-backstage/75 hover:bg-afterglow-2"
                    }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${selectedSaveBoard === b.key ? "bg-wind-gold" : "bg-transparent"
                      }`}
                  />
                  {b.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {selectedSaveBoard === "board" &&
                (savedBoardPosts.length === 0 ? (
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
                ))}

              {selectedSaveBoard === "anonymous" &&
                (savedAnonPosts.length === 0 ? (
                  <EmptyState title="저장한 글이 없어요" desc="익명게시판에서 마음에 드는 글을 저장해보세요." />
                ) : (
                  savedAnonPosts.map((p) => (
                    <Link key={p.id} to={`/anonymous/${p.id}`}>
                      <Card className="transition-colors hover:border-dawn-teal/40">
                        <p className="text-sm font-medium text-backstage">
                          {p.blinded ? "블라인드 처리된 글" : stripHtml(p.body).slice(0, 50)}
                        </p>
                        <p className="mt-1.5 font-mono text-xs text-mute">
                          {p.displayName} · 좋아요 {p.likes}
                        </p>
                      </Card>
                    </Link>
                  ))
                ))}

              {selectedSaveBoard === "classes" &&
                (savedClasses.length === 0 ? (
                  <EmptyState title="저장한 클래스가 없어요" desc="티칭 클래스에서 마음에 드는 클래스를 저장해보세요." />
                ) : (
                  savedClasses.map((c) => (
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
                  ))
                ))}

              {selectedSaveBoard === "reels" &&
                (savedReels.length === 0 ? (
                  <EmptyState title="저장한 릴스가 없어요" desc="같이 릴스찍자에서 마음에 드는 게시물을 저장해보세요." />
                ) : (
                  savedReels.map((p) => (
                    <Link key={p.id} to={`/reels/${p.id}`}>
                      <Card className="transition-colors hover:border-dawn-teal/40">
                        <p className="text-sm font-medium text-backstage">{p.title}</p>
                        <p className="mt-1.5 font-mono text-xs text-mute">
                          {p.shootDate ?? "날짜 미정"} {p.shootTime ?? ""}
                        </p>
                      </Card>
                    </Link>
                  ))
                ))}
            </div>
          </div>
        )}

        {/* 계정 정보 */}
        {tab === "account" && (
          <Card className="space-y-5">
            <div>
              <p className="mb-1.5 text-xs text-mute">이름</p>
              <p className="text-sm text-backstage">{profile?.name ?? myName}</p>
            </div>
            <div>
              <p className="mb-1.5 text-xs text-mute">이메일</p>
              <p className="text-sm text-backstage">{profile?.email ?? "-"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1.5 text-xs text-mute">학번</p>
                <p className="text-sm text-backstage">{profile?.student_id ?? "-"}</p>
              </div>
              <div>
                <p className="mb-1.5 text-xs text-mute">학과</p>
                <p className="text-sm text-backstage">{profile?.department ?? "-"}</p>
              </div>
              <div>
                <p className="mb-1.5 text-xs text-mute">가입 기수</p>
                <p className="text-sm text-backstage">{profile?.cohort ?? "-"}</p>
              </div>
              <div>
                <p className="mb-1.5 text-xs text-mute">권한</p>
                <Pill tone={isPresident ? "gold" : "teal"}>{isPresident ? "회장단" : "부원"}</Pill>
              </div>
            </div>
          </Card>
        )}
      </div>
    </RequireRole>
  );
}
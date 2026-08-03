// src/pages/TeachingForm.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, Card, RequireRole } from "../components/Ui";
import { useTeaching } from "../context/TeachingContext";
import { getYoutubeId, fetchYoutubeTitle } from "../utils/youtube";

const CATEGORIES = ["케이팝", "코레오", "스트릿", "락킹", "왁킹", "보깅", "힙합", "하우스"];
const TIME_PATTERN = /^([0-9]{1,2}):([0-5][0-9])$/;

export default function TeachingForm() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const { getById, addClass, editClass } = useTeaching();
  const navigate = useNavigate();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const [songStart, setSongStart] = useState("");
  const [songEnd, setSongEnd] = useState("");
  const [songStartError, setSongStartError] = useState("");
  const [songEndError, setSongEndError] = useState("");
  const [classDate, setClassDate] = useState("");
  const [classTime, setClassTime] = useState("");
  const [unlimited, setUnlimited] = useState(false);
  const [maxSpots, setMaxSpots] = useState(10);
  const [loaded, setLoaded] = useState(!isEditMode);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      const existing = getById(id);
      if (existing) {
        setCategory(existing.category);
        setTitle(existing.title);
        setDescription(existing.description);
        setYoutubeUrl(existing.youtubeUrl);
        setSongTitle(existing.songTitle);
        setSongStart(existing.songStart);
        setSongEnd(existing.songEnd);
        setClassDate(existing.classDate);
        setClassTime(existing.classTime);
        setUnlimited(existing.maxSpots === null);
        setMaxSpots(existing.maxSpots ?? 10);
        setLoaded(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const videoId = getYoutubeId(youtubeUrl);

  const validateTimeFormat = (value: string) => {
    if (!value) return true;
    return TIME_PATTERN.test(value);
  };

  const handleSongStartChange = (value: string) => {
    setSongStart(value);
    setSongStartError(validateTimeFormat(value) ? "" : "분:초 형식으로 입력해주세요 (예: 0:45)");
  };

  const handleSongEndChange = (value: string) => {
    setSongEnd(value);
    setSongEndError(validateTimeFormat(value) ? "" : "분:초 형식으로 입력해주세요 (예: 1:30)");
  };

  const handleUrlBlur = async () => {
    if (!youtubeUrl.trim() || !getYoutubeId(youtubeUrl)) return;
    setFetchingTitle(true);
    const fetched = await fetchYoutubeTitle(youtubeUrl);
    if (fetched) setSongTitle(fetched);
    setFetchingTitle(false);
  };

  const trySubmit = () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!classDate || !classTime) {
      alert("클래스 날짜와 시간을 입력해주세요.");
      return;
    }
    if (songStart && !validateTimeFormat(songStart)) {
      alert("시작 구간을 분:초 형식으로 입력해주세요 (예: 0:45)");
      return;
    }
    if (songEnd && !validateTimeFormat(songEnd)) {
      alert("종료 구간을 분:초 형식으로 입력해주세요 (예: 1:30)");
      return;
    }
    setShowConfirm(true);
  };

  const doSubmit = async () => {
    if (isEditMode && id) {
      await editClass(id, {
        title: title.trim(),
        description: description.trim(),
        youtubeUrl: youtubeUrl.trim(),
        songTitle: songTitle.trim(),
        songStart: songStart.trim() || "0:00",
        songEnd: songEnd.trim() || "0:00",
        classDate,
        classTime,
      });
      navigate(`/classes/${id}`);
    } else {
      await addClass({
        category,
        title: title.trim(),
        description: description.trim(),
        youtubeUrl: youtubeUrl.trim(),
        songTitle: songTitle.trim(),
        songStart: songStart.trim() || "0:00",
        songEnd: songEnd.trim() || "0:00",
        classDate,
        classTime,
        maxSpots: unlimited ? null : maxSpots,
      });
      navigate("/classes");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal";
  const labelClass = "mb-1.5 block text-xs text-mute";

  if (isEditMode && !loaded) {
    return (
      <RequireRole allow={["member", "president"]} what="클래스 수정">
        <PageHeader eyebrow="Teaching" title="클래스를 찾는 중..." desc="" />
      </RequireRole>
    );
  }

  return (
    <RequireRole allow={["member", "president"]} what={isEditMode ? "클래스 수정" : "클래스 등록"}>
      <div>
        <PageHeader
          eyebrow="Teaching"
          title={isEditMode ? "클래스 수정" : "클래스 등록"}
          desc="부원들에게 열릴 클래스를 소개해주세요."
        />
        <Card className="space-y-4">
          {!isEditMode && (
            <div>
              <label className={labelClass}>카테고리</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 힙합 베이직 클래스"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>클래스 소개</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 클래스인지, 준비물이나 난이도 등을 자유롭게 적어주세요."
              rows={5}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>유튜브 링크</label>
            <input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="https://www.youtube.com/watch?v=..."
              className={inputClass}
            />
            {fetchingTitle && <p className="mt-1 text-xs text-mute">노래 제목 불러오는 중...</p>}
            {videoId && (
              <div className="mt-3 aspect-video overflow-hidden rounded-lg">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="영상 미리보기"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>노래 제목 (자동으로 채워져요, 수정 가능)</label>
            <input
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="유튜브 링크 입력 시 자동 입력"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>시작 구간 (분:초, 예: 0:45)</label>
              <input
                value={songStart}
                onChange={(e) => handleSongStartChange(e.target.value)}
                placeholder="0:45"
                inputMode="numeric"
                className={`${inputClass} ${songStartError ? "border-red-400/60" : ""}`}
              />
              {songStartError && <p className="mt-1 text-[11px] text-red-300">{songStartError}</p>}
            </div>
            <div>
              <label className={labelClass}>종료 구간 (분:초, 예: 1:30)</label>
              <input
                value={songEnd}
                onChange={(e) => handleSongEndChange(e.target.value)}
                placeholder="1:30"
                inputMode="numeric"
                className={`${inputClass} ${songEndError ? "border-red-400/60" : ""}`}
              />
              {songEndError && <p className="mt-1 text-[11px] text-red-300">{songEndError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>클래스 날짜</label>
              <input
                type="date"
                value={classDate}
                onChange={(e) => setClassDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>클래스 시간</label>
              <input
                type="time"
                value={classTime}
                onChange={(e) => setClassTime(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {!isEditMode && (
            <div>
              <label className={labelClass}>정원 (본인 포함 인원수로 입력해주세요)</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  value={maxSpots}
                  onChange={(e) => setMaxSpots(Number(e.target.value))}
                  disabled={unlimited}
                  className={`${inputClass} disabled:opacity-40`}
                />
                <label className="flex shrink-0 items-center gap-1.5 text-xs text-backstage/80">
                  <input
                    type="checkbox"
                    checked={unlimited}
                    onChange={(e) => setUnlimited(e.target.checked)}
                    className="accent-wind-gold"
                  />
                  인원무관
                </label>
              </div>
              <p className="mt-1.5 text-[11px] text-mute">
                클래스를 개설하면 본인도 자동으로 신청 인원에 포함돼요. 예: 총 8명을 원하시면 8을 입력해주세요.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => navigate(isEditMode ? `/classes/${id}` : "/classes")}
              className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
            >
              취소
            </button>
            <button onClick={trySubmit} className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage">
              {isEditMode ? "수정 완료" : "등록"}
            </button>
          </div>
        </Card>
      </div>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stage/70 backdrop-blur-sm"
          onClick={() => setShowConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-afterglow p-6"
          >
            <p className="font-display text-lg text-backstage">
              {isEditMode ? "수정하시겠습니까?" : "등록하시겠습니까?"}
            </p>
            <p className="mt-2 text-sm text-backstage/70">
              {isEditMode ? "변경된 내용으로 클래스가 업데이트됩니다." : "클래스가 목록에 바로 등록됩니다."}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
              >
                아니요
              </button>
              <button
                onClick={async () => {
                  setShowConfirm(false);
                  await doSubmit();
                }}
                className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
              >
                {isEditMode ? "수정할게요" : "등록할게요"}
              </button>
            </div>
          </div>
        </div>
      )}
    </RequireRole>
  );
}
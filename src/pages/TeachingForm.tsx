// src/pages/TeachingForm.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, RequireRole } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { useTeaching } from "../context/TeachingContext";
import { getYoutubeId, fetchYoutubeTitle } from "../utils/youtube";

const CATEGORIES = ["케이팝", "코레오", "스트릿", "락킹", "왁킹", "보깅", "힙합", "하우스"];

export default function TeachingForm() {
  const { name } = useAuth() as { name?: string };
  const { addClass } = useTeaching();
  const navigate = useNavigate();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const [songStart, setSongStart] = useState("");
  const [songEnd, setSongEnd] = useState("");
  const [classDate, setClassDate] = useState("");
  const [classTime, setClassTime] = useState("");
  const [unlimited, setUnlimited] = useState(false);
  const [maxSpots, setMaxSpots] = useState(10);

  const videoId = getYoutubeId(youtubeUrl);

  const handleUrlBlur = async () => {
    if (!youtubeUrl.trim() || !getYoutubeId(youtubeUrl)) return;
    setFetchingTitle(true);
    const fetched = await fetchYoutubeTitle(youtubeUrl);
    if (fetched) setSongTitle(fetched);
    setFetchingTitle(false);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!classDate || !classTime) {
      alert("클래스 날짜와 시간을 입력해주세요.");
      return;
    }
    addClass({
      category,
      title: title.trim(),
      description: description.trim(),
      teacher: name ?? "익명의 부원",
      youtubeUrl: youtubeUrl.trim(),
      songTitle: songTitle.trim(),
      songStart: songStart.trim() || "0:00",
      songEnd: songEnd.trim() || "0:00",
      classDate,
      classTime,
      maxSpots: unlimited ? null : maxSpots,
    });
    navigate("/classes");
  };

  const inputClass =
    "w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal";
  const labelClass = "mb-1.5 block text-xs text-mute";

  return (
    <RequireRole allow={["member", "president"]} what="클래스 등록">
      <div>
        <PageHeader eyebrow="Teaching" title="클래스 등록" desc="부원들에게 열릴 클래스를 소개해주세요." />
        <Card className="space-y-4">
          <div>
            <label className={labelClass}>카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

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
              <label className={labelClass}>시작 구간 (예: 0:45)</label>
              <input
                value={songStart}
                onChange={(e) => setSongStart(e.target.value)}
                placeholder="0:45"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>종료 구간 (예: 1:30)</label>
              <input
                value={songEnd}
                onChange={(e) => setSongEnd(e.target.value)}
                placeholder="1:30"
                className={inputClass}
              />
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

          <div>
            <label className={labelClass}>정원</label>
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
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => navigate("/classes")}
              className="rounded-lg border border-line px-4 py-2 text-sm text-mute"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage"
            >
              등록
            </button>
          </div>
        </Card>
      </div>
    </RequireRole>
  );
}
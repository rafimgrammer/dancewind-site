// src/pages/ReelsForm.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, RequireRole } from "../components/Ui";
import { useReels } from "../context/ReelsContext";

export default function ReelsForm() {
  const { addPost } = useReels();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [scheduleTBD, setScheduleTBD] = useState(false);
  const [shootDate, setShootDate] = useState("");
  const [shootTime, setShootTime] = useState("");
  const [location, setLocation] = useState("");
  const [unlimited, setUnlimited] = useState(false);
  const [maxSpots, setMaxSpots] = useState(4);

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    if (!scheduleTBD && (!shootDate || !shootTime)) {
      alert("촬영 날짜와 시간을 입력하거나, '합의 후 결정'을 체크해주세요.");
      return;
    }
    if (!youtubeUrl.trim() && !instagramUrl.trim()) {
      alert("참고할 유튜브 또는 인스타그램 링크를 하나 이상 입력해주세요.");
      return;
    }
    await addPost({
      title: title.trim(),
      description: description.trim(),
      youtubeUrl: youtubeUrl.trim(),
      instagramUrl: instagramUrl.trim(),
      shootDate: scheduleTBD ? null : shootDate,
      shootTime: scheduleTBD ? null : shootTime,
      location: location.trim(),
      maxSpots: unlimited ? null : maxSpots,
    });
    navigate("/reels");
  };

  const inputClass =
    "w-full rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute outline-none focus:border-dawn-teal";
  const labelClass = "mb-1.5 block text-xs text-mute";
  const checkboxClass = "accent-[var(--color-wind-gold)]";

  return (
    <RequireRole allow={["member", "president"]} what="릴스 모집 등록">
      <div>
        <PageHeader eyebrow="Reels" title="릴스 모집 등록" desc="참고 영상과 촬영 정보를 남겨주세요." />
        <Card className="space-y-4">
          <div>
            <label className={labelClass}>제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 이번 챌린지 같이 찍어요"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>소개</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 느낌으로 찍고 싶은지 자유롭게 적어주세요."
              rows={4}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>유튜브 참고 링크 (선택)</label>
            <input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>인스타그램 릴스 링크 (선택)</label>
            <input
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-backstage/80">
              <input
                type="checkbox"
                checked={scheduleTBD}
                onChange={(e) => setScheduleTBD(e.target.checked)}
                className={checkboxClass}
              />
              날짜/시간은 아직 미정, 댓글로 합의 후 결정할래요
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>촬영 날짜</label>
              <input
                type="date"
                value={shootDate}
                onChange={(e) => setShootDate(e.target.value)}
                disabled={scheduleTBD}
                className={`${inputClass} disabled:opacity-40`}
              />
            </div>
            <div>
              <label className={labelClass}>촬영 시간</label>
              <input
                type="time"
                value={shootTime}
                onChange={(e) => setShootTime(e.target.value)}
                disabled={scheduleTBD}
                className={`${inputClass} disabled:opacity-40`}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>촬영 장소</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: 중강당 앞"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>모집 인원 (본인 포함 인원수로 입력해주세요)</label>
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
                  className={checkboxClass}
                />
                인원무관
              </label>
            </div>
            <p className="mt-1.5 text-[11px] text-mute">
              릴스를 개설하면 본인도 자동으로 참여 인원에 포함돼요.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => navigate("/reels")} className="rounded-lg border border-line px-4 py-2 text-sm text-mute">
              취소
            </button>
            <button onClick={handleSubmit} className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage">
              등록
            </button>
          </div>
        </Card>
      </div>
    </RequireRole>
  );
}
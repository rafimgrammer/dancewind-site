import { useState } from "react";
import { PageHeader, Card, Pill, RequireRole } from "../components/Ui";

interface Track {
  id: string;
  team: string;
  song: string;
  artist: string;
}

const INITIAL: Track[] = [
  { id: "t1", team: "힙합 1팀", song: "Bad Boy", artist: "Chris Brown" },
  { id: "t2", team: "왁킹 팀", song: "Vogue", artist: "Madonna" },
  { id: "t3", team: "힙합 2팀", song: "Bad Boy", artist: "Chris Brown" },
  { id: "t4", team: "걸스힙합 팀", song: "Genie", artist: "SNSD" },
];

export default function TracklistMaster() {
  const [tracks, setTracks] = useState<Track[]>(INITIAL);
  const [form, setForm] = useState({ team: "", song: "", artist: "" });

  const duplicateSongs = new Set(
    Object.entries(
      tracks.reduce<Record<string, number>>((acc, t) => {
        const key = t.song.trim().toLowerCase();
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    )
      .filter(([, count]) => count > 1)
      .map(([song]) => song)
  );

  const addTrack = () => {
    if (!form.team.trim() || !form.song.trim()) return;
    setTracks((prev) => [...prev, { id: `t${Date.now()}`, ...form }]);
    setForm({ team: "", song: "", artist: "" });
  };

  return (
    <RequireRole allow={["president"]} what="트랙리스트 마스터">
      <div>
        <PageHeader
          eyebrow="Tracklist Master"
          title="트랙리스트 마스터"
          desc="공연에서 팀끼리 같은 곡이 겹치지 않도록 관리해요. 겹치는 곡은 자동으로 표시됩니다."
        />

        <div className="mb-6 grid gap-2 rounded-2xl border border-line bg-afterglow p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <input
            value={form.team}
            onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}
            placeholder="팀명"
            className="rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute focus:border-dawn-teal outline-none"
          />
          <input
            value={form.song}
            onChange={(e) => setForm((f) => ({ ...f, song: e.target.value }))}
            placeholder="곡명"
            className="rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute focus:border-dawn-teal outline-none"
          />
          <input
            value={form.artist}
            onChange={(e) => setForm((f) => ({ ...f, artist: e.target.value }))}
            placeholder="아티스트"
            className="rounded-lg border border-line bg-stage px-3 py-2 text-sm text-backstage placeholder:text-mute focus:border-dawn-teal outline-none"
          />
          <button onClick={addTrack} className="rounded-lg bg-wind-gold px-4 py-2 text-sm font-semibold text-stage">
            등록
          </button>
        </div>

        <div className="space-y-2">
          {tracks.map((t) => {
            const isDup = duplicateSongs.has(t.song.trim().toLowerCase());
            return (
              <Card key={t.id} className={isDup ? "border-red-400/40" : ""}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Pill tone={isDup ? "mute" : "teal"}>{t.team}</Pill>
                    <div>
                      <p className="text-sm font-medium text-backstage">{t.song}</p>
                      <p className="font-mono text-xs text-mute">{t.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDup && (
                      <span className="rounded-full border border-red-400/40 bg-red-400/10 px-2.5 py-0.5 font-mono text-[11px] text-red-300">
                        곡 겹침
                      </span>
                    )}
                    <button
                      onClick={() => setTracks((prev) => prev.filter((x) => x.id !== t.id))}
                      className="text-[11px] text-mute hover:text-red-300"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </RequireRole>
  );
}

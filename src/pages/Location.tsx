import { useEffect, useRef } from "react";
import { PageHeader, Card } from "../components/Ui";

const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY;
const LAT = 37.88651;
const LNG = 127.74017;

function KakaoMap() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptId = "kakao-map-sdk";

    function initMap() {
      if (!mapRef.current) return;
      window.kakao.maps.load(() => {
        const map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(LAT, LNG),
          level: 3,
        });

        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(LAT, LNG),
        });
        marker.setMap(map);
      });
    }

    if (window.kakao && window.kakao.maps) {
      initMap();
      return;
    }

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", initMap);

    return () => {
      script?.removeEventListener("load", initMap);
    };
  }, []);

  return <div ref={mapRef} className="h-full w-full rounded-xl" />;
}

export default function Location() {
  return (
    <div>
      <PageHeader eyebrow="Location" title="동방 찾아오시는 길" desc="학생회관 지하, 거울과 스피커가 있는 그 방입니다." />
      <div className="grid min-w-0 gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <Card className="aspect-[16/10] min-w-0 overflow-hidden p-0">
          <KakaoMap />
        </Card>
        <div className="min-w-0 space-y-4">
          <Card>
            <p className="font-display text-lg text-backstage">한림대학교 캠퍼스라이프센터 B1 춤바람 동방</p>
            <p className="mt-2 text-sm leading-relaxed text-backstage/75">
              정문에서 캠퍼스라이프센터까지 도보 3분, 지하 계단으로 내려온 다음 화장실 앞 연습실 왼쪽 방이예요.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
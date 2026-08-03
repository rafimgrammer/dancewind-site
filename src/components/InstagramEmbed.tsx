// src/components/InstagramEmbed.tsx
import { useEffect } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

export default function InstagramEmbed({ url }: { url: string }) {
  useEffect(() => {
    const scriptId = "instagram-embed-script";

    const process = () => {
      window.instgrm?.Embeds.process();
    };

    if (window.instgrm) {
      process();
      return;
    }

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener("load", process);
    return () => script?.removeEventListener("load", process);
  }, [url]);

  return (
    <blockquote
      className="instagram-media"
      data-instgrm-permalink={url}
      data-instgrm-version="14"
      style={{ margin: "0 auto", maxWidth: "540px", width: "100%", background: "transparent" }}
    />
  );
}
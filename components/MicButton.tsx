"use client";

import { useEffect, useRef, useState } from "react";

// Tap the microphone and talk; words are added to the text box. Works in Chrome, Edge and Safari.
type Rec = { start(): void; stop(): void; onresult: ((e: any) => void) | null; onend: (() => void) | null; continuous: boolean; interimResults: boolean; lang: string };

export function MicButton({ targetId }: { targetId: string }) {
  const [supported, setSupported] = useState(false);
  const [on, setOn] = useState(false);
  const rec = useRef<Rec | null>(null);

  useEffect(() => {
    const W = window as any;
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SR) return;
    const r: Rec = new SR();
    r.continuous = true;
    r.interimResults = false;
    r.lang = "en-US";
    r.onresult = (e: any) => {
      const el = document.getElementById(targetId) as HTMLTextAreaElement | HTMLInputElement | null;
      if (!el) return;
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript;
      el.value = (el.value ? el.value.trimEnd() + " " : "") + text.trim();
    };
    r.onend = () => setOn(false);
    rec.current = r;
    setSupported(true);
  }, [targetId]);

  if (!supported) return null;
  return (
    <button
      type="button"
      title={on ? "Stop listening" : "Talk instead of typing"}
      onClick={() => {
        if (!rec.current) return;
        if (on) rec.current.stop();
        else {
          rec.current.start();
          setOn(true);
        }
      }}
      className={`chip ${on ? "animate-pulse border-red-400 bg-red-50 text-red-700" : "border-stone-300 bg-white text-stone-700 hover:border-gold"}`}
    >
      🎤 {on ? "Listening… tap to stop" : "Talk"}
    </button>
  );
}

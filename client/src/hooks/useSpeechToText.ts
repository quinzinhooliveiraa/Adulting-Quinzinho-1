import { useState, useCallback, useRef } from "react";

let instanceCounter = 0;

export function useSpeechToText(onNewText?: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const instanceIdRef = useRef(0);
  const onNewTextRef = useRef(onNewText);
  onNewTextRef.current = onNewText;

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return false;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    const myId = ++instanceCounter;
    instanceIdRef.current = myId;

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      if (instanceIdRef.current !== myId) return;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          if (text && onNewTextRef.current) {
            onNewTextRef.current(text);
          }
        }
      }
    };
    recognition.onerror = () => {
      if (instanceIdRef.current !== myId) return;
      setIsRecording(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      if (instanceIdRef.current !== myId) return;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          setIsRecording(false);
          recognitionRef.current = null;
        }
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    return true;
  }, []);

  const stopRecording = useCallback(() => {
    instanceIdRef.current = 0;
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    try { recognition?.stop(); } catch {}
    setIsRecording(false);
  }, []);

  const supported = typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return { isRecording, startRecording, stopRecording, supported };
}

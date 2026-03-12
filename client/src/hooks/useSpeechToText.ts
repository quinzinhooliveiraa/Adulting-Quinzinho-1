import { useState, useCallback, useRef } from "react";

export function useSpeechToText(onNewText?: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onNewTextRef = useRef(onNewText);
  onNewTextRef.current = onNewText;

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return false;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
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
      setIsRecording(false);
    };
    recognition.onend = () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          setIsRecording(false);
        }
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    return true;
  }, []);

  const stopRecording = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    recognition?.stop();
    setIsRecording(false);
  }, []);

  const supported = typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  return { isRecording, startRecording, stopRecording, supported };
}

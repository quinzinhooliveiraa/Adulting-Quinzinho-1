import { useCallback } from "react";
import { Mic, Square } from "lucide-react";
import { useSpeechToText } from "@/hooks/useSpeechToText";

interface AudioButtonProps {
  onText: (text: string) => void;
  className?: string;
  size?: number;
}

export default function AudioButton({ onText, className = "", size = 18 }: AudioButtonProps) {
  const handleSpeechText = useCallback((text: string) => {
    onText(text);
  }, [onText]);

  const { isRecording, startRecording, stopRecording, supported } = useSpeechToText(handleSpeechText);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={isRecording ? stopRecording : startRecording}
      className={`flex items-center justify-center transition-colors touch-none ${
        isRecording 
          ? "text-red-500 animate-pulse" 
          : "text-muted-foreground hover:text-foreground"
      } ${className}`}
      title={isRecording ? "Parar gravação" : "Gravar áudio"}
      data-testid="button-audio-input"
    >
      {isRecording ? <Square size={size} /> : <Mic size={size} />}
    </button>
  );
}

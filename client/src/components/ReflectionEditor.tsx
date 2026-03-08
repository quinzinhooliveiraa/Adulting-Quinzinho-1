import { useState } from "react";
import { X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReflectionEditorProps {
  title: string;
  initialText: string;
  origin?: string;
  onClose: () => void;
  onSave: (text: string, imageUrl?: string) => void;
}

export default function ReflectionEditor({ title, initialText, origin, onClose, onSave }: ReflectionEditorProps) {
  const [text, setText] = useState(initialText);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      onSave(text, imageUrl);
      setIsSaving(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-background rounded-3xl max-h-[90vh] overflow-y-auto w-full max-w-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-background flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-serif text-2xl text-foreground">{title}</h2>
            {origin && <p className="text-xs text-muted-foreground mt-1">De: {origin}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Text Editor */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Sua Reflexão</p>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva sua reflexão aqui..."
              className="min-h-64 font-serif text-lg rounded-xl resize-none"
            />
          </div>

          {/* Image Preview */}
          {imageUrl && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Imagem</p>
              <div className="relative rounded-xl overflow-hidden border border-border max-h-64">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Adicionar Imagem (opcional)</p>
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
              <ImagePlus size={20} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Clique para adicionar imagem</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !text.trim()}
              className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-bold"
            >
              {isSaving ? "Salvando..." : "Salvar Reflexão"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

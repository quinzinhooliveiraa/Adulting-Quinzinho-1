import { useState, useRef } from "react";
import { X, ImagePlus, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogReflectionEditorProps {
  initialTitle?: string;
  initialText: string;
  origin?: string;
  showTitleEdit?: boolean;
  onClose: () => void;
  onSave: (title: string, text: string) => void;
}

export default function BlogReflectionEditor({
  initialTitle = "",
  initialText,
  origin,
  showTitleEdit = true,
  onClose,
  onSave,
}: BlogReflectionEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialText);
  const [isSaving, setIsSaving] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && contentRef.current) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement("img");
        img.src = event.target?.result as string;
        img.className = "max-w-full h-auto rounded-xl my-4 shadow-md";
        
        // Insert at cursor position or at end
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(img);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          contentRef.current?.appendChild(img);
        }
        
        // Update state with new content
        if (contentRef.current) {
          setContent(contentRef.current.innerHTML);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    setIsSaving(true);
    setTimeout(() => {
      onSave(title, content);
      setIsSaving(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-in fade-in duration-300">
      <div className="bg-background rounded-t-3xl max-h-[95vh] overflow-y-auto w-full max-w-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-background flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-serif text-xl text-foreground">Sua Reflexão</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Origin Badge */}
        {origin && (
          <div className="px-6 pt-4 pb-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Origem: {origin}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Title Input */}
          {showTitleEdit && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Título</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Dê um título para sua reflexão..."
                className="w-full px-4 py-3 bg-background border border-border rounded-xl font-serif text-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
              />
            </div>
          )}

          {/* Blog Content Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Seu Texto</label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <ImagePlus size={14} />
                Adicionar Imagem
              </button>
            </div>
            
            <div
              ref={contentRef}
              onInput={(e) => {
                const target = e.currentTarget as HTMLDivElement;
                setContent(target.innerHTML);
              }}
              contentEditable
              suppressContentEditableWarning
              className="w-full min-h-96 p-4 bg-white dark:bg-slate-950 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-serif text-base leading-relaxed prose prose-invert max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Tips */}
          <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed">
              💡 <span className="font-medium">Dica:</span> Clique em "Adicionar Imagem" para inserir fotos diretamente no seu texto. Você também pode formatar seu texto como um artigo/blog completo.
            </p>
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
              disabled={isSaving || !title.trim() || !content.trim()}
              className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-bold"
            >
              {isSaving ? "Publicando..." : "Publicar Reflexão"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

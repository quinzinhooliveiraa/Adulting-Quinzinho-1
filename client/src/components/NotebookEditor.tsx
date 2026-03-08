import { useState, useRef } from "react";
import { X, Eye, EyeOff, ImagePlus, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotebookEditorProps {
  initialContent?: string;
  onClose: () => void;
  onSave: (content: string) => void;
}

interface ImageElement {
  id: string;
  src: string;
  width: number;
  height: number;
  x: number;
  y: number;
}

export default function NotebookEditor({ initialContent = "", onClose, onSave }: NotebookEditorProps) {
  const [showText, setShowText] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [images, setImages] = useState<ImageElement[]>([]);
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const notebookRef = useRef<HTMLDivElement>(null);

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBannerUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const newImage: ImageElement = {
            id: `img-${Date.now()}`,
            src: event.target?.result as string,
            width: 200,
            height: (200 * img.height) / img.width,
            x: 20,
            y: 20,
          };
          setImages([...images, newImage]);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const updateImage = (id: string, updates: Partial<ImageElement>) => {
    setImages(images.map(img => img.id === id ? { ...img, ...updates } : img));
  };

  const deleteImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
  };

  const handleSave = () => {
    // Serialize images as JSON in content
    const serialized = JSON.stringify({
      text: content,
      images,
      banner: bannerUrl,
    });
    onSave(serialized);
    onClose();
  };

  if (showText) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-in fade-in duration-300">
        <div className="bg-background rounded-t-3xl max-h-[95vh] overflow-y-auto w-full max-w-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
          <div className="sticky top-0 bg-background flex items-center justify-between p-6 border-b border-border">
            <h2 className="font-serif text-xl">Visualização de Texto</h2>
            <button
              onClick={() => setShowText(false)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <Eye size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1">
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap font-serif text-base leading-relaxed text-foreground">
                {content}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowText(false)}
                variant="outline"
                className="flex-1 rounded-xl"
              >
                Voltar ao Editor
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-bold"
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-in fade-in duration-300">
      <div className="bg-background rounded-t-3xl max-h-[95vh] overflow-hidden w-full max-w-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-background flex items-center justify-between p-6 border-b border-border z-10">
          <h2 className="font-serif text-xl">Caderno de Anotações</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowText(true)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
              title="Ver como texto"
            >
              <Eye size={20} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tools */}
        <div className="flex gap-2 px-6 py-4 border-b border-border overflow-x-auto">
          <button
            onClick={() => bannerInputRef.current?.click()}
            className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors whitespace-nowrap"
          >
            📸 Banner
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors whitespace-nowrap"
          >
            <ImagePlus size={16} className="inline mr-2" />
            Imagem
          </button>
        </div>

        {/* Notebook Canvas */}
        <div className="flex-1 overflow-y-auto bg-notebook-pattern">
          <div
            ref={notebookRef}
            className="relative w-full min-h-full bg-white dark:bg-slate-900 mx-auto max-w-lg p-8 shadow-lg"
            style={{
              backgroundImage: "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)",
              backgroundSize: "100% 28px",
            }}
          >
            {/* Banner */}
            {bannerUrl && (
              <div className="mb-6 rounded-lg overflow-hidden shadow-md border-2 border-dashed border-border">
                <img src={bannerUrl} alt="Banner" className="w-full h-auto" />
                <button
                  onClick={() => setBannerUrl("")}
                  className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded-full text-white"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Editable Text */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva seus pensamentos aqui..."
              className="w-full min-h-96 bg-transparent border-none focus:outline-none font-serif text-base leading-7 resize-none placeholder:text-muted-foreground/50"
              style={{ lineHeight: "28px" }}
            />

            {/* Images with positioning */}
            {images.map((img) => (
              <div
                key={img.id}
                className={`absolute group cursor-move ${selectedImage === img.id ? "ring-2 ring-primary" : ""}`}
                style={{
                  left: `${img.x}px`,
                  top: `${img.y}px`,
                  width: `${img.width}px`,
                  height: `${img.height}px`,
                }}
                draggable
                onDragStart={(e) => {
                  setSelectedImage(img.id);
                  e.dataTransfer.setData("imageId", img.id);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const rect = notebookRef.current?.getBoundingClientRect();
                  if (rect) {
                    const newX = e.clientX - rect.left - img.width / 2;
                    const newY = e.clientY - rect.top - img.height / 2;
                    updateImage(img.id, { x: Math.max(0, newX), y: Math.max(0, newY) });
                  }
                }}
                onClick={() => setSelectedImage(img.id)}
              >
                <img
                  src={img.src}
                  alt="Note"
                  className="w-full h-full object-cover rounded-lg shadow-md border border-border"
                />

                {/* Resize handle */}
                {selectedImage === img.id && (
                  <div
                    className="absolute bottom-0 right-0 w-6 h-6 bg-primary cursor-se-resize rounded-tl"
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startWidth = img.width;
                      const startHeight = img.height;

                      const handleDragMove = (moveEvent: DragEvent) => {
                        const deltaX = moveEvent.clientX - startX;
                        const deltaY = moveEvent.clientY - startY;
                        const aspectRatio = startHeight / startWidth;
                        updateImage(img.id, {
                          width: Math.max(50, startWidth + deltaX),
                          height: Math.max(50, startHeight + deltaY),
                        });
                      };

                      const handleDragEnd = () => {
                        document.removeEventListener("dragover", handleDragMove);
                        document.removeEventListener("drop", handleDragEnd);
                      };

                      document.addEventListener("dragover", handleDragMove);
                      document.addEventListener("drop", handleDragEnd);
                    }}
                  />
                )}

                {/* Delete button */}
                {selectedImage === img.id && (
                  <button
                    onClick={() => deleteImage(img.id)}
                    className="absolute -top-3 -right-3 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-md"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border bg-background flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-bold"
          >
            Guardar Caderno
          </Button>
        </div>

        {/* File inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={handleBannerUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}

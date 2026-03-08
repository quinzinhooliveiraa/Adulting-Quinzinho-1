import { useState, useRef, useEffect } from "react";
import { X, ImagePlus, Hash, PenTool, Palette, Type, ArrowUpToLine, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageElement {
  id: string;
  src: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
}

interface BlogReflectionEditorProps {
  initialTitle?: string;
  initialText: string;
  origin?: string;
  topic?: string;
  showTitleEdit?: boolean;
  onClose: () => void;
  onSave: (title: string, content: string, tags: string[]) => void;
}

export default function BlogReflectionEditor({
  initialTitle = "",
  initialText,
  origin,
  topic = "",
  showTitleEdit = true,
  onClose,
  onSave,
}: BlogReflectionEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialText);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Notebook/Canvas states
  const [images, setImages] = useState<ImageElement[]>([]);
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#000000");
  const [isDrawing, setIsDrawing] = useState(false);
  
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Auto-suggest hashtags from topic
  const suggestedTags = topic
    ? topic.split(" ").map(word => word.toLowerCase()).filter(w => w.length > 3).slice(0, 3)
    : [];

  // Init canvas
  useEffect(() => {
    if (canvasRef.current && contentAreaRef.current) {
      const canvas = canvasRef.current;
      // Match canvas size to the content area
      canvas.width = contentAreaRef.current.offsetWidth * 2;
      canvas.height = Math.max(contentAreaRef.current.offsetHeight * 2, 800); // minimum height
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(2, 2);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = drawingColor;
        ctx.lineWidth = 3;
        ctxRef.current = ctx;
      }
    }
  }, [isDrawingMode, images.length]); // Re-init when layout changes

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = drawingColor;
    }
  }, [drawingColor]);

  // Drawing handlers
  const startDrawing = ({ nativeEvent }: any) => {
    if (!isDrawingMode || !ctxRef.current) return;
    const { offsetX, offsetY } = nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }: any) => {
    if (!isDrawingMode || !isDrawing || !ctxRef.current) return;
    const { offsetX, offsetY } = nativeEvent;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingMode || !ctxRef.current) return;
    ctxRef.current.closePath();
    setIsDrawing(false);
  };

  // Image handlers
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
          const maxZ = images.reduce((max, i) => Math.max(max, i.zIndex || 20), 20);
          const newImage: ImageElement = {
            id: `img-${Date.now()}`,
            src: event.target?.result as string,
            width: 200,
            height: (200 * img.height) / img.width,
            x: 20,
            y: 20,
            rotation: 0,
            zIndex: maxZ + 1,
          };
          setImages([...images, newImage]);
          setIsDrawingMode(false); // Switch out of drawing mode to place image
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

  // Tags and Save
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim() && images.length === 0) return;
    setIsSaving(true);
    
    // Package content with images data if we have them
    const finalContent = (images.length > 0 || bannerUrl)
      ? JSON.stringify({ text: content, images, banner: bannerUrl }) 
      : content;
      
    setTimeout(() => {
      onSave(title || "Reflexão sem título", finalContent, selectedTags);
      setIsSaving(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[#faf9f7] rounded-xl max-h-[95vh] overflow-y-auto w-full max-w-3xl animate-in zoom-in-95 duration-300 flex flex-col shadow-2xl">
        
        {/* Header - matching the screenshot exactly */}
        <div className="sticky top-0 bg-[#faf9f7] z-30 flex items-center justify-between px-8 py-6 border-b border-border/40">
          <h2 className="font-serif text-[28px] text-[#4a4a4a]">Guardar Pensamento</h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-[#4a4a4a]">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* Origin Badge */}
        {origin && (
          <div className="px-8 pt-6 pb-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] font-medium">
              ORIGEM: {origin}
            </p>
          </div>
        )}

        {/* Content Body */}
        <div className="p-8 space-y-8 flex-1">
          {/* Title Input */}
          {showTitleEdit && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#7a7a7a]">Título</label>
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Dê um título para sua reflexão..."
                  className="w-full px-6 py-4 bg-white border border-[#e5e5e5] rounded-2xl font-serif text-2xl text-[#333] focus:outline-none focus:border-[#d1d1d1] focus:ring-4 focus:ring-[#f0f0f0] transition-all shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Text/Canvas Area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#7a7a7a]">Seu Texto</label>
              
              {/* Note Tools */}
              <div className="flex items-center gap-4">
                {isDrawingMode && (
                  <input
                    type="color"
                    value={drawingColor}
                    onChange={(e) => setDrawingColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-none p-0"
                    title="Cor da caneta"
                  />
                )}
                <button
                  onClick={() => setIsDrawingMode(!isDrawingMode)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    isDrawingMode ? "text-primary font-medium" : "text-[#7a7a7a] hover:text-[#333]"
                  }`}
                >
                  {isDrawingMode ? <Type size={16} /> : <PenTool size={16} />}
                  {isDrawingMode ? "Modo Texto" : "Desenhar"}
                </button>
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm text-[#7a7a7a] hover:text-[#333] transition-colors"
                >
                  <ImagePlus size={16} />
                  Banner
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm text-[#7a7a7a] hover:text-[#333] transition-colors"
                >
                  <ImagePlus size={16} />
                  Imagem
                </button>
              </div>
            </div>
            
            <div 
              className="relative w-full min-h-[400px] bg-white border border-[#e5e5e5] rounded-2xl shadow-sm overflow-hidden" 
              ref={contentAreaRef}
            >
              {/* Banner Layer - Background */}
              {bannerUrl && (
                <div className="absolute top-0 left-0 w-full h-48 sm:h-64 z-0 group cursor-pointer" onClick={() => bannerInputRef.current?.click()}>
                  <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-sm font-medium px-4 py-2 bg-black/50 rounded-full">Trocar Banner</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setBannerUrl("");
                    }}
                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all z-10"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              {/* Text Area - Underneath */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPointerDown={() => setSelectedImage(null)}
                placeholder="Escreva seus pensamentos aqui..."
                disabled={isDrawingMode}
                className={`absolute inset-0 w-full h-full p-6 bg-transparent border-none focus:outline-none font-serif text-[17px] leading-relaxed text-[#333] resize-none ${isDrawingMode ? "pointer-events-none opacity-50" : "pointer-events-auto"} ${bannerUrl ? "pt-56 sm:pt-72" : ""}`}
                style={{ zIndex: 15 }}
              />

              {/* Drawing Canvas Layer - On Top */}
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={(e) => {
                  if(isDrawingMode) {
                    const touch = e.touches[0];
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if(rect) {
                       startDrawing({ nativeEvent: { offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top }});
                    }
                  }
                }}
                onTouchMove={(e) => {
                  if(isDrawingMode) {
                    const touch = e.touches[0];
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if(rect) {
                       draw({ nativeEvent: { offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top }});
                    }
                  }
                }}
                onTouchEnd={stopDrawing}
                className={`absolute inset-0 w-full h-full z-10 ${isDrawingMode ? "pointer-events-auto cursor-crosshair" : "pointer-events-none"}`}
              />

              {/* Draggable Images Layer - Highest */}
              {images.map((img) => (
                <div
                  key={img.id}
                  className={`absolute group cursor-move ${selectedImage === img.id ? "ring-2 ring-primary" : ""} ${isDrawingMode ? "pointer-events-none opacity-80" : "pointer-events-auto"}`}
                  style={{
                    left: `${img.x}px`,
                    top: `${img.y}px`,
                    width: `${img.width}px`,
                    height: `${img.height}px`,
                    transform: `rotate(${img.rotation}deg)`,
                    touchAction: 'none',
                    zIndex: img.zIndex,
                  }}
                  onPointerDown={(e) => {
                    if (isDrawingMode) return;
                    e.stopPropagation();
                    setSelectedImage(img.id);
                    
                    // Prevenir scroll e ações padrão do navegador
                    e.currentTarget.setPointerCapture(e.pointerId);
                    
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const initialImageX = img.x;
                    const initialImageY = img.y;

                    const handlePointerMove = (moveEvent: PointerEvent) => {
                      const deltaX = moveEvent.clientX - startX;
                      const deltaY = moveEvent.clientY - startY;
                      
                      updateImage(img.id, { 
                        x: Math.max(0, initialImageX + deltaX), 
                        y: Math.max(0, initialImageY + deltaY) 
                      });
                    };

                    const handlePointerUp = (upEvent: PointerEvent) => {
                      document.removeEventListener("pointermove", handlePointerMove);
                      document.removeEventListener("pointerup", handlePointerUp);
                      const target = upEvent.target as HTMLElement;
                      if (target.releasePointerCapture) {
                        try { target.releasePointerCapture(upEvent.pointerId); } catch(e){}
                      }
                    };

                    document.addEventListener("pointermove", handlePointerMove);
                    document.addEventListener("pointerup", handlePointerUp);
                  }}
                >
                  <img
                    src={img.src}
                    alt="Note attachment"
                    draggable={false} // Prevent browser's native image drag behavior
                    className="w-full h-full object-cover rounded shadow-md border border-border/50 bg-white p-1 pointer-events-none"
                  />

                  {/* Rotate handle */}
                  {selectedImage === img.id && !isDrawingMode && (
                    <div
                      className="absolute -top-6 left-1/2 -translate-x-1/2 w-6 h-6 bg-primary/80 cursor-grab active:cursor-grabbing rounded-full flex items-center justify-center z-30"
                      style={{ touchAction: 'none' }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        
                        const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;

                        const handlePointerMove = (moveEvent: PointerEvent) => {
                          const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
                          const degrees = (angle * 180) / Math.PI + 90; // +90 because handle is at top
                          updateImage(img.id, { rotation: degrees });
                        };

                        const handlePointerUp = (upEvent: PointerEvent) => {
                          document.removeEventListener("pointermove", handlePointerMove);
                          document.removeEventListener("pointerup", handlePointerUp);
                          const target = upEvent.target as HTMLElement;
                          if (target.releasePointerCapture) {
                            try { target.releasePointerCapture(upEvent.pointerId); } catch(e){}
                          }
                        };

                        document.addEventListener("pointermove", handlePointerMove);
                        document.addEventListener("pointerup", handlePointerUp);
                      }}
                    >
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}

                  {/* Resize handle */}
                  {selectedImage === img.id && !isDrawingMode && (
                    <div
                      className="absolute bottom-0 right-0 w-6 h-6 bg-primary/80 cursor-se-resize rounded-tl-full flex items-center justify-center z-30"
                      style={{ touchAction: 'none' }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startWidth = img.width;
                        const startHeight = img.height;

                        const handlePointerMove = (moveEvent: PointerEvent) => {
                          const deltaX = moveEvent.clientX - startX;
                          const deltaY = moveEvent.clientY - startY;
                          updateImage(img.id, {
                            width: Math.max(50, startWidth + deltaX),
                            height: Math.max(50, startHeight + deltaY),
                          });
                        };

                        const handlePointerUp = (upEvent: PointerEvent) => {
                          document.removeEventListener("pointermove", handlePointerMove);
                          document.removeEventListener("pointerup", handlePointerUp);
                          const target = upEvent.target as HTMLElement;
                          if (target.releasePointerCapture) {
                            try { target.releasePointerCapture(upEvent.pointerId); } catch(e){}
                          }
                        };

                        document.addEventListener("pointermove", handlePointerMove);
                        document.addEventListener("pointerup", handlePointerUp);
                      }}
                    />
                  )}

                  {/* Action buttons */}
                  {selectedImage === img.id && !isDrawingMode && (
                    <div 
                      className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex gap-1.5 z-30 bg-white/90 backdrop-blur p-1.5 rounded-full shadow-lg border border-border/50"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          const maxZ = images.reduce((max, i) => Math.max(max, i.zIndex || 20), 20);
                          updateImage(img.id, { zIndex: maxZ + 1 });
                        }}
                        className="p-2 bg-white text-blue-500 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors touch-none"
                        title="Trazer para frente"
                      >
                        <ArrowUpToLine size={16} strokeWidth={2.5} />
                      </button>
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          const minZ = images.reduce((min, i) => Math.min(min, i.zIndex || 30), 30);
                          updateImage(img.id, { zIndex: minZ - 1 });
                        }}
                        className="p-2 bg-white text-orange-500 hover:bg-orange-50 hover:text-orange-600 rounded-full transition-colors touch-none"
                        title="Enviar para trás"
                      >
                        <ArrowDownToLine size={16} strokeWidth={2.5} />
                      </button>
                      <div className="w-[1px] h-6 bg-border/50 my-auto mx-0.5"></div>
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          deleteImage(img.id);
                        }}
                        className="p-2 bg-white text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors touch-none"
                        title="Excluir imagem"
                      >
                        <X size={16} strokeWidth={3} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

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

          {/* Suggested Tags */}
          {(suggestedTags.length > 0 || selectedTags.length > 0) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-[#7a7a7a]" />
                <p className="text-sm font-medium text-[#7a7a7a]">Temas (opcional)</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedTags.includes(tag)
                        ? "bg-[#333] text-white"
                        : "bg-white border border-[#e5e5e5] text-[#555] hover:border-[#ccc]"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-6">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-14 rounded-2xl border-[#e5e5e5] text-[#555] hover:bg-[#f5f5f5] text-base font-medium"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || (!title.trim() && !content.trim() && images.length === 0)}
              className="flex-1 h-14 bg-[#333] hover:bg-black text-white rounded-2xl text-base font-medium shadow-md transition-all active:scale-[0.98]"
            >
              {isSaving ? "Guardando..." : "Guardar Pensamento"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

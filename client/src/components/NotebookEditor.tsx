import { useState, useRef, useEffect } from "react";
import { X, Eye, EyeOff, ImagePlus, Type, PenTool, Palette, ArrowUpToLine, ArrowDownToLine, Maximize, Trash2 } from "lucide-react";
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
  rotation: number;
  zIndex: number;
  fit?: "cover" | "contain";
}

export default function NotebookEditor({ initialContent = "", onClose, onSave }: NotebookEditorProps) {
  const [showText, setShowText] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [images, setImages] = useState<ImageElement[]>([]);
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#000000");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const notebookRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      // Set actual size in memory (scaled to account for extra pixel density)
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      
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
  }, [showText, bannerUrl, images.length]); // Re-init when layout might change

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = drawingColor;
    }
  }, [drawingColor]);

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
        <div className="flex gap-2 px-6 py-4 border-b border-border overflow-x-auto items-center">
          <button
            onClick={() => bannerInputRef.current?.click()}
            className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors whitespace-nowrap"
          >
            📸 Banner
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors whitespace-nowrap flex items-center gap-2"
          >
            <ImagePlus size={16} /> Imagem
          </button>
          <div className="w-px h-6 bg-border mx-2" />
          <button
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              isDrawingMode 
                ? "bg-primary text-primary-foreground shadow-inner" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <PenTool size={16} /> {isDrawingMode ? "Desenhando" : "Desenhar"}
          </button>
          {isDrawingMode && (
            <div className="flex items-center gap-2 px-2">
              <input
                type="color"
                value={drawingColor}
                onChange={(e) => setDrawingColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-none p-0"
                title="Cor da caneta"
              />
            </div>
          )}
        </div>

        {/* Notebook Canvas */}
        <div className="flex-1 overflow-y-auto bg-notebook-pattern">
          <div
            ref={notebookRef}
            className="relative w-full min-h-[800px] bg-white dark:bg-slate-900 mx-auto max-w-lg p-8 shadow-lg overflow-hidden"
            style={{
              backgroundImage: "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)",
              backgroundSize: "100% 28px",
            }}
          >
            {/* Drawing Canvas Layer */}
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
                  // e.preventDefault(); // Prevent scrolling while drawing on mobile
                  const touch = e.touches[0];
                  const rect = canvasRef.current?.getBoundingClientRect();
                  if(rect) {
                     draw({ nativeEvent: { offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top }});
                  }
                }
              }}
              onTouchEnd={stopDrawing}
              className={`absolute inset-0 w-full h-full z-20 ${isDrawingMode ? "pointer-events-auto cursor-crosshair" : "pointer-events-none"}`}
            />
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
            <div 
              className="relative z-15"
              onPointerDown={(e) => {
                if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'TEXTAREA') {
                  // Custom hit detection for images behind text (zIndex < 15)
                  if (notebookRef.current) {
                    const rect = notebookRef.current.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const clickY = e.clientY - rect.top;
                    
                    const bgImages = [...images].filter(img => (img.zIndex || 20) < 15).reverse();
                    for (const img of bgImages) {
                      if (
                        clickX >= img.x && clickX <= img.x + img.width &&
                        clickY >= img.y && clickY <= img.y + img.height
                      ) {
                        e.preventDefault();
                        setSelectedImage(img.id);
                        return;
                      }
                    }
                  }
                  setSelectedImage(null);
                }
              }}
            >
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva seus pensamentos aqui..."
                disabled={isDrawingMode}
                className={`w-full min-h-96 bg-transparent border-none focus:outline-none font-serif text-base leading-7 resize-none placeholder:text-muted-foreground/50 ${isDrawingMode ? "pointer-events-none opacity-50" : "pointer-events-auto"}`}
                style={{ lineHeight: "28px" }}
              />
            </div>

            {/* Images with positioning */}
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
                  alt="Note"
                  draggable={false}
                  className={`w-full h-full ${img.fit === 'contain' ? 'object-contain' : 'object-cover'} rounded-lg shadow-md border border-border pointer-events-none`}
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
                    className="absolute bottom-0 right-0 w-6 h-6 bg-primary cursor-se-resize rounded-tl z-30 flex items-center justify-center"
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
                        if (notebookRef.current) {
                          updateImage(img.id, {
                            x: 0,
                            y: 0,
                            width: notebookRef.current.offsetWidth,
                            height: notebookRef.current.offsetHeight,
                            rotation: 0
                          });
                        }
                      }}
                      className="p-2 bg-white text-green-500 hover:bg-green-50 hover:text-green-600 rounded-full transition-colors touch-none"
                      title="Preencher tela"
                    >
                      <Maximize size={16} strokeWidth={2.5} />
                    </button>
                    <button
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        updateImage(img.id, { zIndex: 10 }); // Back behind text
                      }}
                      className="p-2 bg-white text-orange-500 hover:bg-orange-50 hover:text-orange-600 rounded-full transition-colors touch-none"
                      title="Enviar para trás do texto"
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

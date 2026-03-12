import { useState, useRef, useEffect, useCallback } from "react";
import { X, ImagePlus, Hash, PenTool, Palette, ArrowUpToLine, ArrowDownToLine, Trash2, Lock, Unlock, WrapText, Image as ImageIcon, RefreshCw, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechToText } from "@/hooks/useSpeechToText";

interface ImageElement {
  id: string;
  src: string;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  textWrap: boolean;
  fit?: "cover" | "contain";
}


interface BlogReflectionEditorProps {
  initialTitle?: string;
  initialText: string;
  initialImages?: ImageElement[];
  initialBanner?: string;
  origin?: string;
  topic?: string;
  showTitleEdit?: boolean;
  onClose: () => void;
  onSave: (title: string, content: string, tags: string[]) => void | Promise<void>;
}

export default function BlogReflectionEditor({
  initialTitle = "",
  initialText,
  initialImages,
  initialBanner,
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
  
  const [images, setImages] = useState<ImageElement[]>(initialImages || []);
  const [bannerUrl, setBannerUrl] = useState<string>(initialBanner || "");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#000000");
  const [isDrawing, setIsDrawing] = useState(false);
  const handleSpeechText = useCallback((text: string) => {
    setContent(prev => prev ? prev.trimEnd() + " " + text : text);
  }, []);
  const { isRecording, startRecording, stopRecording, supported: speechSupported } = useSpeechToText(handleSpeechText);
  
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const contentInitialized = useRef(false);
  const touchRef = useRef<{ initialDistance: number; initialRotation: number; initialWidth: number; initialHeight: number; initialAngle: number } | null>(null);

  const hasWrappedImages = images.some(img => img.textWrap);

  const suggestedTags = (() => {
    if (!topic) return [];
    let cleanText = topic;
    try {
      const parsed = JSON.parse(topic);
      if (parsed && parsed.text) cleanText = parsed.text;
    } catch {}
    return cleanText
      .split(/\s+/)
      .map(word => word.toLowerCase().replace(/[^a-záàâãéèêíïóôõúüç]/gi, ""))
      .filter(w => w.length > 3)
      .slice(0, 3);
  })();

  useEffect(() => {
    if (canvasRef.current && contentAreaRef.current) {
      const canvas = canvasRef.current;
      canvas.width = contentAreaRef.current.offsetWidth * 2;
      canvas.height = Math.max(contentAreaRef.current.offsetHeight * 2, 800);
      
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
  }, [isDrawingMode, images.length]);

  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = drawingColor;
    }
  }, [drawingColor]);

  useEffect(() => {
    if (hasWrappedImages) {
      if (editableRef.current) {
        editableRef.current.innerText = content;
        contentInitialized.current = true;
        requestAnimationFrame(() => {
          editableRef.current?.focus();
        });
      }
    } else {
      contentInitialized.current = false;
    }
  }, [hasWrappedImages]);

  useEffect(() => {
    if (!editableRef.current) return;
    const el = editableRef.current;
    el.querySelectorAll('[data-float-img]').forEach(node => node.remove());
    if (!hasWrappedImages) return;
    
    const wrapImages = images.filter(img => img.textWrap);
    wrapImages.sort((a, b) => a.y - b.y);
    wrapImages.forEach(img => {
      const spacer = document.createElement('div');
      spacer.setAttribute('data-float-img', img.id);
      spacer.contentEditable = 'false';
      const containerWidth = el.offsetWidth || 600;
      const side = img.x < containerWidth / 2 ? 'left' : 'right';
      const marginTop = Math.max(0, img.y);
      const marginLeft = side === 'left' ? Math.max(0, img.x) : 16;
      const marginRight = side === 'right' ? Math.max(0, containerWidth - img.x - img.width) : 16;
      spacer.style.cssText = `float: ${side}; width: ${img.width}px; height: ${img.height}px; margin: ${marginTop}px ${marginRight}px 12px ${marginLeft}px; pointer-events: none; opacity: 0;`;
      
      if (el.firstChild) {
        el.insertBefore(spacer, el.firstChild);
      } else {
        el.appendChild(spacer);
      }
    });
  }, [images, selectedImage, hasWrappedImages]);

  const handleContentInput = useCallback(() => {
    if (editableRef.current) {
      const clone = editableRef.current.cloneNode(true) as HTMLDivElement;
      clone.querySelectorAll('[data-float-img]').forEach(el => el.remove());
      setContent(clone.innerText);
    }
  }, []);

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
    if (!file) return;
    setSaveError(null);
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
          naturalWidth: img.width,
          naturalHeight: img.height,
          x: 20,
          y: 20,
          rotation: 0,
          zIndex: maxZ + 1,
          locked: false,
          textWrap: false,
        };
        setImages(prev => [...prev, newImage]);
        setIsDrawingMode(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const updateImage = (id: string, updates: Partial<ImageElement>) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  };

  const deleteImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    if (selectedImage === id) setSelectedImage(null);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim() && !content.trim() && images.length === 0) return;
    setIsSaving(true);
    setSaveError(null);
    
    const finalContent = (images.length > 0 || bannerUrl)
      ? JSON.stringify({ text: content, images, banner: bannerUrl }) 
      : content;

    const contentSizeMB = new Blob([finalContent]).size / (1024 * 1024);
    if (contentSizeMB > 45) {
      setSaveError(`Conteúdo muito grande (${contentSizeMB.toFixed(1)}MB). Remova algumas fotos e tente novamente.`);
      setIsSaving(false);
      return;
    }
      
    try {
      await onSave(title || "Reflexão sem título", finalContent, selectedTags);
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      const msg = err?.message || "";
      if (msg.includes("413") || msg.includes("large")) {
        setSaveError("O conteúdo é muito grande. Tente remover algumas fotos.");
      } else if (msg.includes("500") || msg.includes("network") || msg.includes("Failed")) {
        setSaveError("Erro ao salvar. Verifique sua conexão e tente novamente.");
      } else {
        setSaveError("Não foi possível salvar. Sua reflexão não foi perdida — tente novamente.");
      }
    }
  };

  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchAngle = (touches: React.TouchList) => {
    return Math.atan2(
      touches[1].clientY - touches[0].clientY,
      touches[1].clientX - touches[0].clientX
    ) * (180 / Math.PI);
  };

  const handleTouchStart = (e: React.TouchEvent, img: ImageElement) => {
    if (isDrawingMode || img.locked) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      touchRef.current = {
        initialDistance: getTouchDistance(e.touches),
        initialRotation: img.rotation,
        initialWidth: img.width,
        initialHeight: img.height,
        initialAngle: getTouchAngle(e.touches),
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent, imgId: string) => {
    if (!touchRef.current || e.touches.length !== 2) return;
    e.preventDefault();
    e.stopPropagation();
    
    const currentDistance = getTouchDistance(e.touches);
    const currentAngle = getTouchAngle(e.touches);
    const scale = currentDistance / touchRef.current.initialDistance;
    const angleDelta = currentAngle - touchRef.current.initialAngle;
    
    updateImage(imgId, {
      width: Math.max(50, touchRef.current.initialWidth * scale),
      height: Math.max(50, touchRef.current.initialHeight * scale),
      rotation: touchRef.current.initialRotation + angleDelta,
    });
  };

  const handleTouchEnd = () => {
    touchRef.current = null;
  };

  const freeImages = images.filter(img => !img.textWrap);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-background rounded-xl max-h-[95vh] overflow-y-auto w-full max-w-3xl animate-in zoom-in-95 duration-300 flex flex-col shadow-2xl">
        
        <div className="sticky top-0 bg-background z-30 flex items-center justify-between px-6 sm:px-8 py-4 sm:py-6 border-b border-border/40">
          <h2 className="font-serif text-xl sm:text-[28px] text-foreground">Guardar Pensamento</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        {origin && (
          <div className="px-6 sm:px-8 pt-4 sm:pt-6 pb-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] font-medium">
              ORIGEM: {origin}
            </p>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 flex-1">
          {showTitleEdit && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Título</label>
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Dê um título para sua reflexão..."
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-muted/30 border border-border rounded-2xl font-serif text-xl sm:text-2xl text-foreground focus:outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                />
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Seu Texto</label>
              
              <div className="flex items-center gap-2">
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
                  onClick={() => { setIsDrawingMode(!isDrawingMode); }}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    isDrawingMode ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Desenhar"
                >
                  <PenTool size={16} />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  title="Adicionar imagem"
                >
                  <ImagePlus size={16} />
                </button>
                {speechSupported && (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      isRecording ? "text-red-500 animate-pulse" : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={isRecording ? "Parar gravação" : "Gravar áudio"}
                    data-testid="button-voice-editor"
                  >
                    {isRecording ? <Square size={16} /> : <Mic size={16} />}
                  </button>
                )}
              </div>
            </div>
            
            <div 
              className="relative w-full min-h-[400px] bg-card border border-border rounded-2xl shadow-sm overflow-hidden" 
              ref={contentAreaRef}
            >
              {bannerUrl ? (
                <div className="relative w-full z-0">
                  <img src={bannerUrl} alt="Capa" className="w-full h-48 sm:h-64 object-cover" />
                  <div className="absolute bottom-3 right-3 flex gap-2 z-10">
                    <button 
                      onClick={() => bannerInputRef.current?.click()}
                      className="p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all shadow-lg"
                      title="Trocar capa"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button 
                      onClick={() => setBannerUrl("")}
                      className="p-2 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-all shadow-lg"
                      title="Remover capa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="absolute top-3 left-3 z-10">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white bg-black/40 px-3 py-1 rounded-full">Capa</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-border rounded-t-2xl flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  <ImageIcon size={18} />
                  <span className="text-sm font-medium">Adicionar capa</span>
                </button>
              )}
              
              {hasWrappedImages ? (
                <div 
                  className="relative"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest('[data-float-img]')) {
                      setSelectedImage(null);
                      editableRef.current?.focus();
                    }
                  }}
                >
                  <div
                    ref={editableRef}
                    contentEditable={!isDrawingMode}
                    suppressContentEditableWarning
                    onInput={handleContentInput}
                    className={`w-full p-6 bg-transparent focus:outline-none font-serif text-[17px] leading-relaxed text-foreground ${
                      isDrawingMode ? "pointer-events-none opacity-60" : ""
                    }`}
                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', minHeight: '350px', position: 'relative', zIndex: 20, cursor: 'text' }}
                    data-placeholder="Escreva seus pensamentos aqui..."
                  />
                </div>
              ) : (
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onFocus={() => setSelectedImage(null)}
                    onPointerDown={(e) => e.stopPropagation()}
                    placeholder="Escreva seus pensamentos aqui..."
                    disabled={isDrawingMode}
                    className={`w-full min-h-[350px] p-6 bg-transparent border-none focus:outline-none font-serif text-[17px] leading-relaxed text-foreground resize-none ${
                      isDrawingMode ? "pointer-events-none opacity-50" : "pointer-events-auto relative"
                    }`}
                    style={{ zIndex: 20, position: 'relative' }}
                  />
                </div>
              )}

              {isDrawingMode && (
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if(rect) {
                       startDrawing({ nativeEvent: { offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top }});
                    }
                  }}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if(rect) {
                       draw({ nativeEvent: { offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top }});
                    }
                  }}
                  onTouchEnd={stopDrawing}
                  className="absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair"
                  style={{ zIndex: 50 }}
                />
              )}

              {freeImages.map((img) => (
                <div
                  key={img.id}
                  className={`absolute group ${img.locked ? "cursor-default" : "cursor-move"} ${selectedImage === img.id ? "ring-2 ring-primary" : ""} ${
                    isDrawingMode ? "pointer-events-none opacity-80" : "pointer-events-auto"
                  }`}
                  style={{
                    left: `${img.x}px`,
                    top: `${img.y}px`,
                    width: `${img.width}px`,
                    height: `${img.height}px`,
                    transform: `rotate(${img.rotation}deg)`,
                    touchAction: 'none',
                    zIndex: img.zIndex,
                  }}
                  onTouchStart={(e) => handleTouchStart(e, img)}
                  onTouchMove={(e) => handleTouchMove(e, img.id)}
                  onTouchEnd={handleTouchEnd}
                  onPointerDown={(e) => {
                    if (isDrawingMode) return;
                    e.stopPropagation();
                    setSelectedImage(img.id);
                    
                    if (img.locked) return;
                    
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
                    draggable={false}
                    className={`w-full h-full ${img.fit === 'contain' ? 'object-contain' : 'object-cover'} rounded shadow-md border border-border/50 bg-white p-1 pointer-events-none`}
                  />

                  {img.locked && (
                    <div className="absolute top-1 right-1 p-1 bg-black/50 rounded-full">
                      <Lock size={10} className="text-white" />
                    </div>
                  )}

                  {selectedImage === img.id && !isDrawingMode && !img.locked && (
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
                          const degrees = (angle * 180) / Math.PI + 90;
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

                  {selectedImage === img.id && !isDrawingMode && !img.locked && (
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

                  {selectedImage === img.id && !isDrawingMode && (
                    <div 
                      className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex gap-1 z-30 bg-white/95 dark:bg-background/95 backdrop-blur p-1 rounded-full shadow-lg border border-border/50"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          updateImage(img.id, { locked: !img.locked });
                        }}
                        className={`p-2 rounded-full transition-colors touch-none ${
                          img.locked 
                            ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600" 
                            : "bg-white dark:bg-background text-gray-500 hover:bg-gray-50 dark:hover:bg-muted"
                        }`}
                        title={img.locked ? "Destrancar" : "Trancar"}
                      >
                        {img.locked ? <Lock size={15} strokeWidth={2.5} /> : <Unlock size={15} strokeWidth={2.5} />}
                      </button>
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          updateImage(img.id, { textWrap: true, zIndex: 10 });
                        }}
                        className="p-2 bg-white dark:bg-background text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-600 rounded-full transition-colors touch-none"
                        title="Texto contorna imagem"
                      >
                        <WrapText size={15} strokeWidth={2.5} />
                      </button>
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          const maxZ = images.reduce((max, i) => Math.max(max, i.zIndex || 20), 20);
                          updateImage(img.id, { zIndex: maxZ + 1 });
                        }}
                        className="p-2 bg-white dark:bg-background text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 rounded-full transition-colors touch-none"
                        title="Trazer para frente"
                      >
                        <ArrowUpToLine size={15} strokeWidth={2.5} />
                      </button>
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          updateImage(img.id, { zIndex: 10 });
                        }}
                        className="p-2 bg-white dark:bg-background text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 rounded-full transition-colors touch-none"
                        title="Enviar para trás"
                      >
                        <ArrowDownToLine size={15} strokeWidth={2.5} />
                      </button>
                      <div className="w-[1px] h-6 bg-border/50 my-auto mx-0.5"></div>
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          deleteImage(img.id);
                        }}
                        className="p-2 bg-white dark:bg-background text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 rounded-full transition-colors touch-none"
                        title="Excluir"
                      >
                        <X size={15} strokeWidth={3} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {hasWrappedImages && images.filter(img => img.textWrap).map((img) => (
                <div key={`wrap-${img.id}`}>
                  <div
                    className={`absolute pointer-events-auto ${selectedImage === img.id ? "ring-2 ring-primary ring-offset-2" : ""}`}
                    style={{
                      left: `${img.x}px`,
                      top: `${img.y}px`,
                      width: `${img.width}px`,
                      height: `${img.height}px`,
                      transform: `rotate(${img.rotation}deg)`,
                      zIndex: 15,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setSelectedImage(img.id);
                    }}
                  >
                    <img src={img.src} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {img.locked && (
                      <div style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: 4, display: 'flex' }}>
                        <Lock size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                  {selectedImage === img.id && !isDrawingMode && (
                    <div 
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-30 bg-white/95 dark:bg-background/95 backdrop-blur p-1 rounded-full shadow-lg border border-border/50"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          updateImage(img.id, { locked: !img.locked });
                        }}
                        className={`p-2 rounded-full transition-colors touch-none ${
                          img.locked 
                            ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600" 
                            : "bg-white dark:bg-background text-gray-500 hover:bg-gray-50 dark:hover:bg-muted"
                        }`}
                        title={img.locked ? "Destrancar" : "Trancar"}
                      >
                        {img.locked ? <Lock size={15} strokeWidth={2.5} /> : <Unlock size={15} strokeWidth={2.5} />}
                      </button>
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          updateImage(img.id, { textWrap: false, zIndex: 20 });
                        }}
                        className="p-2 bg-teal-50 dark:bg-teal-900/30 text-teal-600 rounded-full transition-colors touch-none"
                        title="Modo livre (desativar contorno)"
                      >
                        <WrapText size={15} strokeWidth={2.5} />
                      </button>
                      <div className="w-[1px] h-6 bg-border/50 my-auto mx-0.5"></div>
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          deleteImage(img.id);
                        }}
                        className="p-2 bg-white dark:bg-background text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 rounded-full transition-colors touch-none"
                        title="Excluir"
                      >
                        <X size={15} strokeWidth={3} />
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

          {(suggestedTags.length > 0 || selectedTags.length > 0) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Temas (opcional)</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedTags.includes(tag)
                        ? "bg-foreground text-background"
                        : "bg-muted border border-border text-muted-foreground hover:border-foreground/30"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {saveError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
              {saveError}
            </div>
          )}

          {images.length > 0 && (
            <p className="text-xs text-muted-foreground text-right">
              {images.length} {images.length === 1 ? "foto" : "fotos"}
            </p>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-12 sm:h-14 rounded-2xl border-border text-muted-foreground hover:bg-muted text-base font-medium"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || (!title.trim() && !content.trim() && images.length === 0)}
              className="flex-1 h-12 sm:h-14 bg-foreground hover:bg-foreground/90 text-background rounded-2xl text-base font-medium shadow-md transition-all active:scale-[0.98]"
            >
              {isSaving ? "Guardando..." : "Guardar Pensamento"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

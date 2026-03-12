import { useState, useRef, useEffect, useCallback } from "react";
import { X, ImagePlus, Hash, PenTool, Palette, ArrowUpToLine, ArrowDownToLine, Trash2, Lock, Unlock, WrapText, Image as ImageIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  
  const [images, setImages] = useState<ImageElement[]>([]);
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#000000");
  const [isDrawing, setIsDrawing] = useState(false);
  
  
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const contentInitialized = useRef(false);

  const hasWrappedImages = images.some(img => img.textWrap);

  const suggestedTags = topic
    ? topic.split(" ").map(word => word.toLowerCase()).filter(w => w.length > 3).slice(0, 3)
    : [];

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
    if (editableRef.current && !contentInitialized.current && hasWrappedImages) {
      editableRef.current.innerText = content;
      contentInitialized.current = true;
      requestAnimationFrame(() => {
        editableRef.current?.focus();
      });
    }
  }, [hasWrappedImages]);

  useEffect(() => {
    if (!editableRef.current || !hasWrappedImages) return;
    const el = editableRef.current;
    
    el.querySelectorAll('[data-float-img]').forEach(node => node.remove());
    
    const wrapImages = images.filter(img => img.textWrap);
    wrapImages.forEach(img => {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-float-img', img.id);
      wrapper.contentEditable = 'false';
      const side = img.x < 150 ? 'left' : 'right';
      const marginSide = side === 'left' ? 'margin: 0 16px 12px 0' : 'margin: 0 0 12px 16px';
      wrapper.style.cssText = `float: ${side}; width: ${img.width}px; ${marginSide}; border-radius: 12px; overflow: hidden; user-select: none; position: relative;`;
      
      if (selectedImage === img.id) {
        wrapper.style.outline = '2px solid hsl(var(--primary))';
        wrapper.style.outlineOffset = '2px';
      }
      
      const imgEl = document.createElement('img');
      imgEl.src = img.src;
      imgEl.draggable = false;
      imgEl.style.cssText = 'width: 100%; display: block; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';
      wrapper.appendChild(imgEl);

      if (img.locked) {
        const lockBadge = document.createElement('div');
        lockBadge.style.cssText = 'position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5); border-radius: 50%; padding: 4px; display: flex;';
        lockBadge.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
        wrapper.appendChild(lockBadge);
      }

      wrapper.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        setSelectedImage(img.id);
      });
      
      el.insertBefore(wrapper, el.firstChild);
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
    }
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

  const handleSave = () => {
    if (!title.trim() && !content.trim() && images.length === 0) return;
    setIsSaving(true);
    
    const finalContent = (images.length > 0 || bannerUrl)
      ? JSON.stringify({ text: content, images, banner: bannerUrl }) 
      : content;
      
    setTimeout(() => {
      onSave(title || "Reflexão sem título", finalContent, selectedTags);
      setIsSaving(false);
      onClose();
    }, 800);
  };

  const freeImages = images.filter(img => !img.textWrap);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[#faf9f7] rounded-xl max-h-[95vh] overflow-y-auto w-full max-w-3xl animate-in zoom-in-95 duration-300 flex flex-col shadow-2xl">
        
        <div className="sticky top-0 bg-[#faf9f7] z-30 flex items-center justify-between px-8 py-6 border-b border-border/40">
          <h2 className="font-serif text-[28px] text-[#4a4a4a]">Guardar Pensamento</h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-[#4a4a4a]">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        {origin && (
          <div className="px-8 pt-6 pb-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] font-medium">
              ORIGEM: {origin}
            </p>
          </div>
        )}

        <div className="p-8 space-y-8 flex-1">
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#7a7a7a]">Seu Texto</label>
              
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
                    isDrawingMode ? "text-primary font-medium" : "text-[#7a7a7a] hover:text-[#333]"
                  }`}
                  title="Desenhar"
                >
                  <PenTool size={16} />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm text-[#7a7a7a] hover:text-[#333] transition-colors"
                  title="Adicionar imagem"
                >
                  <ImagePlus size={16} />
                </button>
              </div>
            </div>
            
            <div 
              className="relative w-full min-h-[400px] bg-white border border-[#e5e5e5] rounded-2xl shadow-sm overflow-hidden" 
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
                  className="w-full h-24 border-2 border-dashed border-[#e0e0e0] rounded-t-2xl flex items-center justify-center gap-2 text-[#aaa] hover:text-[#777] hover:border-[#ccc] transition-colors"
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
                    className={`w-full p-6 bg-transparent focus:outline-none font-serif text-[17px] leading-relaxed text-[#333] dark:text-foreground ${
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
                    className={`w-full min-h-[350px] p-6 bg-transparent border-none focus:outline-none font-serif text-[17px] leading-relaxed text-[#333] dark:text-foreground resize-none ${
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
                      className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex gap-1 z-30 bg-white/95 backdrop-blur p-1 rounded-full shadow-lg border border-border/50"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          updateImage(img.id, { locked: !img.locked });
                        }}
                        className={`p-2 rounded-full transition-colors touch-none ${
                          img.locked 
                            ? "bg-amber-50 text-amber-600" 
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                        title={img.locked ? "Destrancar" : "Trancar"}
                      >
                        {img.locked ? <Lock size={15} strokeWidth={2.5} /> : <Unlock size={15} strokeWidth={2.5} />}
                      </button>
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          updateImage(img.id, { textWrap: true, zIndex: 10, rotation: 0 });
                        }}
                        className="p-2 bg-white text-teal-500 hover:bg-teal-50 hover:text-teal-600 rounded-full transition-colors touch-none"
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
                        className="p-2 bg-white text-blue-500 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors touch-none"
                        title="Trazer para frente"
                      >
                        <ArrowUpToLine size={15} strokeWidth={2.5} />
                      </button>
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          updateImage(img.id, { zIndex: 10 });
                        }}
                        className="p-2 bg-white text-orange-500 hover:bg-orange-50 hover:text-orange-600 rounded-full transition-colors touch-none"
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
                        className="p-2 bg-white text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors touch-none"
                        title="Excluir"
                      >
                        <X size={15} strokeWidth={3} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {images.filter(img => img.textWrap).map((img) => (
                !hasWrappedImages ? null : (
                  selectedImage === img.id && !isDrawingMode && (
                    <div 
                      key={`toolbar-${img.id}`}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-30 bg-white/95 backdrop-blur p-1 rounded-full shadow-lg border border-border/50"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          updateImage(img.id, { locked: !img.locked });
                        }}
                        className={`p-2 rounded-full transition-colors touch-none ${
                          img.locked 
                            ? "bg-amber-50 text-amber-600" 
                            : "bg-white text-gray-500 hover:bg-gray-50"
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
                        className="p-2 bg-teal-50 text-teal-600 rounded-full transition-colors touch-none"
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
                        className="p-2 bg-white text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors touch-none"
                        title="Excluir"
                      >
                        <X size={15} strokeWidth={3} />
                      </button>
                    </div>
                  )
                )
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

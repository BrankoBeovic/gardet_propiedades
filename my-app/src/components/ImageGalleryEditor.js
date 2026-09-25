import React, { useEffect, useState } from 'react';
import { Upload, X, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { validateImageFile } from '../lib/imageUpload';

/**
 * Controlled image picker: upload, reorder (drag or arrows), mark cover, remove, preview.
 * `images` items are either saved rows ({ url, es_portada, orden }) or new files
 * ({ clientId, url: dataUrl, file, isNew: true, es_portada }).
 */
const ImageGalleryEditor = ({ images, onChange, onError, label }) => {
    const [lightboxUrl, setLightboxUrl] = useState(null);
    const [dragIndex, setDragIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    useEffect(() => {
        if (!lightboxUrl) return undefined;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setLightboxUrl(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [lightboxUrl]);

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';

        const rejected = [];

        files.forEach(file => {
            const result = validateImageFile(file);
            if (!result.ok) {
                rejected.push(`${file.name}: ${result.error}`);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                onChange(prev => [...prev, {
                    clientId: uuidv4(),
                    url: reader.result,
                    file,
                    mimeExt: result.ext,
                    isNew: true,
                    es_portada: prev.length === 0
                }]);
            };
            reader.readAsDataURL(file);
        });

        if (rejected.length > 0) {
            onError?.(rejected.join(' · '));
        }
    };

    const handleRemoveImage = (index) => {
        onChange(prev => {
            const removed = prev[index];
            const next = prev.filter((_, i) => i !== index);
            if (removed?.es_portada && next.length > 0 && !next.some(img => img.es_portada)) {
                return next.map((img, i) => (i === 0 ? { ...img, es_portada: true } : img));
            }
            return next;
        });
    };

    const handleSetCover = (index) => {
        onChange(prev => prev.map((img, i) => ({
            ...img,
            es_portada: i === index
        })));
    };

    /** Reorders images immutably by moving fromIndex → toIndex. */
    const handleReorderImage = (fromIndex, toIndex) => {
        if (fromIndex === toIndex || fromIndex == null || toIndex == null) return;
        onChange(prev => {
            if (fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) {
                return prev;
            }
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    };

    /** Moves an image one step up or down in the list. */
    const handleMoveImage = (index, direction) => {
        const toIndex = direction === 'up' ? index - 1 : index + 1;
        handleReorderImage(index, toIndex);
    };

    return (
        <>
            <div>
                <label className="block text-sm font-jakarta font-medium text-[#2C2C2C] mb-1.5">
                    {label || 'Imágenes (JPEG, PNG o WebP · máx. 5 MB)'}
                </label>
                <p className="mb-2 text-xs text-[#4A4A4A]/70 font-jakarta">
                    Arrastrá las fotos o usá las flechas para definir el orden. La primera no es la portada salvo que la marques.
                </p>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border border-dashed border-[#2C2C2C]/20 rounded-lg hover:border-gold/50 bg-white/50 transition-colors cursor-pointer">
                    <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-10 w-10 text-[#A1917B]/50" />
                        <div className="flex text-sm text-[#4A4A4A] font-jakarta">
                            <label className="relative cursor-pointer font-medium text-[#A1917B] hover:text-[#7E6649] transition-colors">
                                <span>Subir imágenes</span>
                                <input
                                    type="file"
                                    className="sr-only"
                                    multiple
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImageSelect}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((image, index) => {
                            const imageKey = image.id ?? image.clientId ?? `img-${index}`;
                            const isDragging = dragIndex === index;
                            const isDragOver = dragOverIndex === index && dragIndex !== index;

                            return (
                                <div
                                    key={imageKey}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (dragOverIndex !== index) setDragOverIndex(index);
                                    }}
                                    onDragLeave={() => {
                                        if (dragOverIndex === index) setDragOverIndex(null);
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        handleReorderImage(dragIndex, index);
                                        setDragIndex(null);
                                        setDragOverIndex(null);
                                    }}
                                    className={`relative group rounded-lg overflow-hidden border bg-white transition-opacity ${
                                        isDragging
                                            ? 'opacity-50 border-gold'
                                            : isDragOver
                                                ? 'border-gold ring-2 ring-gold/40'
                                                : 'border-[#2C2C2C]/10'
                                    }`}
                                >
                                    <span
                                        className="absolute top-1.5 left-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded bg-[#2C2C2C]/80 px-1.5 text-[11px] font-jakarta font-semibold text-white"
                                        aria-hidden="true"
                                    >
                                        {index + 1}
                                    </span>

                                    <div
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.effectAllowed = 'move';
                                            e.dataTransfer.setData('text/plain', String(index));
                                            setDragIndex(index);
                                        }}
                                        onDragEnd={() => {
                                            setDragIndex(null);
                                            setDragOverIndex(null);
                                        }}
                                        className="absolute top-1.5 left-1/2 z-10 -translate-x-1/2 cursor-grab active:cursor-grabbing rounded bg-[#2C2C2C]/70 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity touch-none"
                                        aria-label={`Arrastrar imagen ${index + 1}`}
                                        title="Arrastrar para reordenar"
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <GripVertical className="h-3.5 w-3.5" />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setLightboxUrl(image.url)}
                                        className="block w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                                        aria-label={`Ver imagen ${index + 1} en grande`}
                                    >
                                        <img
                                            src={image.url}
                                            alt={`Preview ${index + 1}`}
                                            className="h-28 w-full object-cover"
                                            draggable={false}
                                        />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveImage(index);
                                        }}
                                        className="absolute top-1.5 right-1.5 bg-red-500/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        aria-label="Eliminar imagen"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>

                                    <div className="absolute top-1.5 right-9 z-10 flex flex-col gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMoveImage(index, 'up');
                                            }}
                                            disabled={index === 0}
                                            className="rounded bg-[#2C2C2C]/70 p-0.5 text-white hover:bg-gold/90 disabled:opacity-30 disabled:pointer-events-none"
                                            aria-label={`Subir imagen ${index + 1}`}
                                            title="Subir"
                                        >
                                            <ChevronUp className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMoveImage(index, 'down');
                                            }}
                                            disabled={index === images.length - 1}
                                            className="rounded bg-[#2C2C2C]/70 p-0.5 text-white hover:bg-gold/90 disabled:opacity-30 disabled:pointer-events-none"
                                            aria-label={`Bajar imagen ${index + 1}`}
                                            title="Bajar"
                                        >
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSetCover(index);
                                        }}
                                        className={`absolute bottom-1.5 left-1.5 px-2 py-0.5 text-xs font-jakarta rounded z-10 ${image.es_portada
                                            ? 'bg-gold text-obsidian font-semibold'
                                            : 'bg-[#2C2C2C]/70 text-white hover:bg-gold/80'
                                            } transition-colors`}
                                    >
                                        {image.es_portada ? 'Portada' : 'Marcar portada'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 sm:p-8"
                    onClick={() => setLightboxUrl(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Vista ampliada de imagen"
                >
                    <button
                        type="button"
                        onClick={() => setLightboxUrl(null)}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/80 hover:text-white p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <img
                        src={lightboxUrl}
                        alt="Vista ampliada"
                        className="max-h-full max-w-full object-contain rounded-sm shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
};

export default ImageGalleryEditor;

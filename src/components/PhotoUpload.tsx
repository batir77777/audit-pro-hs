import React from 'react';
import { Camera, X, Plus, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PhotoAttachment } from '@/types';

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.78;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(e.target!.result as string); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface PhotoUploadProps {
  photos: PhotoAttachment[];
  onPhotosChange: (photos: PhotoAttachment[]) => void;
  label?: string;
}

export default function PhotoUpload({ photos, onPhotosChange, label = 'Photos' }: PhotoUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = React.useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setProcessing(true);
    console.log('[PhotoUpload] Starting image processing for', files.length, 'file(s)');

    // Safety timeout — never leave processing=true for longer than 30s
    const safetyTimer = setTimeout(() => {
      console.warn('[PhotoUpload] Processing timeout — resetting state');
      setProcessing(false);
    }, 30_000);

    const newPhotos: PhotoAttachment[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const dataUrl = await compressImage(file);
        newPhotos.push({
          id: crypto.randomUUID(),
          dataUrl,
          caption: '',
          takenAt: new Date().toISOString(),
        });
        console.log('[PhotoUpload] Compressed:', file.name);
      } catch (err) {
        console.error('[PhotoUpload] Failed to process file:', file.name, err);
        // skip unreadable file and continue
      }
    }

    clearTimeout(safetyTimer);
    onPhotosChange([...photos, ...newPhotos]);
    setProcessing(false);
    console.log('[PhotoUpload] Processing complete,', newPhotos.length, 'photo(s) added');
    // Reset input so the same file can be added again
    if (inputRef.current) inputRef.current.value = '';
  };

  const updateCaption = (id: string, caption: string) => {
    onPhotosChange(photos.map(p => p.id === id ? { ...p, caption } : p));
  };

  const remove = (id: string) => {
    onPhotosChange(photos.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-sitk-yellow" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">{label}</h3>
          {photos.length > 0 && (
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {photos.length}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={processing}
          className="h-8 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest border-2 border-dashed border-slate-200 hover:border-sitk-yellow hover:bg-sitk-yellow/5 transition-all export-hide"
        >
          <Camera className="w-3.5 h-3.5 mr-1.5" />
          {processing ? 'Processing…' : 'Add Photo'}
        </Button>
        {/* accept="image/*" triggers camera/gallery picker on mobile */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Photo grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map(photo => (
            <div key={photo.id} className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
              <img
                src={photo.dataUrl}
                alt={photo.caption || 'Photo attachment'}
                className="w-full aspect-[4/3] object-cover"
              />
              {/* Delete button — hidden in PDF via export-hide */}
              <button
                type="button"
                onClick={() => remove(photo.id)}
                aria-label="Remove photo"
                className="export-hide absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
              >
                <X className="w-3 h-3" />
              </button>
              {/* Caption */}
              <div className="p-2 bg-white">
                <input
                  type="text"
                  value={photo.caption}
                  onChange={e => updateCaption(photo.id, e.target.value)}
                  placeholder="Caption…"
                  className="w-full text-[10px] font-medium text-slate-600 bg-transparent border-none outline-none placeholder:text-slate-300 px-0"
                />
              </div>
            </div>
          ))}
          {/* Add more tile */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="export-hide aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-300 hover:text-sitk-yellow hover:border-sitk-yellow hover:bg-sitk-yellow/5 transition-all"
          >
            <Plus className="w-6 h-6" />
            <span className="text-[9px] font-black uppercase tracking-widest">Add</span>
          </button>
        </div>
      ) : (
        /* Empty state — hidden from PDF since there's nothing to show */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "export-hide w-full py-10 rounded-2xl border-2 border-dashed border-slate-200",
            "flex flex-col items-center justify-center gap-3",
            "text-slate-300 hover:text-sitk-yellow hover:border-sitk-yellow hover:bg-sitk-yellow/5 transition-all"
          )}
        >
          <Camera className="w-8 h-8" />
          <div className="space-y-0.5 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest">Upload Photos</p>
            <p className="text-[9px] font-medium text-slate-300">
              Camera, gallery, or computer — tap or click
            </p>
          </div>
        </button>
      )}
    </div>
  );
}

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUploadCloud, FiX, FiStar, FiImage } from 'react-icons/fi'

interface UploadZoneProps {
  images: string[]
  onChange: (images: string[]) => void
  max?: number
  label?: string
}

export default function UploadZone({ images, onChange, max = 10, label = 'Product Images' }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((files: FileList) => {
    const remaining = max - images.length
    if (remaining <= 0) return
    const toAdd = Math.min(files.length, remaining)
    for (let i = 0; i < toAdd; i++) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          onChange([...images, e.target.result as string])
        }
      }
      reader.readAsDataURL(files[i])
    }
  }, [images, max, onChange])

  const addImage = () => {
    if (images.length >= max) return
    inputRef.current?.click()
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
    e.target.value = ''
  }

  const removeImage = (i: number) => onChange(images.filter((_, idx) => idx !== i))
  const setMain = (i: number) => {
    const next = [...images]
    const [item] = next.splice(i, 1)
    next.unshift(item)
    onChange(next)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <label className="text-xs font-semibold text-text-secondary">{label} ({images.length}/{max})</label>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files) }}
        className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer ${
          dragOver ? 'border-primary bg-primary/10' : 'border-primary/20 hover:border-primary/30 bg-surface-lighter'
        }`}
        onClick={addImage}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
        <motion.div animate={{ y: dragOver ? -4 : 0 }} className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FiUploadCloud size={22} className="text-primary" />
          </div>
          <p className="text-sm font-semibold text-text-secondary">Drop images here or click to browse</p>
          <p className="text-xs text-text-muted">PNG, JPG, WebP up to 5MB each</p>
        </motion.div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-3">
          <AnimatePresence>
            {images.map((img, i) => (
              <motion.div key={`${img}-${i}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="relative group aspect-square rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden"
              >
                {img.startsWith('data:') || img.startsWith('blob:') || img.startsWith('http') ? (
                  <img src={img} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">{img}</span>
                )}
                {i === 0 && (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-warning text-white text-[8px] font-bold">Main</div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  {i !== 0 && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setMain(i) }}
                      className="w-6 h-6 rounded-lg bg-white/90 flex items-center justify-center hover:bg-white cursor-pointer"
                      title="Set as main"
                    ><FiStar size={10} className="text-warning" /></button>
                  )}
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(i) }}
                    className="w-6 h-6 rounded-lg bg-white/90 flex items-center justify-center hover:bg-white cursor-pointer"
                    title="Remove"
                  ><FiX size={10} className="text-danger" /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {images.length < max && (
            <button type="button" onClick={addImage}
              className="aspect-square rounded-xl border-2 border-dashed border-primary/20 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
            ><FiImage size={20} /></button>
          )}
        </div>
      )}
    </div>
  )
}

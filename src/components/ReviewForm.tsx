import { useState, useRef } from 'react'
import { FiStar, FiCheck, FiAlertTriangle, FiImage, FiX } from 'react-icons/fi'
import { reviewService } from '../services/reviewService'

const MAX_IMAGES = 10

interface ReviewFormProps {
  productId: number
  orderId: string
  onSubmitted: () => void
}

export default function ReviewForm({ productId, orderId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    const remaining = MAX_IMAGES - files.length
    if (selected.length > remaining) {
      setError(`Maximum ${MAX_IMAGES} images allowed`)
    }
    const toAdd = selected.slice(0, remaining)
    setFiles((prev) => [...prev, ...toAdd])
    setPreviews((prev) => [
      ...prev,
      ...toAdd.map((f) => URL.createObjectURL(f)),
    ])
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(previews[idx])
    setFiles((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }
    if (!comment.trim()) {
      setError('Please write a review comment')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await reviewService.create(productId, rating, comment.trim(), orderId, files)
      setSubmitted(true)
      onSubmitted()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <FiCheck size={28} className="text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Review Submitted!</h3>
        <p className="text-sm text-gray-500">Thank you for your feedback.</p>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-2xl p-6 bg-white">
      <h3 className="text-base font-bold text-gray-900 mb-4">Write a Review</h3>

      {/* Star Rating */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => { setRating(star); setError('') }}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <FiStar
                size={28}
                fill={(hoveredStar || rating) >= star ? '#F59E0B' : 'none'}
                className={(hoveredStar || rating) >= star ? 'text-amber-400' : 'text-gray-300'}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </p>
        )}
      </div>

      {/* Comment */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Review</p>
        <textarea
          value={comment}
          onChange={(e) => { setComment(e.target.value); setError('') }}
          placeholder="Tell others about your experience with this product..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CB202D] focus:border-transparent resize-none transition"
        />
      </div>

      {/* Image Upload */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Photos
          <span className="font-normal normal-case text-gray-400 ml-1">(optional, max {MAX_IMAGES})</span>
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {previews.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {previews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <FiX size={12} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {files.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-sm font-medium text-[#CB202D] hover:text-[#A81D2A] transition"
          >
            <FiImage size={16} />
            {previews.length > 0 ? 'Add more photos' : 'Add photos'}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mb-3 text-red-500 text-xs font-medium">
          <FiAlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #CB202D, #A81D2A)' }}
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  )
}

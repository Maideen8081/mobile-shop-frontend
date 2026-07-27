import { useState } from 'react'
import { FiStar, FiCheck, FiAlertTriangle } from 'react-icons/fi'
import { reviewService } from '../services/reviewService'

interface ReviewFormProps {
  productId: number
  orderId: string
  onSubmitted: () => void
}

export default function ReviewForm({ productId, orderId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = () => {
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
    setTimeout(() => {
      reviewService.create(productId, rating, comment.trim(), orderId)
      setSubmitting(false)
      setSubmitted(true)
      onSubmitted()
    }, 500)
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

import { motion } from 'framer-motion'
import { FiStar, FiThumbsUp } from 'react-icons/fi'
import GlassCard from './GlassCard'
import { feedbackData } from '../../data/dashboardData'

export default function CustomerFeedback() {
  const avgRating = feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length
  const positive = feedbackData.filter((f) => f.sentiment === 'positive').length

  return (
    <GlassCard padding={false} className="p-5 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary tracking-tight">Customer Feedback</h3>
          <p className="text-xs text-text-muted mt-0.5">Latest reviews & ratings</p>
        </div>
        <button className="text-xs font-medium text-primary hover:text-primary-hover transition-colors cursor-pointer">All →</button>
      </div>

      <div className="flex items-center gap-4 mb-5 p-3.5 rounded-lg bg-warning/5 border border-warning/10">
        <div className="text-center">
          <p className="text-2xl font-bold text-text-primary">{avgRating.toFixed(1)}</p>
          <div className="flex gap-0.5 mt-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <FiStar key={star} size={11} className={star <= Math.round(avgRating) ? 'text-warning' : 'text-text-label'} />
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-text-muted">Satisfaction</span>
            <span className="font-semibold text-text-primary">{positive}/{feedbackData.length}</span>
          </div>
          <div className="h-2 rounded-full bg-warning/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(positive / feedbackData.length) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-warning"
            />
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <FiThumbsUp size={10} className="text-success" />
            <span className="text-[10px] text-success font-semibold">{(positive / feedbackData.length * 100).toFixed(0)}% Positive</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {feedbackData.slice(0, 3).map((feedback, i) => (
          <motion.div
            key={feedback.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08, ease: 'easeOut' }}
            className="p-3.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {feedback.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary">{feedback.name}</p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar key={star} size={10} className={star <= feedback.rating ? 'text-warning' : 'text-text-label'} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{feedback.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-text-muted">{feedback.product}</span>
                  <span className="w-1 h-1 rounded-full bg-text-label" />
                  <span className="text-[10px] text-text-muted">{feedback.time}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}

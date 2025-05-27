"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"

interface CreateReviewFormProps {
  onSubmit?: (data: { title: string; score: number; description: string }) => Promise<void>
  isSubmitting?: boolean
}

const TITLE_MAX_LENGTH = 120
const DESCRIPTION_MAX_LENGTH = 1000

export function CreateReviewForm({ onSubmit, isSubmitting = false }: CreateReviewFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [score, setScore] = useState(0)
  const [hasError, setHasError] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim() || !description.trim() || score < 1 || score > 5) {
      setHasError(true)
      return
    }
    setHasError(false)
    if (onSubmit) {
      await onSubmit({ title: title.trim(), score, description: description.trim() })
      setTitle("")
      setDescription("")
      setScore(0)
    }
  }

  return (
    <Card className="max-w-lg w-full mx-auto p-6 bg-muted/50 rounded-lg flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Share your experience</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1 max-h-[60vh] overflow-auto">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="review-title">Title</Label>
          <p className="text-xs text-muted-foreground">{title.length}/{TITLE_MAX_LENGTH} characters. Summarize your review.</p>
          <Input
            id="review-title"
            placeholder="Summarize your review"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={TITLE_MAX_LENGTH}
            disabled={isSubmitting}
            required
          />
        </div>
        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="review-description">Description</Label>
          <p className="text-xs text-muted-foreground">{description.length}/{DESCRIPTION_MAX_LENGTH} characters. Describe your experience in detail.</p>
          <Textarea
            id="review-description"
            placeholder="Describe your experience"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={DESCRIPTION_MAX_LENGTH}
            rows={6}
            className="h-32 resize-none overflow-auto"
            disabled={isSubmitting}
            required
          />
        </div>
        {/* Score */}
        <div className="space-y-2">
          <Label>Score</Label>
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                type="button"
                key={i}
                aria-label={`Rate ${i + 1} star${i === 0 ? '' : 's'}`}
                onClick={() => setScore(i + 1)}
                disabled={isSubmitting}
                className="focus:outline-none"
              >
                <Star
                  className={`h-6 w-6 transition-colors ${i < score ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">{score > 0 ? `${score}/5` : "No rating"}</span>
          </div>
        </div>
        {hasError && (
          <div className="text-sm text-destructive">Please provide a title, description, and select a score.</div>
        )}
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !title.trim() ||
            !description.trim() ||
            score < 1 ||
            title.length > TITLE_MAX_LENGTH ||
            description.length > DESCRIPTION_MAX_LENGTH
          }
        >
          {isSubmitting ? "Submitting..." : "Post Review"}
        </Button>
      </form>
    </Card>
  )
}

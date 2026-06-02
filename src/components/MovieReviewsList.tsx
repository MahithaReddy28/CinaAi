/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Review, UserProfile, SentimentAnalysis, Movie } from '../types';
import { addMovieReview, deleteReview } from '../lib/db';
import { Sparkles, Star, Trash2, ShieldAlert, HeartHandshake, Smile, RefreshCw, MessageCircle } from 'lucide-react';

interface Props {
  movie: Movie;
  reviews: Review[];
  user: UserProfile | null;
  onReviewAdded: () => void;
}

export default function MovieReviewsList({ movie, reviews, user, onReviewAdded }: Props) {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  
  // Real-time AI Sentiment state
  const [typedSentiment, setTypedSentiment] = useState<SentimentAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Debounced real-time sentiment analysis as the user types
  useEffect(() => {
    if (!reviewText.trim() || reviewText.length < 15) {
      setTypedSentiment(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setAnalyzing(true);
      setAnalysisError('');
      try {
        const res = await fetch('/api/movie/analyze-sentiment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewText })
        });
        const data = await res.json();
        if (data.success && data.analysis) {
          setTypedSentiment(data.analysis);
        } else {
          setAnalysisError(data.error || 'Failed to capture AI sentiment.');
        }
      } catch (err: any) {
        console.error("Sentiment analysis error:", err);
        setAnalysisError('Network failure during AI analysis.');
      } finally {
        setAnalyzing(false);
      }
    }, 1200);

    return () => clearTimeout(delayDebounceFn);
  }, [reviewText]);

  // Handle manual trigger of AI Sentiment
  const triggerManualAnalysis = async () => {
    if (!reviewText.trim()) return;
    setAnalyzing(true);
    setAnalysisError('');
    try {
      const res = await fetch('/api/movie/analyze-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewText })
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setTypedSentiment(data.analysis);
      } else {
        setAnalysisError(data.error || 'Failed to capture AI sentiment.');
      }
    } catch (err) {
      setAnalysisError('Network error checking sentiment.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!reviewText.trim()) return;

    setSubmitting(true);
    try {
      let finalSentiment: SentimentAnalysis;
      
      // Use cached typed sentiment or fetch on submission
      if (typedSentiment) {
        finalSentiment = typedSentiment;
      } else {
        const res = await fetch('/api/movie/analyze-sentiment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reviewText })
        });
        const data = await res.json();
        if (data.success && data.analysis) {
          finalSentiment = data.analysis;
        } else {
          throw new Error(data.error || "Could not analyze review sentiment.");
        }
      }

      const reviewDoc: Review = {
        id: `review_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
        movieId: movie.title.toLowerCase().trim(),
        movieTitle: movie.title,
        userName: user.displayName,
        userEmail: user.email,
        rating: Number(rating),
        reviewText,
        timestamp: Date.now(),
        sentiment: finalSentiment.sentiment,
        sentimentScore: Number(finalSentiment.score),
        sentimentExplanation: finalSentiment.explanation
      };

      await addMovieReview(reviewDoc);
      
      // Reset
      setReviewText('');
      setRating(5);
      setTypedSentiment(null);
      onReviewAdded();
    } catch (err: any) {
      console.error("Could not write review:", err);
      setAnalysisError(err.message || 'Error occurred writing reviews.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to delete your review?")) {
      try {
        await deleteReview(reviewId, user.email);
        onReviewAdded();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Add Review Box */}
      {user ? (
        <form onSubmit={handleSubmitReview} className="glass rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#e5a00d]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-[#e5a00d]" />
            <h3 className="serif-italic italic text-2xl text-white">Write Your Critique</h3>
          </div>

          <div className="space-y-4">
            {/* Rating Stars Input */}
            <div>
              <label className="block text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">My Rating Grade</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform active:scale-95 focus:outline-none"
                  >
                    <Star className={`w-6 h-6 ${star <= rating ? 'text-[#e5a00d] fill-[#e5a00d]' : 'text-white/15'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Critique Body */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-mono text-white/40 uppercase tracking-widest">Interpretation & Review Text</label>
                <span className="text-[9px] font-mono text-white/30">{reviewText.length} characters</span>
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your critical thoughts on screen direction, cinematography, screenplay pace, thematic emotional resonance..."
                maxLength={4000}
                required
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-2xl text-white py-3 px-4 focus:outline-none focus:border-[#e5a00d]/50 text-sm leading-relaxed placeholder:text-white/20 transition-all"
              />
            </div>

            {/* Real-time Sentiment Analyzer Box */}
            <div className="bg-white/3 rounded-2xl p-4 border border-white/8 relative">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e5a00d] animate-ping" />
                  <span className="text-[10px] font-mono text-[#e5a00d] uppercase tracking-widest font-semibold">
                    Real-time AI Sentiment
                  </span>
                </div>

                {reviewText.trim().length >= 1 && (
                  <button
                    type="button"
                    onClick={triggerManualAnalysis}
                    disabled={analyzing}
                    className="text-[9px] font-mono text-white/60 hover:text-white flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/10 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${analyzing ? 'animate-spin' : ''}`} />
                    Analyze
                  </button>
                )}
              </div>

              {analyzing && (
                <div className="flex items-center gap-2 py-1 text-xs font-mono text-white/50">
                  <div className="w-3.5 h-3.5 border-2 border-[#e5a00d] border-t-transparent rounded-full animate-spin" />
                  Extracting scientific sentiment values...
                </div>
              )}

              {!analyzing && !typedSentiment && (
                <p className="text-xs text-white/40 italic py-1 leading-relaxed">
                  Start typing a complete thought to activate immediate Google Gemini emotional translation.
                </p>
              )}

              {analysisError && (
                <p className="text-xs text-red-400 font-mono py-1">{analysisError}</p>
              )}

              {!analyzing && typedSentiment && (
                <div className="space-y-2 mt-1">
                  <div className="flex gap-2.5 items-center flex-wrap">
                    <span className="text-[10px] font-mono text-white/40">DEDUCTION:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                      typedSentiment.sentiment === 'positive' ? 'bg-[#e5a00d]/10 text-[#e5a00d] border border-[#e5a00d]/20' :
                      typedSentiment.sentiment === 'negative' ? 'bg-white/10 text-white/70 border border-white/20' :
                      'bg-white/5 text-white/55 border border-white/10'
                    }`}>
                      {typedSentiment.sentiment}
                    </span>

                    <span className="text-[10px] font-mono text-white/40">CONFIDENCE:</span>
                    <span className="text-white text-xs font-mono font-bold bg-white/5 px-2 py-0.2 rounded border border-white/10">
                      {typedSentiment.score}%
                    </span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed italic border-l border-[#e5a00d]/55 pl-3">
                    "{typedSentiment.explanation}"
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || reviewText.trim().length < 15}
              id="submit-review-btn"
              className="w-full bg-[#e5a00d] hover:bg-[#ffb61e] text-black font-sans font-bold py-3.5 px-4 rounded-full text-xs uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 disabled:bg-white/10 disabled:text-white/30"
            >
              {submitting ? 'Submitting Critique...' : 'Publish AI-Analyzed Critique'}
            </button>
          </div>
        </form>
      ) : (
        <div className="glass rounded-3xl p-6 text-center">
          <ShieldAlert className="w-10 h-10 text-[#e5a00d] mx-auto mb-3" />
          <h4 className="serif-italic italic text-xl text-white">Write Critique Restricted</h4>
          <p className="text-white/50 text-xs mt-1.5 max-w-sm mx-auto leading-relaxed font-sans">
            Please log in using your persona profile at the header to publish real-time reviews.
          </p>
        </div>
      )}

      {/* 2. Reviews List Output Stream */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#e5a00d]" />
            <h3 className="text-xs uppercase tracking-widest text-white/40">Evaluation Stream ({reviews.length})</h3>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center glass py-12 rounded-3xl text-white/40 font-mono text-xs">
            Awaiting critique submissions. Join the screening above!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reviews.map((review) => (
              <div 
                key={review.id}
                className="bg-white/3 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
              >
                {/* Review Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/5 mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="serif-italic italic font-bold text-white text-base">{review.userName}</span>
                    <span className="text-white/20 font-mono text-xs">|</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-xs ${i < review.rating ? 'text-[#e5a00d]' : 'text-white/10'}`}>★</span>
                      ))}
                    </div>
                    {review.id.startsWith('preloaded_') && (
                      <span className="text-[9px] font-mono bg-white/5 text-white/60 px-1.5 py-0.2 rounded border border-white/10">verified critic</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 justify-between">
                    <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider">
                      {new Date(review.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    {user && user.email === review.userEmail && (
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="text-white/40 hover:text-red-400 transition-colors p-1 rounded hover:bg-white/5"
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Review Message Text */}
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line mb-4 font-sans">
                  {review.reviewText}
                </p>

                {/* Sentiment Label Badge Details */}
                <div className="bg-white/1 rounded-xl p-3.5 border border-white/5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">AI Verdict:</span>
                    <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold ${
                      review.sentiment === 'positive' ? 'bg-[#e5a00d]/10 text-[#e5a00d] border border-[#e5a00d]/20' :
                      review.sentiment === 'negative' ? 'bg-white/10 text-white/60 border border-white/20' :
                      'bg-white/5 text-white/50 border border-white/10'
                    }`}>
                      {review.sentiment}
                    </span>
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Confidence:</span>
                    <span className="text-white text-[9px] font-mono font-bold bg-white/5 px-1.5 py-0.2 rounded border border-white/10">
                      {review.sentimentScore}%
                    </span>
                  </div>
                  <p className="text-xs text-white/50 italic leading-relaxed pl-2 border-l border-white/10">
                    "{review.sentimentExplanation}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Review } from '../types';
import { Sparkles, MessageSquare, Flame, BarChart3, TrendingUp, Compass } from 'lucide-react';

interface Props {
  reviews: Review[];
}

export default function AnalyticsDashboard({ reviews }: Props) {
  // Compute analytics
  const stats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        positiveCount: 0,
        negativeCount: 0,
        mixedCount: 0,
        averageSentimentScore: 0,
        genreBreakdown: [] as { name: string; count: number }[],
        sentimentDistribution: [] as { name: string; value: number; color: string }[]
      };
    }

    let sumRating = 0;
    let sumSentimentScore = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let mixedCount = 0;

    reviews.forEach(r => {
      sumRating += Number(r.rating) || 0;
      sumSentimentScore += Number(r.sentimentScore) || 0;
      if (r.sentiment === 'positive') positiveCount++;
      else if (r.sentiment === 'negative') negativeCount++;
      else mixedCount++;
    });

    const sentimentDistribution = [
      { name: 'Positive', value: positiveCount, color: '#e5a00d' },  // Gold
      { name: 'Mixed', value: mixedCount, color: '#888888' },       // Silver/Gray
      { name: 'Negative', value: negativeCount, color: '#333333' }     // Charcoal dark
    ].filter(item => item.value > 0);

    // Group ratings for a bar chart
    const ratingCounts = [1, 2, 3, 4, 5].map(star => {
      const count = reviews.filter(r => Number(r.rating) === star).length;
      return { stars: `${star} ★`, Count: count };
    });

    return {
      totalReviews: reviews.length,
      averageRating: parseFloat((sumRating / reviews.length).toFixed(1)),
      positiveCount,
      negativeCount,
      mixedCount,
      averageSentimentScore: Math.round(sumSentimentScore / reviews.length),
      ratingCounts,
      sentimentDistribution
    };
  }, [reviews]);

  if (reviews.length === 0) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <Compass className="w-12 h-12 text-[#e5a00d]/60 mx-auto mb-4 animate-pulse" />
        <p className="text-white font-serif italic text-lg">No evaluations analyzed yet.</p>
        <p className="text-white/50 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
          Be the first to submit a detailed critical review and watch real-time AI sentiment indicators adapt!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reviews */}
        <div className="glass rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/40 text-[9px] font-medium tracking-widest uppercase font-mono">Total Critiques</p>
              <h3 className="text-3xl font-display font-semibold mt-2 text-white">{stats.totalReviews}</h3>
            </div>
            <div className="bg-white/5 p-2 rounded-lg text-[#e5a00d]/80 border border-white/5">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="h-[2px] bg-white/10 absolute bottom-0 left-0 w-full" />
        </div>

        {/* Avg Rating */}
        <div className="glass rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/40 text-[9px] font-medium tracking-widest uppercase font-mono">Avg Rating Score</p>
              <h3 className="text-3xl font-display font-semibold mt-2 text-white flex items-baseline">
                {stats.averageRating}
                <span className="text-xs font-sans text-white/40 ml-1.5 font-normal">/ 5.0</span>
              </h3>
            </div>
            <div className="bg-white/5 p-1.5 rounded-lg text-[#e5a00d] border border-white/5">
              <span className="text-lg font-bold font-mono">★</span>
            </div>
          </div>
          <div className="h-[2px] bg-[#e5a00d]/30 absolute bottom-0 left-0 w-full" />
        </div>

        {/* Sentiment Index */}
        <div className="glass rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/40 text-[9px] font-medium tracking-widest uppercase font-mono">AI Emotion Score</p>
              <h3 className="text-3xl font-display font-semibold mt-2 text-white flex items-baseline">
                {stats.averageSentimentScore}%
              </h3>
            </div>
            <div className="bg-white/5 p-2 rounded-lg text-[#e5a00d]/80 border border-white/5">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="h-[2px] bg-[#e5a00d]/40 absolute bottom-0 left-0 w-full" />
        </div>

        {/* Overall Vibe */}
        <div className="glass rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/40 text-[9px] font-medium tracking-widest uppercase font-mono">AI Concensus</p>
              <h3 className="text-lg font-display font-bold mt-3 text-white truncate">
                {stats.positiveCount > stats.negativeCount && stats.positiveCount > stats.mixedCount 
                  ? 'Highly Acclaimed' 
                  : stats.negativeCount > stats.positiveCount && stats.negativeCount > stats.mixedCount 
                  ? 'Critical Flop' 
                  : 'Mixed Reception'}
              </h3>
            </div>
            <div className="bg-white/5 p-2 rounded-lg text-white/40 border border-white/5 animate-pulse">
              <Flame className="w-4 h-4 text-[#e5a00d]" />
            </div>
          </div>
          <div className="h-[2px] bg-gradient-to-r from-[#e5a00d]/50 to-transparent absolute bottom-0 left-0 w-full" />
        </div>
      </div>

      {/* Charts Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sentiment Doughnut Chart */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#e5a00d]" />
            <h4 className="font-sans text-xs uppercase tracking-widest text-white/70">Sentiment Spectrum</h4>
          </div>
          <div className="h-64 flex justify-center items-center">
            {stats.sentimentDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.sentimentDistribution}
                    innerRadius={65}
                    outerRadius={80}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {stats.sentimentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0c0c0c', borderColor: '#222222', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend 
                    formatter={(value) => <span className="text-white/70 text-xs font-mono uppercase tracking-wider">{value}</span>}
                    verticalAlign="bottom" 
                    height={36}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-white/40 text-xs">Waiting for insights...</p>
            )}
          </div>
        </div>

        {/* Star Rating Breakdown */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[#e5a00d]" />
            <h4 className="font-sans text-xs uppercase tracking-widest text-white/70">Rating Densities</h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.ratingCounts} margin={{ bottom: 10, left: -25, right: 10, top: 10 }}>
                <XAxis 
                  dataKey="stars" 
                  stroke="#ffffff" 
                  opacity={0.3}
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  fontFamily="JetBrains Mono"
                />
                <YAxis 
                  stroke="#ffffff" 
                  opacity={0.3}
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false}
                  fontFamily="JetBrains Mono"
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.02)', radius: 8 }}
                  contentStyle={{ backgroundColor: '#0c0c0c', borderColor: '#222222', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="Count" radius={[6, 6, 0, 0]} barSize={26}>
                  {stats.ratingCounts?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      index === 4 ? '#e5a00d' : // 5 star (Deep Gold)
                      index === 3 ? '#b8820a' : // 4 star (Medium Gold)
                      index === 2 ? '#8c6507' : // 3 star (Bronze Gold)
                      index === 1 ? '#555555' : // 2 star (Silver Gray)
                      '#222222' // 1 star (Dark Gray)
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

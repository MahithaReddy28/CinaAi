/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Movie {
  title: string;
  year: string;
  genre: string;
  rated: string;
  runtime: string;
  director: string;
  writer: string;
  actors: string[];
  plot: string;
  poster: string;
  imdbRating: string;
  metacritic: string;
  recommendations: Recommendation[];
  reviews?: {
    userName: string;
    rating: number;
    reviewText: string;
    sentiment: SentimentType;
    sentimentScore: number;
    sentimentExplanation: string;
  }[];
}

export interface Recommendation {
  title: string;
  year: string;
  genre: string;
  reason: string;
  imdbRating: string;
}

export type SentimentType = 'positive' | 'negative' | 'mixed';

export interface SentimentAnalysis {
  sentiment: SentimentType;
  score: number; // 0 to 100
  explanation: string;
}

export interface Review {
  id: string;
  movieId: string;
  movieTitle: string;
  userName: string;
  userEmail: string;
  rating: number; // 1 to 5
  reviewText: string;
  timestamp: number; // Unix timestamp
  sentiment: SentimentType;
  sentimentScore: number;
  sentimentExplanation: string;
}

export interface WatchlistItem {
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  movieYear: string;
  addedAt: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
}

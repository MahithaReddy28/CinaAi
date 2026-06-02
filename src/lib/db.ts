/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  orderBy 
} from 'firebase/firestore';
import { db, isFirebaseActive, handleFirestoreError, OperationType } from './firebase';
import { Review, WatchlistItem, UserProfile } from '../types';

// Preloaded professional movie reviews to populate empty states
export const PRELOADED_REVIEWS: Record<string, Omit<Review, 'id' | 'timestamp'>[]> = {
  "Interstellar": [
    {
      movieId: "interstellar",
      movieTitle: "Interstellar",
      userName: "Nolanist Critic",
      userEmail: "critic@example.com",
      rating: 5,
      reviewText: "An absolute masterclass in science fiction. Hans Zimmer's pipe organ score paired with stunning wormhole visuals creates an overwhelming emotional experience that makes you ponder humanity's place in the cosmos.",
      sentiment: "positive",
      sentimentScore: 98,
      sentimentExplanation: "The review represents extremely positive sentiment. The critic highly commends the direction, music score, scientific realism, and existential themes."
    },
    {
      movieId: "interstellar",
      movieTitle: "Interstellar",
      userName: "Hard Sci-Fi Fanatic",
      userEmail: "scifi@example.com",
      rating: 4,
      reviewText: "The physics are surprisingly sound thanks to Kip Thorne's contribution, though the third-act bookcase sequence requires some suspend of disbelief. Overall, a massive cinematic achieve.",
      sentiment: "positive",
      sentimentScore: 82,
      sentimentExplanation: "Mostly positive sentiment with slight reservations on the third act plot device. Commends accuracy and visual scale."
    },
    {
      movieId: "interstellar",
      movieTitle: "Interstellar",
      userName: "Cynical Cineaste",
      userEmail: "cynic@example.com",
      rating: 3,
      reviewText: "Visually awe-inspiring, but Christoper Nolan gets bogged down in heavy-handed explanations about love transcending dimensions. It is three hours of beautiful visuals wrapping a flawed script.",
      sentiment: "mixed",
      sentimentScore: 50,
      sentimentExplanation: "Mixed sentiment. Strongly praises visuals, but heavily criticizes theme delivery, exposition, and writing flow."
    }
  ],
  "Inception": [
    {
      movieId: "inception",
      movieTitle: "Inception",
      userName: "Dreamweaver",
      userEmail: "dreamer@example.com",
      rating: 5,
      reviewText: "Mind-bending original action that keeps you on the edge of your seat. The dream architecture rules are detailed, logical, and flawlessly executed. The ending leaves you questioning reality.",
      sentiment: "positive",
      sentimentScore: 96,
      sentimentExplanation: "Highly positive feedback focusing on the film's originality, pacing, dream physics, and iconic open-ended closing shot."
    }
  ]
};

// Explicitly register search-generated reviews dynamically to populate the review feed
export function registerDynamicPreloadedReviews(movieTitle: string, reviewsList: any[]) {
  const normId = movieTitle.toLowerCase().trim();
  if (!PRELOADED_REVIEWS[normId] && !PRELOADED_REVIEWS[movieTitle] && reviewsList && Array.isArray(reviewsList)) {
    PRELOADED_REVIEWS[normId] = reviewsList.map((r, idx) => ({
      movieId: normId,
      movieTitle: movieTitle,
      userName: r.userName || `Film Critic ${idx + 1}`,
      userEmail: `critic_${idx + 1}@cineai.org`,
      rating: Number(r.rating) || 5,
      reviewText: r.reviewText || "Cinematographic value verified.",
      sentiment: (r.sentiment as any) || "positive",
      sentimentScore: Number(r.sentimentScore) || 90,
      sentimentExplanation: r.sentimentExplanation || "Positive critical consensus."
    }));
  }
}

// --- Firebase vs Local Storage Hub ---

// 1. Save or Update User Profile
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  if (isFirebaseActive) {
    const path = `users/${profile.uid}`;
    try {
      await setDoc(doc(db, 'users', profile.uid), profile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  } else {
    localStorage.setItem(`profile_${profile.uid}`, JSON.stringify(profile));
  }
}

// 2. Fetch User Profile
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (isFirebaseActive) {
    const path = `users/${uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists() ? (snap.data() as UserProfile) : null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  } else {
    const saved = localStorage.getItem(`profile_${uid}`);
    return saved ? JSON.parse(saved) : null;
  }
}

// 3. Save a movie review
export async function addMovieReview(review: Review): Promise<void> {
  if (isFirebaseActive) {
    const path = `reviews/${review.id}`;
    try {
      await setDoc(doc(db, 'reviews', review.id), review);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  } else {
    const reviews = getLocalReviews();
    reviews.push(review);
    saveLocalReviews(reviews);
  }
}

// 4. Fetch professional and user reviews for a specific movie
export async function getReviewsForMovie(movieId: string): Promise<Review[]> {
  const normId = movieId.toLowerCase().trim();
  
  // Synthesize default preloaded reviews
  const preReviews: Review[] = (PRELOADED_REVIEWS[movieId] || PRELOADED_REVIEWS[normId] || []).map((p, idx) => ({
    ...p,
    id: `preloaded_${normId}_${idx}`,
    timestamp: Date.now() - (3 - idx) * 24 * 60 * 60 * 1000 // offset by days
  }));

  if (isFirebaseActive) {
    const path = 'reviews';
    try {
      const q = query(
        collection(db, 'reviews'), 
        where('movieId', '==', normId)
      );
      const snap = await getDocs(q);
      const fbReviews = snap.docs.map(d => {
        const item = d.data();
        return {
          ...item,
          rating: Number(item.rating) || 5,
          sentimentScore: Number(item.sentimentScore) || 50
        } as Review;
      });
      
      // Sort combined array by timestamp descending
      return [...preReviews, ...fbReviews].sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  } else {
    const local = getLocalReviews().filter(r => r.movieId.toLowerCase().trim() === normId).map(r => ({
      ...r,
      rating: Number(r.rating) || 5,
      sentimentScore: Number(r.sentimentScore) || 50
    }));
    return [...preReviews, ...local].sort((a, b) => b.timestamp - a.timestamp);
  }
}

// 5. Fetch all reviews in database (useful for review analytics, statistics, dashboarding!)
export async function getAllReviews(): Promise<Review[]> {
  const preloadedList: Review[] = [];
  Object.keys(PRELOADED_REVIEWS).forEach(key => {
    PRELOADED_REVIEWS[key].forEach((r, idx) => {
      preloadedList.push({
        ...r,
        id: `preloaded_${key.toLowerCase()}_${idx}`,
        timestamp: Date.now() - (3 - idx) * 24 * 60 * 60 * 1000
      });
    });
  });

  if (isFirebaseActive) {
    const path = 'reviews';
    try {
      const snap = await getDocs(collection(db, 'reviews'));
      const fbReviews = snap.docs.map(d => {
        const item = d.data();
        return {
          ...item,
          rating: Number(item.rating) || 5,
          sentimentScore: Number(item.sentimentScore) || 50
        } as Review;
      });
      return [...preloadedList, ...fbReviews];
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  } else {
    const local = getLocalReviews().map(r => ({
      ...r,
      rating: Number(r.rating) || 5,
      sentimentScore: Number(r.sentimentScore) || 50
    }));
    return [...preloadedList, ...local];
  }
}

// 6. Delete User's Review
export async function deleteReview(reviewId: string, userEmail: string): Promise<void> {
  if (isFirebaseActive) {
    const path = `reviews/${reviewId}`;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  } else {
    const reviews = getLocalReviews();
    const filtered = reviews.filter(r => !(r.id === reviewId && r.userEmail === userEmail));
    saveLocalReviews(filtered);
  }
}

// 7. Watchlist: Add movie to Watchlist
export async function addToWatchlist(userId: string, item: WatchlistItem): Promise<void> {
  if (isFirebaseActive) {
    const path = `users/${userId}/watchlist/${item.movieId}`;
    try {
      await setDoc(doc(db, 'users', userId, 'watchlist', item.movieId), item);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  } else {
    const watchlist = getLocalWatchlist(userId);
    if (!watchlist.some(w => w.movieId === item.movieId)) {
      watchlist.push(item);
      saveLocalWatchlist(userId, watchlist);
    }
  }
}

// 8. Watchlist: Remove from Watchlist
export async function removeFromWatchlist(userId: string, movieId: string): Promise<void> {
  if (isFirebaseActive) {
    const path = `users/${userId}/watchlist/${movieId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'watchlist', movieId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  } else {
    const watchlist = getLocalWatchlist(userId);
    const filtered = watchlist.filter(item => item.movieId !== movieId);
    saveLocalWatchlist(userId, filtered);
  }
}

// 9. Watchlist: Load user's watchlist
export async function getWatchlist(userId: string): Promise<WatchlistItem[]> {
  if (isFirebaseActive) {
    const path = `users/${userId}/watchlist`;
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'watchlist'));
      return snap.docs.map(doc => doc.data() as WatchlistItem)
        .sort((a, b) => b.addedAt - a.addedAt);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  } else {
    return getLocalWatchlist(userId);
  }
}

// --- Local Storage Helpers ---
function getLocalReviews(): Review[] {
  const saved = localStorage.getItem('ai_reviews_list');
  return saved ? JSON.parse(saved) : [];
}

function saveLocalReviews(reviews: Review[]) {
  localStorage.setItem('ai_reviews_list', JSON.stringify(reviews));
}

function getLocalWatchlist(userId: string): WatchlistItem[] {
  const saved = localStorage.getItem(`watchlist_${userId}`);
  return saved ? JSON.parse(saved) : [];
}

function saveLocalWatchlist(userId: string, list: WatchlistItem[]) {
  localStorage.setItem(`watchlist_${userId}`, JSON.stringify(list));
}

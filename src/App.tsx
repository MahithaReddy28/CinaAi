/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Film, 
  Search, 
  Heart, 
  Sparkles, 
  Star, 
  Activity, 
  Compass, 
  Clock, 
  AlertCircle, 
  Calendar, 
  UserSquare2, 
  ArrowRight,
  TrendingUp,
  Bookmark,
  Check
} from 'lucide-react';

import { Movie, Review, WatchlistItem, UserProfile } from './types';
import { getReviewsForMovie, getWatchlist, addToWatchlist, removeFromWatchlist, registerDynamicPreloadedReviews } from './lib/db';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import MovieReviewsList from './components/MovieReviewsList';
import AuthInterface from './components/AuthInterface';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial Boot: Check user auth status from localStorage and preload default movie (Interstellar)
  useEffect(() => {
    // Check if there is an active demo profile
    const keys = Object.keys(localStorage);
    const demoProfileKey = keys.find(k => k.startsWith('profile_'));
    if (demoProfileKey) {
      const saved = localStorage.getItem(demoProfileKey);
      if (saved) {
        setUser(JSON.parse(saved));
      }
    }
    
    // Initial Movie load (Interstellar)
    executeSearch('Interstellar');
  }, []);

  // Sync Watchlist and Reviews whenever Selected Movie or Authenticated User changes
  useEffect(() => {
    if (currentMovie) {
      loadMovieReviews(currentMovie.title);
    }
    if (user) {
      loadWatchlist();
    } else {
      setWatchlist([]);
    }
  }, [currentMovie, user]);

  const loadMovieReviews = async (movieTitle: string) => {
    try {
      const list = await getReviewsForMovie(movieTitle);
      setReviews(list);
    } catch (err) {
      console.error(err);
    }
  };

  const loadWatchlist = async () => {
    if (!user) return;
    try {
      const list = await getWatchlist(user.uid);
      setWatchlist(list);
    } catch (err) {
      console.error(err);
    }
  };

  const executeSearch = async (queryStr: string) => {
    if (!queryStr.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/movie/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryStr })
      });
      const data = await res.json();
      if (data.success && data.movie) {
        if (data.movie.reviews) {
          registerDynamicPreloadedReviews(data.movie.title, data.movie.reviews);
        }
        setCurrentMovie(data.movie);
        setSearchQuery('');
      } else {
        setError(data.error || 'Failed to locate movie information. Try a different query.');
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setError('A network failure occurred. Please ensure your Express dev server of CineMind is operational.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  // Toggle user watchlist selection (❤️ Save / Unsave)
  const handleToggleWatchlist = async () => {
    if (!user || !currentMovie) return;
    
    const isSaved = watchlist.some(w => w.movieId === currentMovie.title.toLowerCase().trim());
    const mId = currentMovie.title.toLowerCase().trim();

    try {
      if (isSaved) {
        await removeFromWatchlist(user.uid, mId);
      } else {
        const item: WatchlistItem = {
          movieId: mId,
          movieTitle: currentMovie.title,
          moviePoster: currentMovie.poster || '',
          movieYear: currentMovie.year,
          addedAt: Date.now()
        };
        await addToWatchlist(user.uid, item);
      }
      loadWatchlist();
    } catch (err) {
      console.error(err);
    }
  };

  const selectWatchlistItem = (item: WatchlistItem) => {
    executeSearch(item.movieTitle);
  };

  const isSavedInWatchlist = currentMovie && watchlist.some(w => w.movieId === currentMovie.title.toLowerCase().trim());

  return (
    <div className="min-h-screen bg-[#080808] text-[#e0e0e0] flex flex-col font-sans selection:bg-[#e5a00d]/30 selection:text-white">
      
      {/* 1. Sophisticated Header Area */}
      <header className="border-b border-white/10 bg-[#080808]/95 backdrop-blur-md sticky top-0 z-50 px-4 py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Headline */}
          <div className="flex items-center gap-4">
            <div 
              className="text-2xl font-bold tracking-tighter text-[#e5a00d] font-display italic select-none cursor-pointer"
              onClick={() => executeSearch('Interstellar')}
            >
              CINE<span className="text-white not-italic font-sans">AI</span>
            </div>
          </div>

          {/* Centered Search Engine Bar & Dynamic Quick Suggestions */}
          <div className="flex flex-col gap-1.5 w-full md:max-w-md">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movie details..."
                className="w-full bg-white/5 border border-white/10 text-white pl-11 pr-24 py-2.5 rounded-full text-xs focus:outline-none focus:border-[#e5a00d]/50 placeholder:text-white/25 transition-all text-ellipsis"
              />
              <Search className="w-4 h-4 text-white/30 absolute left-4.5 top-3.5 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-2 top-1.5 bg-[#e5a00d] hover:bg-[#ffb61e] text-black font-sans text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow transition-all active:scale-95"
              >
                Analyze
              </button>
            </form>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[10px] text-white/40">
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider mr-1 opacity-50">Popular:</span>
              {['Dune', 'The Dark Knight', 'The Matrix', 'Parasite', 'Interstellar'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => executeSearch(m)}
                  className="shrink-0 hover:text-white hover:border-white/20 hover:bg-white/5 bg-white/2 px-2.5 py-0.5 rounded-full border border-white/3 transition-all cursor-pointer text-ellipsis text-left font-sans"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* User Profile module */}
          <div className="shrink-0 flex justify-end">
            <AuthInterface user={user} onUserChange={setUser} />
          </div>

        </div>
      </header>

      {/* 2. Main Content Board */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-2xl flex items-start gap-3.5 max-w-xl mx-auto font-mono text-xs">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider block mb-1">Evaluation Halted</span>
              {error}
            </div>
          </div>
        )}

        {/* Dynamic loading state */}
        {loading ? (
          <div className="h-[60vh] flex flex-col justify-center items-center gap-4 text-center">
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 border-4 border-white/5 border-t-[#e5a00d] rounded-full animate-spin" />
              <Film className="w-5 h-5 text-[#e5a00d] absolute animate-pulse" />
            </div>
            <div>
              <p className="font-display italic text-lg text-white">Synthesizing cinematic dimensions...</p>
              <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest mt-1">Google Gemini 3.5 Active</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT 3 COLS: Movie Sheet & Feedbacks */}
            {currentMovie ? (
              <div className="lg:col-span-9 space-y-8">
                             {/* 2.1 High-Impact Cinematic Banner */}
                <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 group mb-6">
                  {/* Backdrop blur with blended styling */}
                  <div className="absolute inset-0 w-full h-full select-none overflow-hidden bg-black/60">
                    {currentMovie.poster ? (
                      <div className="absolute inset-0">
                        <img
                          src={currentMovie.poster}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover filter blur-2xl brightness-[0.22] saturate-150 scale-125 transition-transform duration-750 group-hover:scale-130"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop";
                          }}
                        />
                        <div className="absolute inset-0 bg-[#080808]/40 mix-blend-multiply" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#12121e] to-[#080808]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/75 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/95 via-[#080808]/40 to-transparent" />
                    <div className="absolute inset-0 star-field opacity-20 pointer-events-none" />
                  </div>

                  {/* Banner content */}
                  <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 min-h-[220px] sm:min-h-[260px]">
                    
                    {/* Compact floating poster in the banner for desktops */}
                    {currentMovie.poster ? (
                      <div className="hidden md:block w-32 shrink-0 rounded-xl overflow-hidden border border-white/20 shadow-2xl translate-y-6 select-none bg-black">
                        <img 
                          src={currentMovie.poster} 
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-auto object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop";
                          }}
                        />
                      </div>
                    ) : null}

                    {/* Metadata column */}
                    <div className="flex-1 text-center md:text-left space-y-3">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-[10px] font-mono tracking-wider text-[#e5a00d]">
                        <span className="bg-[#e5a00d]/10 border border-[#e5a00d]/20 px-2.5 py-0.5 rounded font-bold uppercase">
                          {currentMovie.year}
                        </span>
                        <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded uppercase text-white/70">
                          {currentMovie.rated || 'NOT RATED'}
                        </span>
                        <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded uppercase text-white/70">
                          {currentMovie.runtime}
                        </span>
                        <span className="text-white/40">•</span>
                        <span className="text-white/75 font-sans italic">{currentMovie.genre}</span>
                      </div>

                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-white leading-none drop-shadow-md">
                        {currentMovie.title}
                      </h1>

                      <p className="text-xs text-white/50 font-mono tracking-wide">
                        Symphonized by director <span className="text-white font-semibold">{currentMovie.director}</span>
                      </p>
                    </div>

                    {/* Prominent Multi-Metric Ratings Panel */}
                    <div className="shrink-0 flex items-center md:items-end gap-3 sm:gap-4 flex-wrap justify-center sm:translate-y-4">
                      <div className="bg-[#121212]/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center shadow-xl hover:border-[#e5a00d]/30 transition-all">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-white/40 block mb-0.5">IMDb INDEX</span>
                        <div className="text-base font-bold font-mono text-white flex items-center gap-1 justify-center">
                          <span className="text-[#e5a00d]">★</span>
                          {currentMovie.imdbRating || "N/A"}
                          <span className="text-[9px] opacity-40 font-normal">/10</span>
                        </div>
                      </div>

                      <div className="bg-[#121212]/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center shadow-xl hover:border-[#e5a00d]/30 transition-all">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-white/40 block mb-0.5">METASCORE</span>
                        <div className="text-base font-bold font-mono text-white flex items-center gap-1 justify-center">
                          <span className="text-emerald-500 font-sans text-xs">●</span>
                          {currentMovie.metacritic || "N/A"}
                          <span className="text-[9px] opacity-40 font-normal">/100</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 2.2 Deep Movie Details Card Grid */}
                <div className="glass rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 star-field pointer-events-none opacity-10"></div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
                    
                    {/* LEFT PANEL: Mobile Poster display & Watchlist interaction */}
                    <div className="md:col-span-4 flex flex-col gap-4">
                      {/* Show poster fallback or secondary detail container */}
                      <div className="relative w-full rounded-2xl overflow-hidden group shadow-2xl border border-white/10 bg-black/40">
                        {currentMovie.poster ? (
                          <img 
                            src={currentMovie.poster} 
                            alt={`${currentMovie.title} official poster`}
                            referrerPolicy="no-referrer"
                            className="w-full h-auto max-h-[380px] object-cover transition-transform duration-500 group-hover:scale-102"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const fallback = document.getElementById('details-poster-fallback');
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}

                        {/* Fallback frame in case images are blocked */}
                        <div 
                          id="details-poster-fallback"
                          style={{ display: currentMovie.poster ? 'none' : 'flex' }}
                          className="w-full h-[320px] poster-gradient flex flex-col justify-center items-center p-6 text-center relative overflow-hidden"
                        >
                          <div className="serif-italic italic text-3xl text-white/20 mb-3">{currentMovie.year}</div>
                          <h4 className="font-display font-semibold text-white leading-snug uppercase tracking-wider text-sm">{currentMovie.title}</h4>
                          <span className="text-[9px] text-[#e5a00d] uppercase tracking-widest mt-2 block">{currentMovie.genre}</span>
                        </div>
                      </div>

                      {/* Watchlist Interaction toggler */}
                      {user ? (
                        <button
                          onClick={handleToggleWatchlist}
                          className={`w-full py-2.5 px-4 rounded-full font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] border ${
                            isSavedInWatchlist 
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20' 
                              : 'bg-[#e5a00d] hover:bg-[#ffb61e] text-black border-transparent shadow shadow-[#e5a00d]/10'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isSavedInWatchlist ? 'fill-red-400 text-red-400' : ''}`} />
                          {isSavedInWatchlist ? 'Saved in Watchlist' : 'Add to Watchlist'}
                        </button>
                      ) : (
                        <div className="text-center bg-white/2 p-3.5 rounded-2xl border border-white/5">
                          <p className="text-[10px] font-mono text-white/35 leading-relaxed">
                            Sign in at the header profile menu to add this film to your library.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* RIGHT PANEL: Screenplay, Cast, and Fine-grain Rating representation */}
                    <div className="md:col-span-8 space-y-6">
                      
                      {/* Introduction & Storyline */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-[#e5a00d] uppercase tracking-[0.2em] block font-bold">THE NARRATIVE SCREENPLAY</span>
                        <h4 className="serif-italic italic text-2xl text-white">The Storyline</h4>
                        <p className="text-sm text-white/70 leading-relaxed font-sans font-light">
                          {currentMovie.plot}
                        </p>
                      </div>

                      {/* Dynamic Calculated Stars Meter */}
                      <div className="bg-white/2 rounded-2xl p-4 border border-white/5 space-y-2.5">
                        <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block font-bold">CineAI Core Rating Score</span>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, idx) => {
                              const calculatedStarRating = Math.round((parseFloat(currentMovie.imdbRating || "0") / 2));
                              return (
                                <Star 
                                  key={idx} 
                                  className={`w-5 h-5 ${idx < calculatedStarRating ? 'text-[#e5a00d] fill-[#e5a00d]' : 'text-white/10'}`} 
                                />
                              );
                            })}
                            <span className="ml-2 font-mono text-sm text-white font-semibold">
                              {Math.round(parseFloat(currentMovie.imdbRating || "0") * 10)}% consensus rating
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-mono">
                            <span className="text-white/40">Rated</span>
                            <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/80 font-bold uppercase">{currentMovie.rated || 'NR'}</span>
                            <span className="text-white/40 ml-1">Length</span>
                            <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/80 font-bold uppercase">{currentMovie.runtime}</span>
                          </div>
                        </div>
                      </div>

                      {/* Technical specifications */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                        <div>
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block font-semibold">Director</span>
                          <span className="text-sm font-semibold text-white font-sans">{currentMovie.director}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block font-semibold">Screenplay Writers</span>
                          <span className="text-sm font-semibold text-white font-sans truncate max-w-xs block" title={currentMovie.writer}>{currentMovie.writer}</span>
                        </div>
                      </div>

                      {/* Actors cast block */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-3">
                          <UserSquare2 className="w-3.5 h-3.5 text-[#e5a00d]/50" />
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block font-bold">Main Character Cast</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {currentMovie.actors && currentMovie.actors.map((actor, idx) => (
                            <div key={idx} className="flex items-center gap-2.5 bg-white/3 p-2 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                              <div className="w-6 h-6 rounded-full bg-[#e5a00d]/10 border border-[#e5a00d]/20 flex items-center justify-center text-[9px] font-mono text-[#e5a00d] shrink-0">
                                {actor.split(' ')[0] ? actor.split(' ')[0][0] : ''}
                                {actor.split(' ').slice(-1)[0] ? actor.split(' ').slice(-1)[0][0] : ''}
                              </div>
                              <span className="text-xs font-semibold text-white/80 font-sans truncate" title={actor}>{actor}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>
                </div>

                {/* 2.2 Recharts Analytics Dashboard */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#e5a00d]" />
                    <h3 className="text-xs uppercase tracking-widest text-white/40">Real-time Sentiment Insights</h3>
                  </div>
                  <AnalyticsDashboard reviews={reviews} />
                </div>

                {/* 2.3 Review submission and reviews list stream */}
                <MovieReviewsList 
                  movie={currentMovie} 
                  reviews={reviews} 
                  user={user} 
                  onReviewAdded={() => loadMovieReviews(currentMovie.title)} 
                />

              </div>
            ) : (
              <div className="lg:col-span-9 text-center py-20 glass rounded-3xl">
                <Compass className="w-12 h-12 text-[#e5a00d]/30 mx-auto mb-4 animate-bounce-slow" />
                <h3 className="serif-italic italic text-2xl text-white">Select a Film Workspace</h3>
                <p className="text-white/50 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
                  Evaluate screenplay emotion dynamically. Locate custom movies at the headers to start.
                </p>
              </div>
            )}

            {/* RIGHT SIDEBAR PANEL: Recommendations & Watchlist items */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Similar Recommendations box */}
              {currentMovie && currentMovie.recommendations?.length > 0 && (
                <div className="glass rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-[#e5a00d]" />
                    <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Recommended Features</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {currentMovie.recommendations.map((rec, idx) => (
                      <div 
                        key={idx}
                        onClick={() => executeSearch(rec.title)}
                        className="group bg-white/3 border border-white/5 rounded-2xl p-3.5 hover:border-[#e5a00d]/30 transition-all cursor-pointer relative"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h5 className="font-sans font-bold text-white group-hover:text-[#e5a00d] text-xs transition-colors line-clamp-1">
                            {rec.title}
                          </h5>
                          <span className="text-[9px] font-mono text-white/40 shrink-0">{rec.year}</span>
                        </div>
                        <p className="text-[11px] text-white/55 leading-normal mt-1.5 font-sans italic line-clamp-2">
                          "{rec.reason}"
                        </p>
                        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/5">
                          <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider">{rec.genre.split(',')[0]}</span>
                          <span className="text-[9px] font-mono text-[#e5a00d] flex items-center gap-0.5 font-bold">★ {rec.imdbRating}</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-[#e5a00d] absolute right-3.5 bottom-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Watchlist Section */}
              <div className="glass rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-4 justify-between">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-3.5 h-3.5 text-[#e5a00d]" />
                    <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest">My Library Watchlist</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-[#e5a00d]/10 text-[#e5a00d] px-2 py-0.5 rounded border border-[#e5a00d]/20 font-bold">{watchlist.length}</span>
                </div>

                {!user ? (
                  <p className="text-xs text-white/40 italic text-center py-6 leading-relaxed">
                    Log in inside the sidebar to build your private library screen lists.
                  </p>
                ) : watchlist.length === 0 ? (
                  <p className="text-xs text-white/40 italic text-center py-6 leading-relaxed">
                    Watchlist empty. Select "+ Add to Watchlist" on any film file!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 max-h-96 overflow-y-auto pr-1">
                    {watchlist.map((item) => (
                      <div
                        key={item.movieId}
                        onClick={() => selectWatchlistItem(item)}
                        className="flex items-center gap-3 bg-white/3 border border-white/5 p-2 rounded-2xl hover:border-white/20 transition-all cursor-pointer group"
                      >
                        {item.moviePoster ? (
                          <img 
                            src={item.moviePoster} 
                            alt="" 
                            referrerPolicy="no-referrer"
                            className="w-9 h-12 object-cover rounded-xl bg-white/5 border border-white/10 shrink-0" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=100&auto=format&fit=crop";
                            }}
                          />
                        ) : (
                          <div className="w-9 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                            <Film className="w-3.5 h-3.5 text-white/30" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-sans font-bold text-white text-xs truncate group-hover:text-[#e5a00d] transition-colors">
                            {item.movieTitle}
                          </h5>
                          <span className="text-[9px] font-mono text-white/40 tracking-wider block mt-0.5">{item.movieYear}</span>
                          <span className="text-[8px] font-mono text-[#e5a00d] uppercase tracking-widest mt-1 flex items-center gap-1 font-bold">
                            <Clock className="w-2.5 h-2.5" />
                            Archived
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* 3. Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-[10px] text-white/35 font-mono mt-12 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 CineAI Platforms. Driven by Google Gemini 3.5 evaluations.</p>
          <div className="flex gap-4 items-center flex-wrap">
            <span className="hover:text-white transition-colors cursor-pointer uppercase tracking-wider">Workspace Security</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer uppercase tracking-wider">API Keys</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer uppercase tracking-wider">Premium screening</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

'use client'

import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Loader2,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [rawTranscript, setRawTranscript] = useState<string | null>(null);
  const [cleanedTranscript, setCleanedTranscript] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [usedWhisper, setUsedWhisper] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showRawTranscript, setShowRawTranscript] = useState<boolean>(false);

  const handleCopy = async () => {
    if (!cleanedTranscript) return;

    try {
      await navigator.clipboard.writeText(cleanedTranscript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setProcessing(true);
    setError(null);
    setRawTranscript(null);
    setCleanedTranscript(null);
    setVideoTitle(null);
    setUsedWhisper(false);

    try {
      // STEP 1: Get raw transcript
      setCurrentStep('Fetching transcript...');
      const transcriptResponse = await axios.post('/api/youtube', { url: youtubeUrl });
      const raw = transcriptResponse.data.content;
      const title = transcriptResponse.data.title;
      const whisper = transcriptResponse.data.usedWhisper || false;

      setRawTranscript(raw);
      setVideoTitle(title);
      setUsedWhisper(whisper);

      // STEP 2: Clean up the transcript with Claude
      setCurrentStep('Cleaning transcript with AI...');
      const cleanResponse = await axios.post('/api/anthropic', {
        content: raw,
        task: `You are an expert in analyzing long form content. Clean up this raw video transcript to prepare it as an article draft.

Your tasks:
1. Remove video-specific references: "video", "subscribe", "like the video", "like button", "watch", "channel"
2. Remove chatter and small talk unrelated to the main topic
3. Remove ALL commercial content, advertisements, and promotional material:
   - Sponsored product mentions
   - Discount codes and affiliate links
   - Sponsor shoutouts
   - Self-promotion of services/products
   - Calls to action for purchasing
4. Keep only the substantive educational or informational content
5. Organize the content into clear paragraphs with logical flow
6. Fix grammar and punctuation
7. Preserve the original meaning and key insights

Return ONLY the cleaned content, ready to be read as an article. Do not add any meta-commentary about what you did.`
      });

      setCleanedTranscript(cleanResponse.data.result);
      setCurrentStep('Complete!');

    } catch (err: unknown) {
      console.error('Error processing video:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Failed to process video');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setProcessing(false);
      setCurrentStep('');
    }
  };

  const handleReset = () => {
    setYoutubeUrl('');
    setRawTranscript(null);
    setCleanedTranscript(null);
    setVideoTitle(null);
    setUsedWhisper(false);
    setError(null);
    setCurrentStep('');
    setShowRawTranscript(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 -left-20 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)' }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 -right-20 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, var(--color-highlight) 0%, transparent 70%)' }}
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Sparkles className="w-8 h-8 text-[var(--color-accent)]" />
            <h1 className="text-7xl md:text-8xl gradient-text tracking-wider">
              TRANSCRIPT
            </h1>
            <Sparkles className="w-8 h-8 text-[var(--color-highlight)]" />
          </motion.div>
          <motion.p
            className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Transform YouTube videos into clean, readable articles with AI-powered transcription
          </motion.p>
        </motion.div>

        {/* Input Form */}
        <motion.div
          className="glass-strong rounded-3xl p-8 mb-8 border-2"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="youtube-url"
                className="block text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wide"
              >
                YouTube URL
              </label>
              <div className="relative">
                <Play className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-accent)]" />
                <input
                  id="youtube-url"
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={cn(
                    "w-full pl-12 pr-4 py-4 rounded-xl",
                    "bg-white/10 border-2 border-white/20",
                    "text-[var(--text-primary)] placeholder-[var(--text-muted)]",
                    "focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/30",
                    "transition-all duration-300",
                    "backdrop-blur-sm",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  disabled={processing}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <motion.button
                type="submit"
                disabled={processing}
                className={cn(
                  "flex-1 relative overflow-hidden",
                  "py-4 px-6 rounded-xl",
                  "font-bold text-lg tracking-wide uppercase",
                  "text-white",
                  "transition-all duration-300",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "group"
                )}
                style={{
                  background: processing
                    ? 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))'
                    : 'linear-gradient(135deg, var(--color-accent), var(--color-highlight))'
                }}
                whileHover={{ scale: processing ? 1 : 1.02 }}
                whileTap={{ scale: processing ? 1 : 0.98 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {currentStep}
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Extract Transcript
                    </>
                  )}
                </span>
                {!processing && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                )}
              </motion.button>

              {(rawTranscript || cleanedTranscript) && (
                <motion.button
                  type="button"
                  onClick={handleReset}
                  className={cn(
                    "py-4 px-6 rounded-xl",
                    "font-semibold uppercase tracking-wide",
                    "bg-white/10 hover:bg-white/20",
                    "border-2 border-white/30",
                    "text-[var(--text-primary)]",
                    "transition-all duration-300"
                  )}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Reset
                </motion.button>
              )}
            </div>
          </form>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="mt-6 p-4 rounded-xl bg-red-500/20 border-2 border-red-400/50 backdrop-blur-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                  <p className="text-red-100 text-sm font-medium">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Video Info */}
        <AnimatePresence>
          {videoTitle && (
            <motion.div
              className="glass rounded-2xl p-6 mb-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 leading-tight">
                    {videoTitle}
                  </h2>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        usedWhisper ? "bg-orange-400" : "bg-emerald-400"
                      )}
                    />
                    <p className="text-sm text-[var(--text-secondary)] font-medium">
                      {usedWhisper ? 'Transcribed using OpenAI Whisper' : 'Native YouTube transcript'}
                    </p>
                  </div>
                </div>
                <FileText className="w-8 h-8 text-[var(--color-accent)] flex-shrink-0" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {cleanedTranscript && (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Cleaned Transcript */}
              <motion.div
                className="glass-strong rounded-3xl p-8 border-2"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-1">
                      Cleaned Transcript
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] font-medium">
                      {cleanedTranscript.split(' ').length} words • Ready to read
                    </p>
                  </div>
                  <motion.button
                    onClick={handleCopy}
                    className={cn(
                      "flex items-center gap-2 px-5 py-3 rounded-xl",
                      "font-semibold uppercase tracking-wide text-sm",
                      "transition-all duration-300",
                      copied
                        ? "bg-emerald-500/30 border-2 border-emerald-400 text-emerald-300"
                        : "bg-[var(--color-accent)]/20 border-2 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </motion.button>
                </div>
                <div className="prose prose-invert max-w-none">
                  <div className="text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed text-lg">
                    {cleanedTranscript}
                  </div>
                </div>
              </motion.div>

              {/* Raw Transcript Toggle */}
              {rawTranscript && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.button
                    onClick={() => setShowRawTranscript(!showRawTranscript)}
                    className={cn(
                      "w-full glass rounded-2xl p-6",
                      "flex items-center justify-between",
                      "text-left font-semibold text-[var(--text-primary)]",
                      "transition-all duration-300",
                      "hover:bg-white/15",
                      "border-2 border-white/10 hover:border-white/20"
                    )}
                    whileHover={{ scale: 1.01 }}
                  >
                    <span className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[var(--text-muted)]" />
                      View Raw Transcript ({rawTranscript.split(' ').length} words)
                    </span>
                    <motion.div
                      animate={{ rotate: showRawTranscript ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <svg
                        className="w-5 h-5 text-[var(--text-muted)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {showRawTranscript && (
                      <motion.div
                        className="mt-4 glass rounded-2xl p-6"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="text-[var(--text-muted)] text-sm whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                          {rawTranscript}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <motion.div
          className="mt-12 text-center text-sm text-[var(--text-muted)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
        >
          <p className="mb-2">
            Powered by{' '}
            <span className="font-bold text-[var(--color-accent)]">youtube-transcript</span>
            {' '}library with{' '}
            <span className="font-bold text-[var(--color-highlight)]">OpenAI Whisper</span>
            {' '}fallback
          </p>
          <p>
            AI cleaning by{' '}
            <span className="font-bold gradient-text">Claude AI</span>
            {' '}to remove ads and fluff
          </p>
        </motion.div>
      </div>
    </div>
  );
}

'use client'

import React, { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [rawTranscript, setRawTranscript] = useState<string | null>(null);
  const [cleanedTranscript, setCleanedTranscript] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [usedWhisper, setUsedWhisper] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');

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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            YouTube Transcript Extractor
          </h1>
          <p className="text-slate-600">
            Extract and clean transcripts from YouTube videos using native transcripts or AI-powered Whisper
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="youtube-url" className="block text-sm font-medium text-slate-700 mb-2">
                YouTube URL
              </label>
              <input
                id="youtube-url"
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={processing}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={processing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {processing ? currentStep : 'Extract Transcript'}
              </button>
              {(rawTranscript || cleanedTranscript) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-slate-500 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Video Info */}
        {videoTitle && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 mb-1">
                  {videoTitle}
                </h2>
                <p className="text-sm text-slate-500">
                  {usedWhisper ? (
                    <span className="inline-flex items-center">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                      Transcribed using OpenAI Whisper
                    </span>
                  ) : (
                    <span className="inline-flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Native YouTube transcript
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {cleanedTranscript && (
          <div className="space-y-6">
            {/* Cleaned Transcript */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800">
                  Cleaned Transcript
                </h2>
                <span className="text-sm text-slate-500">
                  {cleanedTranscript.split(' ').length} words
                </span>
              </div>
              <div className="prose max-w-none">
                <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {cleanedTranscript}
                </div>
              </div>
            </div>

            {/* Raw Transcript (Collapsible) */}
            {rawTranscript && (
              <details className="bg-slate-50 rounded-lg shadow-sm">
                <summary className="cursor-pointer p-6 font-medium text-slate-700 hover:text-slate-900">
                  View Raw Transcript ({rawTranscript.split(' ').length} words)
                </summary>
                <div className="px-6 pb-6">
                  <div className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                    {rawTranscript}
                  </div>
                </div>
              </details>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            This demo uses{' '}
            <span className="font-medium">youtube-transcript</span> library for native transcripts
            and falls back to{' '}
            <span className="font-medium">OpenAI Whisper</span> when unavailable.
          </p>
          <p className="mt-1">
            Transcripts are cleaned using{' '}
            <span className="font-medium">Claude AI</span> to remove ads and video-specific content.
          </p>
        </div>
      </div>
    </div>
  );
}

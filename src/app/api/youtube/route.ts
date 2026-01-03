import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Get video info using yt-dlp
async function getVideoInfo(videoUrl: string): Promise<{ title: string; duration: number; id: string }> {
  try {
    const output = execSync(
      `yt-dlp --dump-json "${videoUrl}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    const info = JSON.parse(output);
    return {
      title: info.title,
      duration: info.duration,
      id: info.id,
    };
  } catch (error) {
    throw new Error(`Failed to get video info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Download audio using yt-dlp
async function downloadAudio(videoUrl: string, outputPath: string): Promise<void> {
  const command = `yt-dlp -x --audio-format mp3 --audio-quality 5 -o "${outputPath}" "${videoUrl}"`;

  await execAsync(command, { maxBuffer: 50 * 1024 * 1024 });
}

// Download audio from YouTube and transcribe with Whisper
async function transcribeWithWhisper(videoUrl: string): Promise<{ transcript: string; title: string }> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Get video info
  const info = await getVideoInfo(videoUrl);
  console.log(`🎙️ Using Whisper for: ${info.title} (${Math.floor(info.duration / 60)}m ${info.duration % 60}s)`);
  console.log(`💰 Estimated cost: $${(info.duration / 60 * 0.006).toFixed(4)}`);

  // Create temp file in OS temp directory
  const tempFile = path.join(os.tmpdir(), `whisper_audio_${Date.now()}.mp3`);

  try {
    // Download audio with yt-dlp
    console.log('📥 Downloading audio with yt-dlp...');
    await downloadAudio(videoUrl, tempFile);
    console.log('✅ Audio downloaded, sending to Whisper...');

    // Transcribe with Whisper
    const audioFile = fs.createReadStream(tempFile);
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'text',
    });

    console.log('✅ Whisper transcription complete');

    return {
      transcript: transcription,
      title: info.title,
    };
  } finally {
    // Cleanup temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

export async function POST(request: Request) {
  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
  }

  // Track which method was used
  let transcript = '';
  let title = `YouTube Video ${videoId}`;

  try {
    // STEP 1: Try to get native YouTube transcript first
    console.log('📝 Attempting to fetch native YouTube transcript...');
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

    if (transcriptItems && transcriptItems.length > 0) {
      transcript = transcriptItems
        .map(item => item.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (transcript.length >= 50) {
        console.log('✅ Native transcript found');
        return NextResponse.json({
          content: transcript,
          title,
          usedWhisper: false,
        });
      }
    }

    throw new Error('Native transcript unavailable or too short');

  } catch (nativeError) {
    // STEP 2: Fall back to Whisper if native transcript failed
    console.log('⚠️ Native transcript unavailable, checking for Whisper fallback...');

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'No transcript available for this video, and OpenAI API key is not configured for Whisper fallback.',
      }, { status: 500 });
    }

    // Check if yt-dlp is available
    try {
      execSync('which yt-dlp', { encoding: 'utf-8' });
    } catch {
      return NextResponse.json({
        error: 'No transcript available. Whisper fallback requires yt-dlp to be installed (brew install yt-dlp).',
      }, { status: 500 });
    }

    try {
      console.log('🎙️ Falling back to OpenAI Whisper...');
      const whisperResult = await transcribeWithWhisper(url);

      transcript = whisperResult.transcript;
      title = whisperResult.title;

      if (!transcript || transcript.length < 50) {
        throw new Error('Whisper transcription was empty or too short');
      }

      return NextResponse.json({
        content: transcript,
        title,
        usedWhisper: true,
      });

    } catch (whisperError: unknown) {
      console.error('❌ Whisper transcription failed:', whisperError);

      let errorMessage = 'Failed to transcribe video';
      if (whisperError instanceof Error) {
        if (whisperError.message.includes('API key')) {
          errorMessage = 'Invalid OpenAI API key for Whisper transcription';
        } else if (whisperError.message.includes('rate limit')) {
          errorMessage = 'OpenAI rate limit reached. Please try again later.';
        } else {
          errorMessage = `Whisper transcription failed: ${whisperError.message}`;
        }
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  }
}

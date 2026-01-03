# YouTube Transcript Extractor Demo

A simple Next.js application that extracts transcripts from YouTube videos and cleans them using AI. The app supports both native YouTube transcripts and falls back to OpenAI Whisper when transcripts aren't available.

## Features

- ✅ **Native YouTube Transcripts** - Uses `youtube-transcript` library to fetch existing captions
- ✅ **Whisper Fallback** - Automatically uses OpenAI Whisper API when native transcripts aren't available
- ✅ **AI-Powered Cleaning** - Uses Claude AI to remove ads, sponsors, and video-specific content
- ✅ **Clean UI** - Simple, responsive interface built with Tailwind CSS
- ✅ **Word Count** - Shows word count for both raw and cleaned transcripts
- ✅ **Collapsible Raw Transcript** - View original transcript for comparison

## Tech Stack

- **Next.js 14.2** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Anthropic Claude AI** - Transcript cleaning
- **youtube-transcript** - Native transcript extraction
- **OpenAI Whisper** - Audio transcription fallback
- **yt-dlp** - Audio download for Whisper processing

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Anthropic API Key** (required) - Get from [Anthropic Console](https://console.anthropic.com)
3. **OpenAI API Key** (optional, for Whisper fallback) - Get from [OpenAI Platform](https://platform.openai.com)
4. **yt-dlp** (optional, for Whisper fallback) - Install with `brew install yt-dlp` on macOS

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd youtube-transcript-demo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

4. **Edit `.env.local` and add your API keys:**
   ```env
   # Required for transcript cleaning
   ANTHROPIC_API_KEY=sk-ant-your-key-here

   # Optional - only needed for Whisper fallback
   OPENAI_API_KEY=sk-your-key-here
   ```

## Usage

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Enter a YouTube URL:**
   - Paste any YouTube video URL (e.g., `https://www.youtube.com/watch?v=VIDEO_ID`)
   - Click "Extract Transcript"
   - Wait for the app to fetch and clean the transcript

4. **View results:**
   - See the cleaned, AI-processed transcript
   - Check if it used native transcript or Whisper
   - Expand the raw transcript section to compare

## How It Works

### Step 1: Transcript Extraction

The app first tries to fetch the native YouTube transcript:

```
YouTube URL → youtube-transcript library → Raw Transcript
```

If no native transcript is available, it falls back to Whisper:

```
YouTube URL → yt-dlp (download audio) → OpenAI Whisper API → Raw Transcript
```

### Step 2: AI Cleaning

The raw transcript is sent to Claude AI with instructions to:

- Remove video-specific references ("subscribe", "like", "watch", etc.)
- Remove advertisements and sponsor mentions
- Remove chatter and off-topic content
- Fix grammar and punctuation
- Organize into clear paragraphs

```
Raw Transcript → Claude AI → Cleaned Transcript
```

## API Routes

### `/api/youtube`

**POST** - Extract transcript from YouTube video

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**
```json
{
  "content": "transcript text...",
  "title": "Video Title",
  "usedWhisper": false
}
```

### `/api/anthropic`

**POST** - Process content with Claude AI

**Request:**
```json
{
  "content": "raw transcript...",
  "task": "instructions for Claude..."
}
```

**Response:**
```json
{
  "result": "cleaned transcript..."
}
```

## Cost Considerations

### Native Transcripts (Free)
When videos have native YouTube captions, extraction is free and instant.

### Whisper Fallback (Paid)
- **Cost:** $0.006 per minute of audio
- **Example:** 10-minute video = ~$0.06
- The app shows estimated cost in console logs before processing

### Claude AI (Paid)
- **Model:** Claude Sonnet 4.5
- **Cost:** ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
- **Average:** $0.05-$0.15 per transcript cleaning

## Troubleshooting

### "No transcript available"
- The video doesn't have native captions
- Add `OPENAI_API_KEY` to enable Whisper fallback
- Install `yt-dlp` with `brew install yt-dlp`

### "Anthropic API key not configured"
- Make sure you added `ANTHROPIC_API_KEY` to `.env.local`
- Restart the development server after adding the key

### "Failed to transcribe video"
- Check that `yt-dlp` is installed: `which yt-dlp`
- Verify your OpenAI API key is valid
- Check the video is publicly accessible

### Build errors
```bash
# Clear Next.js cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

## Project Structure

```
youtube-transcript-demo/
├── src/
│   └── app/
│       ├── api/
│       │   ├── youtube/
│       │   │   └── route.ts       # YouTube transcript extraction
│       │   └── anthropic/
│       │       └── route.ts       # Claude AI processing
│       ├── page.tsx               # Main UI
│       ├── layout.tsx             # Root layout
│       └── globals.css            # Global styles
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── .env.example
└── README.md
```

## Customization

### Change AI Cleaning Instructions

Edit the task prompt in `src/app/page.tsx` (lines ~60-80):

```typescript
task: `Your custom instructions here...`
```

### Adjust Styling

Modify Tailwind classes in `src/app/page.tsx` or add custom CSS to `src/app/globals.css`.

### Change Claude Model

Edit `src/app/api/anthropic/route.ts`:

```typescript
model: "claude-sonnet-4-5-20250929" // or another model
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## License

MIT - Feel free to use this code in your own projects!

## Credits

Extracted from the ZenBlog project - an AI-powered blog content generation tool.

**Libraries used:**
- [youtube-transcript](https://www.npmjs.com/package/youtube-transcript) - Native transcript fetching
- [OpenAI Node SDK](https://github.com/openai/openai-node) - Whisper API client
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) - Claude AI client
- [Next.js](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS

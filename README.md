# Nano Banana Pro

An advanced AI image generator powered by Google's Gemini 3 Pro Image model.

## Features

- **Advanced Prompting**: Large text area for detailed descriptions.
- **Style Controls**: Choose from various artistic styles (Photo, 3D, Illustration, etc.).
- **Size Presets**: 11+ presets including standard social media formats and 2K resolution.
- **Reference Images**: Upload multiple reference images to guide the generation.
- **Fixed Objects**: Keep specific elements (Logo, Product, Character) consistent across generations.
- **History**: View your past generations.
- **Credit System**: Daily credit limits (mock implementation).
- **Safe Mode**: Toggle safety filters.

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4, Framer Motion.
- **Backend**: Next.js API Routes.
- **Database**: SQLite (better-sqlite3).
- **AI**: Google Gemini API (`gemini-3-pro-image-preview`).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database

The application uses a local SQLite database (`nano_banana.db`) which is automatically created on the first run.

## License

MIT

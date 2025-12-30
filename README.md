# Qur'an Recitation Competition Portal

A web-based platform for conducting Qur'an recitation competitions where students can register, submit their recitations, judges can evaluate submissions, and results can be published through a controlled public leaderboard.

## Features

- **Student Registration**: Complete registration form with personal details, address, and parent/guardian information
- **Video Upload**: Upload recitation videos with automatic compression using FFmpeg
- **S3 Integration**: Secure video storage on Amazon S3 using presigned URLs
- **Form Validation**: Comprehensive client-side validation using Zod and React Hook Form
- **Responsive Design**: Modern, mobile-friendly UI built with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- AWS S3 bucket with appropriate credentials
- (Optional) MySQL database for storing registration data

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd quran-competition-portal
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create a `.env.local` file in the root directory with the following variables:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET_NAME=your_s3_bucket_name

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
quran-competition-portal/
├── app/
│   ├── api/
│   │   ├── student/
│   │   │   └── register/     # Student registration API
│   │   └── upload/            # S3 presigned URL generation
│   ├── student/
│   │   └── register/          # Student registration page
│   └── page.tsx               # Home page
├── components/
│   └── VideoUpload.tsx        # Video upload component with compression
└── ...
```

## Student Registration Flow

1. Student fills out the registration form with:

   - Personal information (name, email, phone, date of birth, category)
   - Address information
   - Parent/Guardian information

2. Student uploads a video file:

   - Video is automatically compressed using FFmpeg.wasm
   - Compression reduces file size while maintaining quality
   - Supports MP4, WebM, and QuickTime formats

3. On submission:
   - System generates a presigned S3 URL
   - Compressed video is uploaded directly to S3
   - Registration data is saved (database integration pending)

## Video Compression

The application uses FFmpeg.wasm for client-side video compression:

- Codec: H.264 (libx264)
- Quality: CRF 28 (good balance between quality and size)
- Resolution: Max width 1280px (maintains aspect ratio)
- Audio: AAC at 128kbps

## Environment Variables

Required environment variables:

- `AWS_REGION`: AWS region for S3 bucket
- `AWS_ACCESS_KEY_ID`: AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `AWS_S3_BUCKET_NAME`: Name of your S3 bucket
- `NEXT_PUBLIC_APP_URL`: Application URL (for development: http://localhost:3000)

## Next Steps

- [ ] Implement database integration (MySQL)
- [ ] Add email notification system
- [ ] Implement judge authentication and evaluation system
- [ ] Add admin dashboard
- [ ] Implement public leaderboard
- [ ] Add HLS streaming for video playback

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [AWS S3 SDK](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-examples.html)

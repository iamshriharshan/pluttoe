# Pluto - Production Deployment Guide

## Overview
Pluto is a GTM-focused freelancer platform connecting Go-To-Market specialists with startups. This guide covers production deployment, security setup, and architecture.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth
- **Styling**: Tailwind CSS + ShadCN UI
- **Deployment**: Vercel

## Architecture

### Database Schema

#### Users Collection
```typescript
users/{uid}
  - email: string
  - displayName: string
  - role: "freelancer" | "startup"
  - createdAt: timestamp
  - updatedAt: timestamp
```

#### Freelancers Collection
```typescript
freelancers/{uid}
  - fullName: string
  - skills: string[]
  - yearsOfExperience: number
  - github?: string
  - linkedin?: string
  - portfolioUrl?: string
  - resumeUrl?: string
  - hourlyRate?: number
  - applicationHistory: ApplicationRecord[]
  - approvedStartups: string[]
```

#### Startups Collection
```typescript
startups/{uid}
  - companyName: string
  - industry: string
  - website?: string
  - teamSize: number
  - logoUrl?: string
  - opportunitiesPosted: OpportunityPosting[]
  - likedFreelancers: string[]
```

#### AI Recommendations Collection
```typescript
ai_recommendations/{id}
  - startupId: string
  - freelancerId: string
  - opportunityId?: string
  - totalScore: number (0-100)
  - breakdown: {
      skillsMatch: number,      // 40%
      experienceMatch: number,  // 25%
      budgetCompatibility: number, // 20%
      industryRelevance: number // 15%
    }
  - details: { ... }
  - createdAt: timestamp
  - updatedAt: timestamp
```

## Firestore Security Rules

Copy the rules from `lib/firestore-rules.ts` to your Firebase Console:

1. Go to Firebase Console > Firestore > Rules
2. Replace with the rules from `lib/firestore-rules.ts`
3. Publish

Key security features:
- Authenticated users only
- Users can only read/write their own profile
- AI recommendations only readable by relevant parties
- Chat messages end-to-end access
- Applications protected by role

## Deployment to Vercel

### Prerequisites
1. Vercel account (free)
2. Firebase project
3. GitHub repository with this code

### Steps

1. **Connect Repository**
   ```
   1. Go to vercel.com
   2. Click "New Project"
   3. Import your GitHub repository
   ```

2. **Configure Environment Variables**
   ```
   In Vercel Dashboard > Project Settings > Environment Variables:
   
   NEXT_PUBLIC_FIREBASE_API_KEY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   NEXT_PUBLIC_FIREBASE_PROJECT_ID
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   NEXT_PUBLIC_FIREBASE_APP_ID
   ```

3. **Deploy**
   ```
   - Vercel auto-deploys on push to main
   - Preview deployments for PRs
   - Production deployment after merge
   ```

4. **Configure Domain**
   ```
   1. In Vercel > Project Settings > Domains
   2. Add your custom domain
   3. Update Firebase authentication domain
   ```

## Firebase Configuration

### 1. Create Firebase Project
```
1. Go to firebase.google.com
2. Click "Create Project"
3. Enable Firestore, Authentication, and Storage
```

### 2. Enable Authentication Methods
```
Firebase Console > Authentication > Sign-in method:
- Email/Password
- Google (recommended)
- GitHub (optional)
```

### 3. Set Up Firestore Database
```
1. Firebase Console > Firestore Database
2. Create database in test mode (update rules after)
3. Start collection structure manually or use provided seed data
```

### 4. Configure Storage
```
1. Firebase Console > Storage
2. Create bucket
3. Set up CORS for your domain:

[
  {
    "origin": ["https://yourdomain.com", "http://localhost:3000"],
    "method": ["GET", "HEAD", "DELETE", "PUT", "POST"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

## Local Development

1. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/pluto.git
   cd pluto
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Firebase credentials
   ```

4. **Run Dev Server**
   ```bash
   npm run dev
   ```

5. **Open Browser**
   ```
   http://localhost:3000
   ```

## Production Checklist

- [ ] Firebase security rules deployed
- [ ] Environment variables set in Vercel
- [ ] Custom domain configured
- [ ] SSL certificate enabled (Vercel auto)
- [ ] Database backups enabled
- [ ] Error tracking set up (optional: Sentry)
- [ ] Analytics enabled (optional: Google Analytics)
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Monitoring alerts set up

## AI Matching Engine

### Algorithm
Scores freelancers based on opportunity match:
- **40%** - Skills match (keywords + required skills)
- **25%** - Experience match (years + project duration)
- **20%** - Budget compatibility (hourly rate vs budget)
- **15%** - Industry relevance (domain expertise)

### How It Works
1. Startup posts opportunity
2. Backend calculates scores for all freelancers
3. Results stored in `ai_recommendations` collection
4. Sorted by score (descending) for display

### Formula
```
totalScore = (skillsMatch * 0.4) + 
             (experienceMatch * 0.25) + 
             (budgetCompatibility * 0.2) + 
             (industryRelevance * 0.15)
```

## File Upload System

### Storage Paths
- Resumes: `resumes/{userId}/{timestamp}_filename`
- Portfolio: `portfolio/{userId}/{timestamp}_filename`
- Logos: `logos/{userId}/{timestamp}_filename`

### Validation
- Max file size: 10MB
- Allowed types: PDF, DOC, DOCX, JPG, JPEG, PNG
- Progress tracking during upload
- Automatic URL storage in Firestore

## Route Protection

### Protected Routes
- `/profile/*` - Authenticated users only
- `/dashboard/*` - Authenticated users only
- `/settings` - Own profile only

### Role-Based Routes
- `/freelancer/*` - Freelancers only
- `/startup/*` - Startups only

## Error Handling

- **Error Boundary**: Catches React errors
- **Toast Notifications**: User feedback
- **Skeleton Loaders**: Loading states
- **Empty States**: No data scenarios
- **Fallback Pages**: 404, 500 errors

## Monitoring & Analytics

### Recommended Tools
1. **Error Tracking**: Sentry
2. **Analytics**: Google Analytics 4
3. **Performance**: Vercel Analytics
4. **Logs**: Firebase Logging

### Key Metrics
- User signups/logins
- Profile completeness
- Application submissions
- Chat conversations initiated
- File uploads

## Performance Optimization

- Image optimization with Next.js Image
- Code splitting per route
- Server-side rendering where beneficial
- Client-side caching
- Firebase indexes for common queries
- CDN for static assets (Vercel)

## Troubleshooting

### Firebase API Key Invalid
```
- Check NEXT_PUBLIC_FIREBASE_API_KEY in .env.local
- Verify Firebase project has required APIs enabled
- Ensure domain is authorized in Firebase Console
```

### Authentication Issues
```
- Clear browser cache
- Check Firebase authentication domain settings
- Verify session cookies
```

### Storage Upload Fails
```
- Check Firebase Storage security rules
- Verify file size limits
- Check CORS configuration
- Test with different file types
```

## API Routes (Optional)

For backend operations:
- AI recommendation generation
- Email notifications
- Webhook handlers
- Rate limiting

See `api/` directory for examples.

## Contact & Support

- GitHub Issues: Report bugs
- Documentation: Full API docs in `docs/`
- Email: support@pluto.example

---

**Last Updated**: 2024
**Version**: 1.0.0

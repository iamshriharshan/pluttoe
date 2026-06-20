# Pluto - GTM Specialist Matching Platform

A premium, minimalist platform connecting Go-To-Market specialists with startups. Startups post opportunities, freelancers apply, and AI matching facilitates connections.

## ✨ Key Features

### For Freelancers
- Complete profile with skills, experience, portfolio
- Resume & portfolio file uploads
- Application history tracking
- AI-powered opportunity recommendations
- Chat with approved startups
- Public profile sharing

### For Startups
- Company profile showcase
- Post unlimited GTM opportunities
- AI-recommended freelancer matches
- Chat with interested freelancers
- Applicant management

### AI Matching Engine
Scores freelancers on opportunities:
- **40%** Skills Match
- **25%** Experience Match  
- **20%** Budget Compatibility
- **15%** Industry Relevance

## 🛠 Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + ShadCN UI
- Firebase (Firestore, Auth, Storage)
- Vercel (Deployment)

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <repository>
cd pluto
npm install
```

### 2. Firebase Setup
Go to firebase.google.com and create project with:
- Firestore Database
- Authentication (Email + Google)
- Storage

### 3. Environment Variables
```bash
cp .env.example .env.local
# Fill in Firebase credentials
```

### 4. Run Locally
```bash
npm run dev
# Open http://localhost:3000
```

## 📁 Project Structure

```
app/
├── (auth)/           # Login/signup
├── profile/[id]/     # Profiles
├── dashboard/        # Dashboards
└── layout.tsx

components/
├── ui/              # ShadCN components
├── file-upload.tsx
├── error-boundary.tsx
└── skeletons.tsx

lib/
├── firebase.ts       # Config
├── firestore.ts      # DB operations
├── ai-matching.ts    # Scoring engine
└── env-validation.ts

types/
└── index.ts         # Interfaces

contexts/
└── AuthContext.tsx  # Auth state
```

## 🗄️ Database Schema

- `users/{uid}` - Base user data
- `freelancers/{uid}` - Freelancer profiles
- `startups/{uid}` - Startup profiles
- `ai_recommendations/{id}` - Match scores
- `applications/{id}` - Applications
- `chat_conversations/{id}` - Chats

## 🌐 Production Deployment

### Vercel
1. Connect GitHub to Vercel
2. Add Firebase environment variables
3. Deploy (auto on push)

### Firebase Security
Update Firestore rules with rules from `lib/firestore-rules.ts`

### Configure Domain
- Update Firebase domain settings
- Add CORS configuration
- SSL auto-enabled

See `DEPLOYMENT_GUIDE.md` for full details.

## 📤 File Uploads

- Resume: PDF, DOC, DOCX (5MB max)
- Portfolio: All docs (10MB max)
- Logo: JPG, PNG (10MB max)

Stored in Firebase Storage + URLs in Firestore.

## 🔒 Security

- ✅ Firestore security rules
- ✅ Route protection (auth + role)
- ✅ Error boundaries
- ✅ Input validation
- ✅ CORS configured
- ✅ Environment validation

## 🎨 UI Philosophy

Minimalist + Premium + Fast + Accessible

## 📝 Available Scripts

```bash
npm run dev     # Dev server
npm run build   # Production build
npm start       # Run production
npm run lint    # ESLint
```

## 📊 Performance

- Code splitting per route
- Image optimization
- Client + CDN caching
- Firestore indexes
- Vercel Analytics

## 🐛 Error Handling

- Error Boundary
- Empty States
- Skeleton Loaders
- Toast Notifications
- Environment Validation

## 📚 Documentation

- `DEPLOYMENT_GUIDE.md` - Full setup guide
- `CLAUDE.md` - AI instructions
- `AGENTS.md` - Agent configuration

## 📞 Support

- 🐛 GitHub Issues
- 💬 GitHub Discussions
- 📖 See DEPLOYMENT_GUIDE.md

---

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: June 2024

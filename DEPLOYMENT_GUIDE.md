# Nyagatare Secondary School - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm installed
- Modern web browser

### Local Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## 📁 Project Structure

```
/
├── public/
│   ├── images/           # School photos and event images
│   └── assets/          # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Route pages
│   ├── lib/            # Utilities
│   └── hooks/          # Custom React hooks
├── DEPLOYMENT_GUIDE.md # This file
└── DATABASE_SCHEMA.sql # Database setup (see below)
```

## 🔗 Navigation & Routes

The application includes the following routes:
- `/` - Homepage with school information
- `/enroll` or `/enrollment` - Student enrollment application
- `/events` - School events and calendar
- `/admin` - Admin dashboard (authentication needed)
- `*` - 404 Not Found page

## 🖼️ Required Images

Replace placeholder images in `public/images/` with actual school photos:

### Existing Images (provided)
- `Lab.jpg` - Science laboratory
- `ParentTeacherMeeting.jpg` - Parent meetings
- `STEMFair.jpg` - STEM activities

### Missing Images (need to be added)
- `sports.jpg` - School sports activities
- `graduation.jpg` - Graduation ceremonies
- `cultural-day.jpg` - Cultural celebrations

## 🗄️ Database Requirements

### Option 1: Static Website (No Database)
For a simple brochure website without enrollment functionality:
- Deploy as-is to Netlify, Vercel, or GitHub Pages
- Forms will need external service (Formspree, Netlify Forms, etc.)

### Option 2: Full Functionality with Database
For complete enrollment and admin features, you'll need:

1. **Firebase Setup** (Recommended)
   - Create a Firebase project
   - Enable Firebase Authentication for admin accounts
   - Create a Firestore database
   - Add the collections used by the app: `applications`, `events`, `donations`, `board_members`, `students`
   - Update environment variables

2. **Custom Backend**
   - PostgreSQL or MySQL database
   - Node.js/Express server
   - File upload handling

## 🚀 Deployment Options

### Option 1: Netlify (Recommended for Static)
```bash
# Build the project
pnpm run build

# Deploy dist/ folder to Netlify
# Or connect GitHub repository for auto-deployment
```

### Option 2: Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 3: Traditional Web Hosting
```bash
# Build the project
pnpm run build

# Upload contents of dist/ folder to web server
```

## 🔧 Configuration

### Environment Variables
Create `.env.local` for local development:

```env
# For Firebase integration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_ADMIN_EMAILS=admin1@example.com,admin2@example.com

# For contact forms
VITE_CONTACT_EMAIL=admissions@nyagataress.edu.rw

# For donations (if implementing Stripe)
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

### Site Configuration
Update the following files with school-specific information:

1. `index.html` - Update title and meta tags
2. `src/components/Footer.tsx` - Contact information
3. `src/pages/Index.tsx` - School details and programs
4. /images/logo.jpg` - School logo

## 📧 Email & Forms

### Contact Forms
Current forms are UI-only. To make them functional:

1. **Netlify Forms** (Easiest)
   - Add `netlify` attribute to forms
   - Forms automatically work on Netlify

2. **Formspree**
   - Create account at formspree.io
   - Update form action URLs

3. **Custom Backend**
   - Implement form handlers
   - Set up email service (SendGrid, Mailgun)

### Enrollment Applications
For full enrollment functionality:
- Database integration required
- File upload handling
- Email notifications
- Admin review system

## 🔐 Admin Dashboard

The admin dashboard (`/admin`) now expects Firebase Authentication plus Firestore collections.

1. Create the admin users in Firebase Authentication
2. Add approved admin emails through `VITE_ADMIN_EMAILS`
3. Configure Firestore security rules for the admin collections
4. Seed the collections with your school data

## 📱 Mobile Optimization

The site is fully responsive and mobile-optimized:
- Touch-friendly navigation
- Optimized images
- Fast loading times
- Accessible design

## 🔍 SEO & Performance

Implemented features:
- Semantic HTML structure
- Meta tags for social sharing
- Optimized images
- Fast loading times

To improve further:
- Add structured data markup
- Implement service worker for offline functionality
- Add Google Analytics
- Set up Google Search Console

## 🆘 Support & Maintenance

### Regular Updates
- Keep dependencies updated: `pnpm update`
- Monitor site performance
- Update content regularly
- Backup database (if using)

### Troubleshooting
- Check browser console for errors
- Verify all images are properly uploaded
- Test forms and navigation
- Monitor server logs (if using backend)

### Getting Help
If you need assistance with deployment or customization:
1. Check this guide first
2. Review the code comments
3. Test on different devices/browsers
4. Contact your development team

---

**Project Status**: ✅ Ready for Deployment
**Last Updated**: August 2025
**Recommended Next Steps**: Add real school images and deploy to hosting service

# 🚀 Quick Start Guide - AI Recruitment Screening Platform

## Prerequisites

Before you begin, ensure you have:
- **Node.js** v18 or higher
- **MongoDB** (local or MongoDB Atlas)
- **OpenAI API Key** (get one at https://platform.openai.com)
- **Email SMTP credentials** (Gmail, SendGrid, etc.)

---

## 📦 Installation

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd MYAPP

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## ⚙️ Configuration

### 2. Backend Environment Setup

Create `backend/.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/recruitment
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/recruitment

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
OPENAI_MAX_COMPLETION_TOKENS=1200
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_CV_MODEL=gpt-4o-mini

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=noreply@yourcompany.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important Notes:**
- **Gmail Users:** Enable 2FA and create an [App Password](https://myaccount.google.com/apppasswords)
- **OpenAI API:** Free tier has rate limits. The platform has a fallback system.
- **JWT_SECRET:** Use a strong random string in production

### 3. Frontend Environment Setup

Create `frontend/.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

---

## 🗄️ Database Setup

### 4. Initialize MongoDB

```bash
# If using local MongoDB, start the service
# Windows:
net start MongoDB

# macOS/Linux:
sudo systemctl start mongod

# Create indexes for better performance
cd backend
node scripts/createIndexes.js
```

---

## 🎬 Running the Application

### 5. Start Backend Server

```bash
cd backend
npm run dev
# Server will start on http://localhost:5000
```

You should see:
```
✓ MongoDB connected successfully
✓ Server running on port 5000
```

### 6. Start Frontend Development Server

Open a new terminal:

```bash
cd frontend
npm run dev
# Frontend will start on http://localhost:5173
```

---

## 👤 Create Your First Users

### 7. Create an HR Account

1. Open browser: http://localhost:5173
2. Click **Sign Up**
3. Fill in the form:
   - First Name: John
   - Last Name: Doe
   - Email: hr@company.com
   - Password: Test@1234
   - Role: **HR** (select from dropdown)
4. Click **Create Account**

### 8. Create a Candidate Account

1. Click **Sign Up** again
2. Fill in the form:
   - First Name: Jane
   - Last Name: Smith
   - Email: candidate@email.com
   - Password: Test@1234
   - Role: **Candidate**
3. Complete the onboarding wizard

---

## 🧪 Test the Platform

### 9. Create Your First Test (as HR)

1. Login as HR: hr@company.com
2. Navigate to **Tests** → **Create New Test**
3. Fill in test details:
   - Title: "React Developer Assessment"
   - Job Role: "Frontend Developer"
   - Description: "React, Hooks, Redux, TypeScript"
   - Time Limit: 30 minutes
4. Click **Save and Next**
5. Click **Generate with AI** (generates 5 questions automatically)
6. Review questions and click **Finish**

### 10. Take a Test (as Candidate)

1. Logout and login as: candidate@email.com
2. Navigate to **Careers** or **Tests**
3. Find the test you created
4. Click **Apply** or **Take Test**
5. Answer the questions
6. Submit the test

### 11. View Results (as HR)

1. Login as HR again
2. Navigate to **Results**
3. See the candidate's submission with:
   - Overall score
   - AI-generated feedback
   - Competency breakdown
4. Try the **Compare** feature with multiple candidates
5. Export results to Excel or PDF

---

## 🎯 Key Features to Explore

### For HR/Recruiters:

1. **Question Bank** (`/rh/question-bank`)
   - Create reusable questions
   - Tag questions by technology
   - Attach to multiple tests

2. **Test Management** (`/rh/tests/edit/:id`)
   - Configure scoring weights
   - Set evaluation criteria for AI
   - Generate invite codes for private tests
   - Regenerate questions with AI

3. **Pipeline** (`/rh/pipeline`)
   - Drag-and-drop candidates through stages
   - Add notes and schedule interviews
   - Track hiring progress

4. **Analytics** (`/rh/analytics`)
   - View submission trends
   - Analyze score distributions
   - Track performance metrics

### For Candidates:

1. **Job Search** (`/careers`)
   - Browse available positions
   - Filter by location, type, category
   - Save favorite jobs

2. **My Applications** (`/mes-candidatures`)
   - Track application status
   - View test results
   - Access interview links

3. **Profile** (`/profile`)
   - Upload CV (AI will analyze it)
   - Update skills and preferences
   - Get job recommendations

---

## 🔧 Troubleshooting

### Common Issues:

**1. MongoDB Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Start MongoDB service or check MONGODB_URI in .env

**2. OpenAI API Error (429 - Rate Limit)**
```
OpenAI quota exceeded, using fallback question generator
```
**Solution:** This is normal for free tier. Fallback questions will be used automatically.

**3. Email Not Sending**
```
Error: Invalid login
```
**Solution:** 
- For Gmail: Enable 2FA and create App Password
- Check SMTP credentials in .env
- Verify SMTP_HOST and SMTP_PORT

**4. Frontend Can't Connect to Backend**
```
Network Error
```
**Solution:** 
- Ensure backend is running on port 5000
- Check VITE_API_URL in frontend/.env
- Check CORS settings in backend/app.js

**5. WebSocket Connection Failed**
```
WebSocket connection failed
```
**Solution:** Check VITE_WS_URL in frontend/.env

---

## 📱 Testing Different Roles

### Create Test Accounts:

```javascript
// You can create accounts via the signup page or directly in MongoDB

// HR Account
{
  email: "hr@company.com",
  password: "Test@1234",
  role: "HR",
  firstName: "John",
  lastName: "Doe"
}

// Candidate Account
{
  email: "candidate@email.com",
  password: "Test@1234",
  role: "candidat",
  firstName: "Jane",
  lastName: "Smith"
}

// Admin Account (for full access)
{
  email: "admin@company.com",
  password: "Admin@1234",
  role: "admin",
  firstName: "Admin",
  lastName: "User"
}
```

---

## 🎨 Customization

### Change Theme Colors

Edit `frontend/src/App.jsx`:

```javascript
theme={{
  token: {
    colorPrimary: '#0f766e',  // Change primary color
    colorSuccess: '#16a34a',  // Change success color
    // ... other colors
  }
}}
```

### Modify AI Behavior

Edit `backend/utils/openai.js`:

```javascript
// Change question generation ratio
const qcmCount = Math.ceil(n * 0.7);  // 70% QCM
const shortCount = n - qcmCount;       // 30% open-ended

// Change AI model
model: 'gpt-4o-mini'  // or 'gpt-3.5-turbo'

// Adjust temperature for creativity
temperature: 0.7  // 0.0 = deterministic, 1.0 = creative
```

---

## 📊 Monitoring & Logs

### View Backend Logs

```bash
cd backend
npm run dev
# Logs will show in terminal
```

### Check MongoDB Data

```bash
# Using MongoDB Compass (GUI)
# Connect to: mongodb://localhost:27017

# Or using mongo shell
mongosh
use recruitment
db.tests.find()
db.submissions.find()
db.users.find()
```

---

## 🚀 Production Deployment

### Prepare for Production:

1. **Update Environment Variables**
   ```env
   NODE_ENV=production
   FRONTEND_URL=https://yourdomain.com
   MONGODB_URI=mongodb+srv://...  # Use MongoDB Atlas
   ```

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   # Output in frontend/dist/
   ```

3. **Security Checklist**
   - ✅ Change JWT_SECRET to a strong random string
   - ✅ Enable HTTPS/SSL
   - ✅ Configure CORS for your domain
   - ✅ Set up rate limiting
   - ✅ Enable MongoDB authentication
   - ✅ Use environment-specific API keys

4. **Deploy Options**
   - **Backend:** Heroku, Railway, DigitalOcean, AWS
   - **Frontend:** Vercel, Netlify, Cloudflare Pages
   - **Database:** MongoDB Atlas (free tier available)

---

## 📚 Additional Resources

- **OpenAI API Docs:** https://platform.openai.com/docs
- **MongoDB Docs:** https://docs.mongodb.com
- **Ant Design:** https://ant.design
- **React Router:** https://reactrouter.com

---

## 🆘 Getting Help

### Check Documentation:
- `IMPLEMENTATION_STATUS.md` - Full feature list and technical details
- `FEATURES_IMPLEMENTATION_PLAN.md` - Original feature planning
- `README.md` - Project overview

### Common Commands:

```bash
# Backend
npm run dev          # Start development server
npm test            # Run tests
npm start           # Start production server

# Frontend
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

---

## ✅ Success Checklist

After setup, you should be able to:

- [ ] Access frontend at http://localhost:5173
- [ ] Access backend API at http://localhost:5000/api
- [ ] Create HR and Candidate accounts
- [ ] Create a test with AI-generated questions
- [ ] Take a test as a candidate
- [ ] View results with AI feedback and scoring
- [ ] Export results to Excel/PDF
- [ ] Receive email notifications
- [ ] See real-time updates in dashboard

---

## 🎉 You're Ready!

Your AI-powered recruitment screening platform is now running!

**Next Steps:**
1. Explore all features as different user roles
2. Customize the platform for your needs
3. Add your company branding
4. Configure production environment
5. Deploy to production

**Happy Recruiting! 🚀**

---

*Last Updated: 2026-04-09*  
*Version: 1.0*
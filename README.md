<div align="center">
  <br/>
  <h1>Zero-Cost AI & Data Job Matcher</h1>
  <p>A completely automated, zero-cost job board that scrapes, cleans, and presents the best AI and Data Science roles in the United States from top tech companies.</p>

  [![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
  [![Python](https://img.shields.io/badge/Python-Scraper-3776AB?logo=python&logoColor=white)](https://python.org/)
  [![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-Automated-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
</div>

<br/>

## ✨ Features

- 🤖 **Automated Data Engine:** A custom Python scraping pipeline targeting hundreds of endpoints across **Greenhouse**, **Workday**, and **Lever**.
- ⏱️ **Zero-Maintenance Automation:** GitHub Actions runs the scraper every 3 hours on autopilot, syncing fresh roles instantly to the live database.
- 🧹 **Self-Cleaning Architecture:** Advanced regex filters strictly enforce USA-only locations and Data/AI roles. The system automatically deletes jobs older than 45 days, ensuring the Supabase storage remains strictly within the free tier.
- ⚡ **Lightning Fast Frontend:** A Next.js 14 client with smart in-memory deduplication (solving ATS cross-posting issues) and instant client-side filtering.
- 🎨 **Premium Glassmorphism UI:** A sleek, premium interface built with Tailwind CSS and Framer Motion. Features include animated radial gradients, responsive Job Cards for mobile, Clearbit company logos, and frosted-glass components.
- 📱 **Mobile-First Responsive:** Automatically transforms the complex desktop data table into a beautiful, thumb-friendly Card feed on smaller screens.

## 🛠️ Tech Stack

### Frontend Architecture
* **Framework:** Next.js 14 (React)
* **Styling:** Tailwind CSS (Glassmorphism & Gradients)
* **Animations:** Framer Motion
* **Icons & Logos:** Lucide React, Clearbit API

### Backend & Data Pipeline
* **Database:** Supabase (PostgreSQL)
* **Data Ingestion:** Python 3.10 (BeautifulSoup4, Requests, Regex)
* **CI/CD Automation:** GitHub Actions
* **Hosting:** Vercel

## 🚀 How It Stays 100% Free

Running a massive job board usually costs hundreds of dollars in database and compute fees. This project achieves $0/mo overhead by leveraging:
1. **GitHub Actions (Compute):** The Python scraper runs on GitHub's free runners every 3 hours.
2. **Supabase (Storage):** The database stays tiny by aggressively dropping unverified garbage roles, blocking duplicate URL insertions, and pruning 45-day-old listings.
3. **Vercel (Hosting):** The Next.js frontend is deployed securely and instantly via Vercel's generous hobby tier.
4. **Clearbit (Assets):** Company logos are dynamically fetched for free via the Clearbit Logo API.

## ⚙️ Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/spandanaS-git/ai-job-match.git
   cd ai-job-match
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role"
   ```

4. **Run the Frontend Server**
   ```bash
   npm run dev
   ```

5. **Run the Scraper (Optional)**
   ```bash
   cd scraper
   pip install requests beautifulsoup4 python-dotenv
   python scrape_jobs.py
   ```

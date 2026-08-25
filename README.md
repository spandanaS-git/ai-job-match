# AI Job Match

An automated, self-cleaning job board that aggregates the internet's best Data & AI roles from top technology companies.

## Features

- **Automated Triple-Scraper Engine:** A custom Python scraping pipeline that hits API endpoints for Greenhouse (Top Tech), Workday (Enterprises), and Lever (Startups). 
- **Auto-Cleaning Database:** The script automatically deletes jobs older than 45 days, keeping the Supabase storage tiny and 100% free forever.
- **Nightly Cloud Sync:** Triggered via GitHub Actions at midnight UTC to automatically sync new jobs into the database.
- **Client-Side Filtering:** An incredibly fast Next.js frontend with instant client-side filtering for Experience Level and Posting Date.
- **Premium UI:** Built with Tailwind CSS and Framer Motion for a sleek, dark-mode user experience.

## Tech Stack

- **Frontend:** Next.js (React), Tailwind CSS, Framer Motion
- **Backend/Database:** Supabase (PostgreSQL)
- **Scraper Engine:** Python, BeautifulSoup4, Requests
- **Automation:** GitHub Actions (cron)
- **Hosting:** Vercel

## Deployment

This platform is completely zero-maintenance and runs on free-tier infrastructure. Vercel hosts the website, Supabase hosts the data, and GitHub Actions handles the nightly scraping loop.

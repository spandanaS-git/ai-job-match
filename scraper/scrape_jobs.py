import os
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import re

# Load environment variables from the Next.js .env.local file
load_dotenv(dotenv_path='../.env.local')

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") 

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in ../.env.local")
    print("You must add SUPABASE_SERVICE_ROLE_KEY to your .env.local file to run the scraper!")
    exit(1)

# A list of top tech companies. The script will automatically skip any that don't use Greenhouse.
GREENHOUSE_BOARDS = [
    'pinterest', 'airbnb', 'dropbox', 'figma', 'reddit', 'openai', 'anthropic', 
    'databricks', 'snowflake', 'stripe', 'block', 'twilio', 'robinhood', 'coinbase', 
    'doordash', 'uber', 'lyft', 'instacart', 'spotify', 'zillow', 'docusign', 
    'zoom', 'slack', 'atlassian', 'hubspot', 'servicenow', 'workday', 'paloaltonetworks', 
    'crowdstrike', 'okta', 'zscaler', 'cloudflare', 'mongodb', 'splunk', 'elastic', 
    'datadog', 'newrelic', 'appdynamics', 'github', 'gitlab', 'hashicorp', 'pagerduty', 
    'fastly', 'wayfair', 'peloton', 'roblox', 'discord', 'canva', 'notion', 'asana',
    'brex', 'plaid', 'fivetran', 'gong', 'outreach', 'braze', 'ramp', 'rippling',
    'scaleai', 'anduril', 'verkada', 'toast', 'gusto', 'flexport', 'segment', 'confluent',
    'coursera', 'udemy', 'masterclass', 'skillshare', 'opendoor', 'redfin', 'sofi', 'chime',
    'betterment', 'wealthfront', 'cashapp', 'squarespace', 'wix', 'godaddy', 'mailchimp',
    'surveymonkey', 'eventbrite', 'glassdoor', 'yelp', 'tripadvisor', 'expedia', 'kayak',
    'zocdoc', 'teladoc', '23andme', 'color', 'tempus', 'grail', 'benchling', 'veeva',
    'flatironhealth', 'oscarhealth', 'lemonade', 'rootinsurance', 'strava', 'whoop', 'oura',
    'calm', 'headspace', 'minted', 'thumbtack', 'taskrabbit', 'rover', 'postmates', 'caviar',
    'grubhub', 'seamless', 'blueapron', 'hellofresh', 'sweetgreen', 'cava', 'warbyparker',
    'allbirds', 'glossier', 'casper', 'away', 'dollarshaveclub', 'renttherunway', 'stitchfix',
    'thredup', 'poshmark', 'depop', 'stockx', 'goat', 'grailed', 'vinted', 'letgo', 'offerup',
    'mercari', 'carousell', 'shopee', 'lazada', 'tokopedia', 'bukalapak', 'gojek', 'grab',
    'traveloka', 'deliveroo', 'justeat', 'foodpanda', 'swiggy', 'zomato', 'talabat', 'careem',
    'epicgames', 'unity', 'niantic', 'scopely', 'zynga', 'playrix', 'king', 'supercell',
    'riotgames', 'blizzard', 'electronicarts', 'take2', 'ubisoft', 'squareenix', 'capcom',
    'sega', 'bandainamco', 'konami', 'nintendo', 'sonyinteractive', 'xbox', 'twitch', 'patreon'
]

# High-profile Workday tenants
ASHBY_BOARDS = [
    'notion', 'vercel', 'linear', 'discord', 'ramp', 'brex', 'deel', 
    'drata', 'vanta', 'fivetran', 'gong', 'loom', 'gem', 'apollo', 'anthropic', 
    'cohere', 'replit', 'jasper', 'midjourney', 'stabilityai', 'huggingface',
    'pinecone', 'langchain', 'perplexity', 'character', 'inflection', 'adept',
    'runway', 'descript', 'synthesia', 'weightsandbiases', 'scale', 'snorkel',
    'cred', ' CRED', 'groww', 'upstox', 'coinbase', 'kraken', 'gemini'
]

WORKDAY_BOARDS = [
    { 'tenant': 'nvidia', 'board': 'NVIDIAExternalCareerSite', 'wd': 'wd5' },
    { 'tenant': 'salesforce', 'board': 'External_Career_Site', 'wd': 'wd1' },
    { 'tenant': 'workday', 'board': 'Workday', 'wd': 'wd5' },
    { 'tenant': 'netflix', 'board': 'Netflix_Careers', 'wd': 'wd1' },
    { 'tenant': 'target', 'board': 'targetcareers', 'wd': 'wd5' },
    { 'tenant': 'adobe', 'board': 'external', 'wd': 'wd5' },
    { 'tenant': 'mastercard', 'board': 'CorporateCareers', 'wd': 'wd3' },
    { 'tenant': 'dell', 'board': 'External', 'wd': 'wd1' },
    { 'tenant': 'generalmotors', 'board': 'Careers', 'wd': 'wd5' },
    { 'tenant': 'cornell', 'board': 'Cornell', 'wd': 'wd1' },
    { 'tenant': 'psu', 'board': 'psu', 'wd': 'wd1' },
    { 'tenant': 'usc', 'board': 'ExternalCareers', 'wd': 'wd5' },
    { 'tenant': 'osu', 'board': 'osu', 'wd': 'wd1' },
    { 'tenant': 'washington', 'board': 'uw', 'wd': 'wd5' },
    { 'tenant': 'yale', 'board': 'Yale_External', 'wd': 'wd5' },
    { 'tenant': 'harvard', 'board': 'Harvard', 'wd': 'wd5' },
    { 'tenant': 'stanford', 'board': 'Stanford', 'wd': 'wd1' },
    { 'tenant': 'mit', 'board': 'MIT', 'wd': 'wd1' },
    { 'tenant': 'bechtel', 'board': 'Bechtel_External_Career_Site', 'wd': 'wd1' },
    { 'tenant': 'mortenson', 'board': 'mortenson', 'wd': 'wd1' },
    { 'tenant': 'suffolk', 'board': 'suffolk', 'wd': 'wd1' },
    { 'tenant': 'aecom', 'board': 'aecom', 'wd': 'wd1' },
    { 'tenant': 'jacobs', 'board': 'jacobs', 'wd': 'wd1' },
    { 'tenant': 'fluor', 'board': 'fluor', 'wd': 'wd1' },
    { 'tenant': 'skanska', 'board': 'skanska', 'wd': 'wd3' },
    { 'tenant': 'ea', 'board': 'EA_External', 'wd': 'wd5' },
    { 'tenant': 'roblox', 'board': 'Roblox_Careers', 'wd': 'wd5' },
    { 'tenant': 'zoom', 'board': 'Zoom', 'wd': 'wd5' },
    { 'tenant': 'sony', 'board': 'Sony', 'wd': 'wd5' },
    { 'tenant': 'snapchat', 'board': 'Snap', 'wd': 'wd1' },
    { 'tenant': 'visa', 'board': 'Visa', 'wd': 'wd3' }
]

# Startup & Y-Combinator Lever tenants
LEVER_BOARDS = [
    'retool', 'zapier', 'yelp', 'quora', 'eventbrite', 'medium', 'hopper', 'substack',
    'kiva', 'gofundme', 'patreon', 'kickstarter', 'indiegogo', 'coursera', 'udacity',
    'duolingo', 'babbel', 'rosettestone', 'glossier', 'warbyparker', 'casper', 'peloton',
    'allbirds', 'away', 'everlane', 'renttherunway', 'stitchfix', 'thredup', 'poshmark',
    'depop', 'stockx', 'goat', 'grailed', 'vinted', 'letgo', 'offerup', 'mercari',
    'carousell', 'shopee', 'lazada', 'tokopedia', 'bukalapak', 'gojek', 'grab', 'traveloka',
    'deliveroo', 'justeat', 'foodpanda', 'swiggy', 'zomato', 'doordash', 'postmates',
    'grubhub', 'ubereats', 'instacart', 'shipt', 'gopuff', 'gorillas', 'getir', 'flink'
]

def is_usa_job(location_str):
    if not location_str:
        return True # Default to keeping it if no location is provided
        
    loc = location_str.lower()
    
    # Exclude explicit international locations
    exclude_terms = ['canada', 'uk', 'united kingdom', 'india', 'london', 'toronto', 'vancouver', 'berlin', 'germany', 'australia', 'sydney', 'emea', 'apac', 'ireland', 'dublin', 'france', 'paris', 'singapore']
    if any(term in loc for term in exclude_terms):
        return False
        
    # Include explicit US locations
    include_terms = ['us', 'usa', 'united states', 'remote', 'ca', 'ny', 'tx', 'wa', 'california', 'new york', 'texas', 'washington', 'boston', 'chicago', 'austin', 'seattle', 'san francisco']
    
    # If we have an include term, or if it doesn't have an exclude term, we err on the side of keeping it
    return True

def scrape_greenhouse():
    print("Scraping Greenhouse boards...")
    for company in GREENHOUSE_BOARDS:
        print(f"Fetching jobs for {company}...")
        try:
            # Hit the public Greenhouse JSON API
            res = requests.get(f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs")
            if res.status_code != 200:
                print(f"  Failed to fetch {company}: {res.status_code}")
                continue
            
            data = res.json()
            jobs = data.get('jobs', [])
            
            inserted = 0
            for job in jobs:
                # Filter ONLY for Data & AI roles
                title = job.get('title', '').lower()
                tech_keywords = ['data', 'machine learning', 'ai ', 'artificial intelligence', 'nlp', 'deep learning', 'analytics', 'scientist', 'llm', 'computer vision']
                if not any(keyword in title for keyword in tech_keywords):
                    continue
                
                # Fetch the full job description
                job_id = job.get('id')
                job_res = requests.get(f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs/{job_id}")
                if job_res.status_code == 200:
                    job_data = job_res.json()
                    
                    # Convert HTML content to clean raw text
                    html_content = job_data.get('content', '')
                    soup = BeautifulSoup(html_content, 'html.parser')
                    clean_text = soup.get_text(separator='\n', strip=True)
                    
                    # Extract Experience Required using a smarter regex that looks for the word "experience"
                    exp_match = re.search(r'(\d+)\+?\s*years?[^\.]{0,40}?experience', clean_text, re.IGNORECASE)
                    
                    # If that fails, fallback to standard years (less accurate)
                    if not exp_match:
                        exp_match = re.search(r'(\d+)\+?\s*years?', clean_text, re.IGNORECASE)

                    exp_req = f"{exp_match.group(1)}+ years" if exp_match else "Not Specified"
                    
                    location_str = job.get('location', {}).get('name', 'Remote')
                    if not is_usa_job(location_str):
                        continue
                    
                    job_record = {
                        "title": job.get('title'),
                        "company": company.capitalize(),
                        "location": location_str,
                        "description": clean_text[:15000],
                        "url": job.get('absolute_url'),
                        "source": "greenhouse",
                        "experience_required": exp_req,
                        "posted_at": job.get('updated_at')
                    }
                    
                    try:
                        # Insert into Supabase via REST API directly (bypasses python SDK bugs)
                        headers = {
                            "apikey": SUPABASE_KEY,
                            "Authorization": f"Bearer {SUPABASE_KEY}",
                            "Content-Type": "application/json",
                            "Prefer": "return=minimal"
                        }
                        insert_res = requests.post(f"{SUPABASE_URL}/rest/v1/jobs", headers=headers, json=job_record)
                        
                        if insert_res.status_code in [200, 201]:
                            inserted += 1
                        elif insert_res.status_code == 409:
                            # 409 Conflict = duplicate URL, this is fine!
                            pass
                        else:
                            print(f"  Error inserting job: {insert_res.text}")
                    except Exception as e:
                        print(f"  Request error: {e}")
                            
            print(f"  Inserted {inserted} new technical jobs for {company}.")
        except Exception as e:
            print(f"  Error processing {company}: {e}")

def scrape_workday():
    print("Scraping Workday boards...")
    for board in WORKDAY_BOARDS:
        tenant = board['tenant']
        site = board['board']
        wd = board['wd']
        print(f"Fetching jobs for {tenant}...")
        
        try:
            url = f"https://{tenant}.{wd}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs"
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            # Search specifically for Data/AI to reduce requests
            payload = {
                'appliedFacets': {},
                'limit': 20,
                'offset': 0,
                'searchText': 'Data'
            }
            
            res = requests.post(url, headers=headers, json=payload)
            if res.status_code != 200:
                print(f"  Failed to fetch {tenant}: {res.status_code}")
                continue
                
            data = res.json()
            jobs = data.get('jobPostings', [])
            inserted = 0
            
            for job in jobs:
                title = job.get('title', '').lower()
                tech_keywords = ['data', 'machine learning', 'ai ', 'artificial intelligence', 'nlp', 'deep learning', 'analytics', 'scientist', 'llm', 'computer vision']
                if not any(keyword in title for keyword in tech_keywords):
                    continue
                    
                job_path = job.get('externalPath')
                job_url = f"https://{tenant}.{wd}.myworkdayjobs.com/wday/cxs/{tenant}/{site}{job_path}"
                
                # Fetch full Job Description
                job_res = requests.get(job_url, headers={'Accept': 'application/json'})
                if job_res.status_code == 200:
                    job_data = job_res.json()
                    
                    html_content = job_data.get('jobPostingInfo', {}).get('jobDescription', '')
                    soup = BeautifulSoup(html_content, 'html.parser')
                    clean_text = soup.get_text(separator='\n', strip=True)
                    
                    exp_match = re.search(r'(\d+)\+?\s*years?[^\.]{0,40}?experience', clean_text, re.IGNORECASE)
                    if not exp_match:
                        exp_match = re.search(r'(\d+)\+?\s*years?', clean_text, re.IGNORECASE)

                    exp_req = f"{exp_match.group(1)}+ years" if exp_match else "Not Specified"
                    
                    posted_date = job_data.get('jobPostingInfo', {}).get('postedOn', '')
                    # Workday often returns "Posted 3 Days Ago". We let Supabase handle default now() if we can't parse it easily, 
                    # but typically Workday has a start date in the API. We'll use startDate if available, else None.
                    posted_at = job_data.get('jobPostingInfo', {}).get('startDate')
                    
                    location_str = job.get('locationsText', 'Remote')
                    if not is_usa_job(location_str):
                        continue
                    
                    job_record = {
                        "title": job.get('title'),
                        "company": tenant.capitalize(),
                        "location": location_str,
                        "description": clean_text[:15000],
                        "url": f"https://{tenant}.{wd}.myworkdayjobs.com/en-US/{site}{job_path}",
                        "source": "workday",
                        "experience_required": exp_req,
                        "posted_at": posted_at
                    }
                    
                    try:
                        headers = {
                            "apikey": SUPABASE_KEY,
                            "Authorization": f"Bearer {SUPABASE_KEY}",
                            "Content-Type": "application/json",
                            "Prefer": "return=minimal"
                        }
                        insert_res = requests.post(f"{SUPABASE_URL}/rest/v1/jobs", headers=headers, json=job_record)
                        
                        if insert_res.status_code in [200, 201]:
                            inserted += 1
                    except Exception as e:
                        pass
                        
            print(f"  Inserted {inserted} new technical jobs for {tenant}.")
        except Exception as e:
            print(f"  Error processing {tenant}: {e}")

def scrape_lever():
    print("Scraping Lever boards (Startups)...")
    for company in LEVER_BOARDS:
        print(f"Fetching jobs for {company}...")
        try:
            res = requests.get(f"https://api.lever.co/v0/postings/{company}")
            if res.status_code != 200:
                print(f"  Failed to fetch {company}: {res.status_code}")
                continue
                
            jobs = res.json()
            inserted = 0
            
            for job in jobs:
                title = job.get('text', '').lower()
                tech_keywords = ['data', 'machine learning', 'ai ', 'artificial intelligence', 'nlp', 'deep learning', 'analytics', 'scientist', 'llm', 'computer vision']
                if not any(keyword in title for keyword in tech_keywords):
                    continue
                    
                clean_text = job.get('descriptionPlain', '')
                
                exp_match = re.search(r'(\d+)\+?\s*years?[^\.]{0,40}?experience', clean_text, re.IGNORECASE)
                if not exp_match:
                    exp_match = re.search(r'(\d+)\+?\s*years?', clean_text, re.IGNORECASE)

                exp_req = f"{exp_match.group(1)}+ years" if exp_match else "Not Specified"
                
                # Lever provides createdAt in milliseconds epoch
                created_at_ms = job.get('createdAt')
                posted_at = None
                if created_at_ms:
                    from datetime import datetime
                    posted_at = datetime.fromtimestamp(created_at_ms / 1000.0).isoformat()
                
                location_str = job.get('categories', {}).get('location', 'Remote')
                if not is_usa_job(location_str):
                    continue
                
                job_record = {
                    "title": job.get('text'),
                    "company": company.capitalize(),
                    "location": location_str,
                    "description": clean_text[:15000],
                    "url": job.get('hostedUrl'),
                    "source": "lever",
                    "experience_required": exp_req,
                    "posted_at": posted_at
                }
                
                try:
                    headers = {
                        "apikey": SUPABASE_KEY,
                        "Authorization": f"Bearer {SUPABASE_KEY}",
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal"
                    }
                    insert_res = requests.post(f"{SUPABASE_URL}/rest/v1/jobs", headers=headers, json=job_record)
                    
                    if insert_res.status_code in [200, 201]:
                        inserted += 1
                except Exception as e:
                    pass
                    
            print(f"  Inserted {inserted} new technical jobs for {company}.")
        except Exception as e:
            print(f"  Error processing {company}: {e}")

def cleanup_old_jobs():
    print("Cleaning up old jobs to prevent database bloat...")
    try:
        from datetime import datetime, timedelta
        cutoff = datetime.now() - timedelta(days=60)
        
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        
        # Delete jobs where posted_at is older than 60 days
        res = requests.delete(f"{SUPABASE_URL}/rest/v1/jobs?posted_at=lt.{cutoff.isoformat()}", headers=headers)
        
        # Also delete jobs where created_at is older than 60 days (just in case posted_at was null)
        res2 = requests.delete(f"{SUPABASE_URL}/rest/v1/jobs?created_at=lt.{cutoff.isoformat()}", headers=headers)
        
        print(f"Cleanup complete. Status 1: {res.status_code}, Status 2: {res2.status_code}")
    except Exception as e:
        print(f"Error during cleanup: {e}")

if __name__ == "__main__":
    scrape_greenhouse()
    scrape_workday()
    scrape_lever()
    cleanup_old_jobs()
    print("Scraping complete!")

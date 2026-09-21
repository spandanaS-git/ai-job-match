import os
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import re

def is_us_job(location):
    if not location:
        return True
    loc = str(location).lower()
    non_us_keywords = ['uk', 'united kingdom', 'london', 'india', 'bangalore', 'germany', 'berlin', 'munich', 'france', 'paris', 'canada', 'toronto', 'vancouver', 'australia', 'sydney', 'europe', 'emea', 'apac', 'latam', 'brazil', 'singapore', 'ireland', 'dublin', 'netherlands', 'amsterdam', 'spain', 'madrid', 'barcelona']
    for keyword in non_us_keywords:
        if re.search(r'' + keyword + r'', loc):
            if not ('us' in loc.split() or 'united states' in loc or 'america' in loc or 'new york' in loc or 'california' in loc or 'remote - us' in loc or 'remote (us)' in loc):
                return False
    return True


# Load environment variables from the Next.js .env.local file
load_dotenv(dotenv_path='../.env.local')

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") 

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in ../.env.local")
    print("You must add SUPABASE_SERVICE_ROLE_KEY to your .env.local file to run the scraper!")
    exit(1)

# A list of top tech companies. The script will automatically skip any that don't use Greenhouse.
GREENHOUSE_BOARDS = ['gusto', 'discord', 'canva', 'fivetran', 'notion', 'ramp', 'brex', 'plaid', 'scaleai', 'openai', 'anthropic', 'cohere', 'midjourney', 'huggingface', 'pinecone', 'weightsandbiases', 'databricks', 'snowflake', 'palantir', 'cloudflare', 'fastly', 'mongodb', 'elastic', 'confluent', 'hashicorp', 'gitlab', 'github', 'atlassian', 'asana', 'monday', 'smartsheet', 'airtable', 'coda', 'miro', 'figma', 'invision', 'sketch', 'framer', 'webflow', 'vercel', 'netlify', 'supabase', 'render', 'fly', 'heroku', 'digitalocean', 'linode', 'vultr', 'aws', 'gcp', 'azure', 'stripe', 'square', 'paypal', 'adyen', 'checkout', 'marqeta', 'plaid', 'chime', 'revolut', 'monzo', 'n26', 'nubank', 'robinhood', 'coinbase', 'kraken', 'gemini', 'binance', 'ftx', 'blockfi', 'celsius', 'voyager', 'opensea', 'dapperlabs', 'yugalabs', 'animocabrands', 'sandbox', 'decentraland', 'axon', 'anduril', 'shieldai', 'skydio', 'dronedeploy', 'zipline', 'nuro', 'cruise', 'waymo', 'zoox', 'aurora', 'tusimple', 'embark', 'kodiak', 'locomation', 'plus', 'waabi', 'ghost', 'scale', 'snuba', 'sentry', 'datadog', 'newrelic', 'dynatrace', 'appdynamics', 'splunk', 'sumologic', 'logdna', 'papertrail', 'coralogix', 'logz', 'honeycomb', 'lightstep', 'signalfx', 'wavefront', 'prometheus', 'grafana', 'influxdata', 'timescale', 'questdb', 'cockroachlabs', 'planetscale', 'neon', 'yugabyte', 'singlestore', 'memsql', 'couchbase', 'datastax', 'scylladb', 'redis', 'upstash', 'momento', 'fauna', 'surrealdb', 'edgedb', 'weaviate', 'qdrant', 'milvus', 'chroma', 'typesense', 'meilisearch', 'algolia', 'elastic', 'opensearch', 'lucidworks', 'coveo', 'sinequa', 'attivio', 'swiftype', 'sajari', 'klevu', 'doofinder', 'searchspring', 'hawksearch', 'unbxd', 'constructor', 'bloomreach', 'dynamicyield', 'monetate', 'optimizely', 'vwo', 'kameleoon', 'convert', 'abtasty', 'sitespect', 'qubit', 'segment', 'mparticle', 'tealium', 'treasuredata', 'rudderstack', 'snowplow', 'posthog', 'amplitude', 'mixpanel', 'heap', 'pendo', 'clevertap', 'moengage', 'braze', 'iterable', 'customerio', 'leanplum', 'swrve', 'airship', 'onesignal', 'batch', 'wonderpush', 'pusher', 'pubnub', 'ably', 'solace', 'kafka', 'redpanda', 'discord', 'slack', 'teams', 'zoom', 'webex', 'meet', 'jitsi', 'whereby', 'daily', 'agora', 'twilio', 'sinch', 'vonage', 'bandwidth', 'plivo', 'msg91', 'route', 'sendgrid', 'mailgun', 'postmark', 'sparkpost', 'amazon-ses', 'mandrill', 'mailjet', 'pepipost', 'sendinblue', 'brevo', 'mailerlite', 'convertkit', 'aweber', 'getresponse', 'activecampaign', 'drip', 'keap', 'infusionsoft', 'ontraport', 'hubspot', 'marketo', 'pardot', 'eloqua', 'act-on', 'sharpspring', 'autopilot', 'klaviyo', 'omnisend', 'privy', 'justuno', 'gorgias', 'kustomer', 'zendesk', 'freshdesk', 'intercom', 'drift', 'crisp', 'tawk', 'tidio', 'livechat', 'snapengage', 'olark', 'userlike', 'smartsupp', 'purechat', 'chaport', 'jivochat', 'crisp', 'kayako', 'helpscout', 'front', 'groove', 'missive', 'superhuman', 'hey', 'protonmail', 'tutanota', 'fastmail', 'zoho', 'google', 'microsoft', 'apple', 'amazon', 'meta', 'netflix', 'tesla', 'nvidia', 'amd', 'intel', 'qualcomm', 'broadcom', 'texas-instruments', 'micron', 'nxp', 'analog-devices', 'microchip', 'onsemi', 'infineon', 'stmicroelectronics', 'renesas', 'rohm', 'nexperia', 'diodes', 'vishay', 'littelfuse', 'bourns', 'murata', 'tdk', 'taiyo-yuden', 'yageo', 'kemet', 'avx', 'panasonic', 'samsung', 'lg', 'sony', 'philips', 'bosch', 'siemens', 'ge', 'honeywell', '3m', 'dupont', 'dow', 'basf', 'bayer', 'johnson-johnson', 'pfizer', 'merck', 'novartis', 'roche', 'sanofi', 'gsk', 'astrazeneca', 'abbvie', 'lilly', 'amgen', 'gilead', 'biogen', 'vertex', 'regeneron', 'moderna', 'biontech', 'curevac', 'novavax', 'illumina', 'thermo-fisher', 'danaher', 'agilent', 'waters', 'perkinelmer', 'bruker', 'bio-rad', 'sartorius', 'eppendorf', 'qiagen', 'roche', 'siemens-healthineers', 'philips', 'ge-healthcare', 'medtronic', 'boston-scientific', 'abbott', 'stryker', 'zimmer-biomet', 'smith-nephew', 'edwards-lifesciences', 'intuitive-surgical', 'dexcom', 'tandem', 'insulet', 'resmed', 'fisher-paykel', 'philips', 'löwenstein', 'apex', 'bmc', 'somnetics', 'drive-devilbiss', 'invacare', 'sunset', 'ag-industries', 'roseniron', 'medline', 'cardinal-health', 'mckesson', 'amerisourcebergen', 'owens-minor', 'henry-schein', 'patterson', 'benco', 'darby', 'midmark', 'pelton-crane', 'a-dec', 'dentalez', 'marus', 'forest', 'dci', 'engle', 'proma', 'tp', 'boyd', 'reliance', 'haag-streit', 'topcon', 'zeiss', 'leica', 'nikon', 'olympus', 'pentax', 'fujifilm', 'canon', 'panasonic', 'sony', 'jvc', 'red', 'arri', 'blackmagic', 'gopro', 'dji', 'autel', 'skydio', 'parrot', 'yuneec', 'hubsan', 'syma', 'holy-stone', 'potensic', 'ryze', 'zerotech', 'walkera', 'eacheng', 'cheerson', 'uber', 'lyft', 'doordash', 'instacart', 'postmates', 'grubhub', 'seamless', 'caviar', 'ubereats', 'deliveryhero', 'foodpanda', 'swiggy', 'zomato', 'talabat', 'deliveroo', 'justeat', 'takeaway', 'wolt', 'glovo', 'gopuff', 'getir', 'gorillas', 'flink', 'cajoo', 'dija', 'weezy', 'zapp', 'jiffy', 'fancy', 'buyk', 'fridge-no-more', 'jokr', '1520', 'grocemania', 'beelivery', 'snappy-shopper', 'appetise', 'ritual', 'snackpass', 'odeko', 'levelz', 'chownow', 'slice', 'bentobox', 'popmenu', 'lunchbox', 'hungerrush', 'revel', 'toast', 'square', 'clover', 'lightspeed', 'touchbistro', 'upserve', 'aloha', 'micros', 'positouch', 'agilysys', 'infogenesis', 'silverware', 'squirrel', 'rm-pos', 'dinerware', 'pc-america', 'aldelo', 'shopkeep', 'vend', 'bindo', 'erply', 'springboard', 'teamwork', 'asana', 'trello', 'jira', 'confluence', 'bitbucket', 'bamboo', 'sourcetree', 'crucible', 'fisheye', 'crowd', 'opsgenie', 'statuspage', 'halp', 'trello', 'butler', 'jira-align', 'jira-service-management', 'jira-work-management', 'jira-software', 'jira-core', 'confluence', 'bitbucket', 'bamboo', 'airbnb', 'booking', 'expedia', 'tripadvisor', 'kayak', 'skyscanner', 'momondo', 'cheapflights', 'kiwi', 'hopper', 'omio', 'trainline', 'busbud', 'wanderu', 'rome2rio', 'citymapper', 'moovit', 'transit', 'uber', 'lyft', 'bolt', 'free-now', 'cabify', 'gojek', 'grab', 'didi', 'ola', 'yandex-taxi', 'gett', 'bird', 'lime', 'spin', 'tier', 'voi', 'dot', 'dott', 'wind', 'circ', 'jump', 'helbiz', 'gron', 'revel', 'moped', 'scoot', 'zigzag', 'emmy', 'coup', 'tesla', 'rivian', 'lucid', 'nio', 'xpeng', 'li-auto', 'byd', 'polestar', 'fisker', 'canno', 'faraday-future', 'lordstown', 'arrival', 'nikola', 'hyliion', 'proterra', 'lion-electric', 'greenpower', 'blue-bird', 'thomas-built', 'ic-bus', 'collins', 'starcraft', 'glaval', 'elkhart', 'champion', 'goshen', 'spacex', 'blue-origin', 'virgin-galactic', 'rocket-lab', 'relativity-space', 'astra', 'firefly', 'abl', 'spinlaunch', 'ispace', 'astrobotic', 'masten', 'intuitive-machines', 'sierra-space', 'voyager-space', 'nanoracks', 'axiom-space', 'vast', 'orbital-assembly', 'orbital-reef', 'starlab', 'commercial-leo', 'planet', 'spire', 'iceye', 'capella', 'umbra', 'predasar', 'hawkeye-360', 'kleos', 'spire', 'exactearth', 'orbcomm', 'iridium', 'globalstar', 'inmarsat', 'viasat', 'hughes', 'echostar', 'ses', 'intelsat', 'eutelsat', 'telesat', 'hispasat', 'arabsat', 'yahsat', 'rscc', 'gazprom-space', 'chinasat', 'apstar', 'roblox', 'epic-games', 'unity', 'applovin', 'ironsource', 'vungle', 'chartboost', 'adcolony', 'tapjoy', 'fyber', 'mintegral', 'liftoff', 'crossinstall', 'niantic', 'supercell', 'king', 'zynga', 'playrix', 'rovio', 'jam-city', 'scopely', 'machine-zone', 'kabam', 'nexon', 'netmarble', 'ncsoft', 'pearl-abyss', 'krafton', 'pubg', 'riot-games', 'valve', 'blizzard', 'activision', 'electronic-arts', 'take-two', 'ubisoft', 'square-enix', 'capcom', 'sega', 'bandai-namco', 'konami', 'koei-tecmo', 'nintendo', 'sony-interactive', 'xbox', 'bethesda', 'zenimax', 'id-software', 'arkane', 'machinegames', 'tango-gameworks', 'coursera', 'udacity', 'edx', 'skillshare', 'masterclass', 'udemy', 'pluralsight', 'linkedin-learning', 'lynda', 'cbtnuggets', 'itpro', 'ine', 'linux-academy', 'acloudguru', 'datacamp', 'dataquest', 'codecademy', 'freecodecamp', 'odin-project', 'khan-academy', 'brilliant', 'outlier', 'mastery', 'minerva', 'lambda-school', 'bloom-institute', 'app-academy', 'hack-reactor', 'flatiron-school', 'general-assembly', 'ironhack', 'le-wagon', 'springboard', 'thinkful', 'designlab', 'figma', 'canva', 'invision', 'sketch', 'adobe', 'corel', 'affinity', 'procreate', 'clip-studio', 'paint-tool-sai', 'krita', 'gimp', 'blender', 'maya', '3ds-max', 'cinema-4d', 'houdini', 'zbrush', 'mudbox', 'substance', 'mari', 'katana', 'nuke', 'fusion', 'after-effects', 'premiere', 'final-cut', 'davinci', 'avid', 'pro-tools', 'logic-pro', 'ableton', 'fl-studio', 'cubase', 'studio-one', 'reaper', 'bitwig', 'reason', 'maschine', 'mpc', 'push', 'launchpad', 'reddit', 'pinterest', 'snapchat', 'tiktok', 'twitter', 'facebook', 'instagram', 'whatsapp', 'messenger', 'telegram', 'signal', 'discord', 'slack', 'teams', 'zoom', 'skype', 'webex', 'meet', 'facetime', 'duo', 'viber', 'line', 'kakao', 'wechat', 'qq', 'momo', 'tantan', 'tinder', 'bumble', 'hinge', 'okcupid', 'match', 'pof', 'zoosk', 'badoo', 'happn', 'grindr', 'her', 'scruff', 'jackd', 'growlr', 'chasable', 'daddyhunt', 'bearwww', 'silverdaddies', 'biggercity', 'ycombinator', 'techstars', '500startups', 'plugandplay', 'sosv', 'startupbootcamp', 'masschallenge', 'alchemist', 'angelpad', 'mucker', 'science', 'betaworks', 'sequoia', 'a16z', 'benchmark', 'founders-fund', 'lightspeed', 'accel', 'index', 'greylock', 'bessemer', 'kleiner-perkins', 'nea', 'gv', 'capitalg', 'softbank', 'tiger-global', 'coatue', 'd1-capital', 'addition', 'dragoneer', 'insight', 'general-atlantic', 'silver-lake', 'thoma-bravo', 'vista', 'hellman-friedman'] + [
    'offerup', 'anduril', 'chime', 'redfin', 'epicgames', 'pinecone', 'whoop', 'teladoc', 'glossier', 'selina', 'verkada', 'discord', 'flexport', 'away', 'grubhub', 'ubisoft', 'rippling', 'pagerduty', 'flink', 'oscarhealth', 'opendoor', 'hubspot', 'confluent', 'zipline', 'splunk', 'snapper', 'minted', 'citibike', 'anthropic', 'letgo', 'zapp', 'zoox', 'vrbo', 'pinterest', 'gong', 'benchling', 'vroom', 'scaleai', 'skillshare', 'huggingface', 'peloton', 'postmates', 'swvl', 'kayak', 'synthesia', 'tier', 'twilio', 'roku', 'clarifai', 'c3ai', 'sonyinteractive', 'midjourney', 'langchain', 'wolt', 'grab', 'zynga', 'vacasa', 'playrix', 'block', 'openai', 'instabase', 'mongodb', 'tuio', 'skydio', 'hopper', 'spotify', 'hellofresh', 'weightsandbiases', 'zillow', 'casper', 'okta', 'cashapp', 'carousell', 'notion', 'zocdoc', 'getaround', 'crowdstrike', 'carvana', 'thredup', 'zoom', 'fastly', 'mailchimp', 'sofi', 'sweetgreen', 'tripadvisor', 'seamless', 'aurora', 'dot', 'fivetran', 'shieldai', 'unity', 'eventbrite', 'snowflake', 'shopee', 'blueground', 'glassdoor', 'character', 'waymo', 'gopuff', 'blizzard', 'flatironhealth', 'robinhood', 'databricks', 'inflection', 'hashicorp', 'uber', 'godaddy', 'warbyparker', 'cohere', 'rootinsurance', 'bandainamco', 'runway', 'rover', 'bukalapak', 'shift', 'wayfair', 'asana', 'vinted', 'netflix', 'nuro', 'newrelic', 'perplexity', 'bytedance', 'datarobot', 'lazada', 'talabat', 'gitlab', 'nintendo', 'doordash', 'grail', 'h2o', 'cruise', 'expedia', 'brex', 'dronedeploy', 'deliveroo', 'zomato', 'traveloka', 'swiggy', 'reddit', 'sonder', 'capcom', 'bolt', 'poshmark', 'glovo', 'dropbox', 'braze', 'applovins', 'veeva', 'yelp', 'figma', 'stitchfix', 'stockx', 'compass', 'jasper', 'gusto', 'samsara', 'zipcar', 'toast', 'servicenow', 'cava', 'headspace', 'renttherunway', 'coursera', 'surveymonkey', 'tiktok', 'turo', 'lyft', 'atlassian', 'datadog', 'adept', 'stripe', 'canva', 'careem', 'dollarshaveclub', 'hulu', 'palantir', 'blueapron', 'niantic', 'oura', 'deliveryhero', 'segment', 'color', 'skyscanner', 'elastic', 'cinch', 'supercell', 'ola', 'pony', 'airbnb', 'udemy', 'cloudflare', 'gojek', 'konami', 'paloaltonetworks', 'scopely', 'ironMTN', 'instacart', 'tempus', 'snap', 'spin', 'mercari', 'voi', 'anyscale', 'grailed', 'roblox', 'getir', 'taskrabbit', 'slack', 'descript', 'thumbtack', 'riotgames', 'plaid', 'wix', 'coinbase', 'justeat', 'patreon', 'bird', 'calm', '23andme', 'betterment', 'docusign', 'sega', 'xbox', 'booking', 'blablacar', 'appdynamics', 'wealthfront', 'lime', 'king', 'strava', 'masterclass', 'allbirds', 'electronicarts', 'zscaler', 'jump', 'motivate', 'github', 'take2', 'cazoo', 'caviar', 'foodpanda', 'twitch', 'workday', 'outreach', 'depop', 'squareenix', 'lemonade', 'kuaishou', 'squarespace', 'tokopedia', 'gorillas', 'didi', 'ramp', 'goat'
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
LEVER_BOARDS = ['gusto', 'discord', 'canva', 'fivetran', 'notion', 'ramp', 'brex', 'plaid', 'scaleai', 'openai', 'anthropic', 'cohere', 'midjourney', 'huggingface', 'pinecone', 'weightsandbiases', 'databricks', 'snowflake', 'palantir', 'cloudflare', 'fastly', 'mongodb', 'elastic', 'confluent', 'hashicorp', 'gitlab', 'github', 'atlassian', 'asana', 'monday', 'smartsheet', 'airtable', 'coda', 'miro', 'figma', 'invision', 'sketch', 'framer', 'webflow', 'vercel', 'netlify', 'supabase', 'render', 'fly', 'heroku', 'digitalocean', 'linode', 'vultr', 'aws', 'gcp', 'azure', 'stripe', 'square', 'paypal', 'adyen', 'checkout', 'marqeta', 'plaid', 'chime', 'revolut', 'monzo', 'n26', 'nubank', 'robinhood', 'coinbase', 'kraken', 'gemini', 'binance', 'ftx', 'blockfi', 'celsius', 'voyager', 'opensea', 'dapperlabs', 'yugalabs', 'animocabrands', 'sandbox', 'decentraland', 'axon', 'anduril', 'shieldai', 'skydio', 'dronedeploy', 'zipline', 'nuro', 'cruise', 'waymo', 'zoox', 'aurora', 'tusimple', 'embark', 'kodiak', 'locomation', 'plus', 'waabi', 'ghost', 'scale', 'snuba', 'sentry', 'datadog', 'newrelic', 'dynatrace', 'appdynamics', 'splunk', 'sumologic', 'logdna', 'papertrail', 'coralogix', 'logz', 'honeycomb', 'lightstep', 'signalfx', 'wavefront', 'prometheus', 'grafana', 'influxdata', 'timescale', 'questdb', 'cockroachlabs', 'planetscale', 'neon', 'yugabyte', 'singlestore', 'memsql', 'couchbase', 'datastax', 'scylladb', 'redis', 'upstash', 'momento', 'fauna', 'surrealdb', 'edgedb', 'weaviate', 'qdrant', 'milvus', 'chroma', 'typesense', 'meilisearch', 'algolia', 'elastic', 'opensearch', 'lucidworks', 'coveo', 'sinequa', 'attivio', 'swiftype', 'sajari', 'klevu', 'doofinder', 'searchspring', 'hawksearch', 'unbxd', 'constructor', 'bloomreach', 'dynamicyield', 'monetate', 'optimizely', 'vwo', 'kameleoon', 'convert', 'abtasty', 'sitespect', 'qubit', 'segment', 'mparticle', 'tealium', 'treasuredata', 'rudderstack', 'snowplow', 'posthog', 'amplitude', 'mixpanel', 'heap', 'pendo', 'clevertap', 'moengage', 'braze', 'iterable', 'customerio', 'leanplum', 'swrve', 'airship', 'onesignal', 'batch', 'wonderpush', 'pusher', 'pubnub', 'ably', 'solace', 'kafka', 'redpanda', 'discord', 'slack', 'teams', 'zoom', 'webex', 'meet', 'jitsi', 'whereby', 'daily', 'agora', 'twilio', 'sinch', 'vonage', 'bandwidth', 'plivo', 'msg91', 'route', 'sendgrid', 'mailgun', 'postmark', 'sparkpost', 'amazon-ses', 'mandrill', 'mailjet', 'pepipost', 'sendinblue', 'brevo', 'mailerlite', 'convertkit', 'aweber', 'getresponse', 'activecampaign', 'drip', 'keap', 'infusionsoft', 'ontraport', 'hubspot', 'marketo', 'pardot', 'eloqua', 'act-on', 'sharpspring', 'autopilot', 'klaviyo', 'omnisend', 'privy', 'justuno', 'gorgias', 'kustomer', 'zendesk', 'freshdesk', 'intercom', 'drift', 'crisp', 'tawk', 'tidio', 'livechat', 'snapengage', 'olark', 'userlike', 'smartsupp', 'purechat', 'chaport', 'jivochat', 'crisp', 'kayako', 'helpscout', 'front', 'groove', 'missive', 'superhuman', 'hey', 'protonmail', 'tutanota', 'fastmail', 'zoho', 'google', 'microsoft', 'apple', 'amazon', 'meta', 'netflix', 'tesla', 'nvidia', 'amd', 'intel', 'qualcomm', 'broadcom', 'texas-instruments', 'micron', 'nxp', 'analog-devices', 'microchip', 'onsemi', 'infineon', 'stmicroelectronics', 'renesas', 'rohm', 'nexperia', 'diodes', 'vishay', 'littelfuse', 'bourns', 'murata', 'tdk', 'taiyo-yuden', 'yageo', 'kemet', 'avx', 'panasonic', 'samsung', 'lg', 'sony', 'philips', 'bosch', 'siemens', 'ge', 'honeywell', '3m', 'dupont', 'dow', 'basf', 'bayer', 'johnson-johnson', 'pfizer', 'merck', 'novartis', 'roche', 'sanofi', 'gsk', 'astrazeneca', 'abbvie', 'lilly', 'amgen', 'gilead', 'biogen', 'vertex', 'regeneron', 'moderna', 'biontech', 'curevac', 'novavax', 'illumina', 'thermo-fisher', 'danaher', 'agilent', 'waters', 'perkinelmer', 'bruker', 'bio-rad', 'sartorius', 'eppendorf', 'qiagen', 'roche', 'siemens-healthineers', 'philips', 'ge-healthcare', 'medtronic', 'boston-scientific', 'abbott', 'stryker', 'zimmer-biomet', 'smith-nephew', 'edwards-lifesciences', 'intuitive-surgical', 'dexcom', 'tandem', 'insulet', 'resmed', 'fisher-paykel', 'philips', 'löwenstein', 'apex', 'bmc', 'somnetics', 'drive-devilbiss', 'invacare', 'sunset', 'ag-industries', 'roseniron', 'medline', 'cardinal-health', 'mckesson', 'amerisourcebergen', 'owens-minor', 'henry-schein', 'patterson', 'benco', 'darby', 'midmark', 'pelton-crane', 'a-dec', 'dentalez', 'marus', 'forest', 'dci', 'engle', 'proma', 'tp', 'boyd', 'reliance', 'haag-streit', 'topcon', 'zeiss', 'leica', 'nikon', 'olympus', 'pentax', 'fujifilm', 'canon', 'panasonic', 'sony', 'jvc', 'red', 'arri', 'blackmagic', 'gopro', 'dji', 'autel', 'skydio', 'parrot', 'yuneec', 'hubsan', 'syma', 'holy-stone', 'potensic', 'ryze', 'zerotech', 'walkera', 'eacheng', 'cheerson', 'uber', 'lyft', 'doordash', 'instacart', 'postmates', 'grubhub', 'seamless', 'caviar', 'ubereats', 'deliveryhero', 'foodpanda', 'swiggy', 'zomato', 'talabat', 'deliveroo', 'justeat', 'takeaway', 'wolt', 'glovo', 'gopuff', 'getir', 'gorillas', 'flink', 'cajoo', 'dija', 'weezy', 'zapp', 'jiffy', 'fancy', 'buyk', 'fridge-no-more', 'jokr', '1520', 'grocemania', 'beelivery', 'snappy-shopper', 'appetise', 'ritual', 'snackpass', 'odeko', 'levelz', 'chownow', 'slice', 'bentobox', 'popmenu', 'lunchbox', 'hungerrush', 'revel', 'toast', 'square', 'clover', 'lightspeed', 'touchbistro', 'upserve', 'aloha', 'micros', 'positouch', 'agilysys', 'infogenesis', 'silverware', 'squirrel', 'rm-pos', 'dinerware', 'pc-america', 'aldelo', 'shopkeep', 'vend', 'bindo', 'erply', 'springboard', 'teamwork', 'asana', 'trello', 'jira', 'confluence', 'bitbucket', 'bamboo', 'sourcetree', 'crucible', 'fisheye', 'crowd', 'opsgenie', 'statuspage', 'halp', 'trello', 'butler', 'jira-align', 'jira-service-management', 'jira-work-management', 'jira-software', 'jira-core', 'confluence', 'bitbucket', 'bamboo', 'airbnb', 'booking', 'expedia', 'tripadvisor', 'kayak', 'skyscanner', 'momondo', 'cheapflights', 'kiwi', 'hopper', 'omio', 'trainline', 'busbud', 'wanderu', 'rome2rio', 'citymapper', 'moovit', 'transit', 'uber', 'lyft', 'bolt', 'free-now', 'cabify', 'gojek', 'grab', 'didi', 'ola', 'yandex-taxi', 'gett', 'bird', 'lime', 'spin', 'tier', 'voi', 'dot', 'dott', 'wind', 'circ', 'jump', 'helbiz', 'gron', 'revel', 'moped', 'scoot', 'zigzag', 'emmy', 'coup', 'tesla', 'rivian', 'lucid', 'nio', 'xpeng', 'li-auto', 'byd', 'polestar', 'fisker', 'canno', 'faraday-future', 'lordstown', 'arrival', 'nikola', 'hyliion', 'proterra', 'lion-electric', 'greenpower', 'blue-bird', 'thomas-built', 'ic-bus', 'collins', 'starcraft', 'glaval', 'elkhart', 'champion', 'goshen', 'spacex', 'blue-origin', 'virgin-galactic', 'rocket-lab', 'relativity-space', 'astra', 'firefly', 'abl', 'spinlaunch', 'ispace', 'astrobotic', 'masten', 'intuitive-machines', 'sierra-space', 'voyager-space', 'nanoracks', 'axiom-space', 'vast', 'orbital-assembly', 'orbital-reef', 'starlab', 'commercial-leo', 'planet', 'spire', 'iceye', 'capella', 'umbra', 'predasar', 'hawkeye-360', 'kleos', 'spire', 'exactearth', 'orbcomm', 'iridium', 'globalstar', 'inmarsat', 'viasat', 'hughes', 'echostar', 'ses', 'intelsat', 'eutelsat', 'telesat', 'hispasat', 'arabsat', 'yahsat', 'rscc', 'gazprom-space', 'chinasat', 'apstar', 'roblox', 'epic-games', 'unity', 'applovin', 'ironsource', 'vungle', 'chartboost', 'adcolony', 'tapjoy', 'fyber', 'mintegral', 'liftoff', 'crossinstall', 'niantic', 'supercell', 'king', 'zynga', 'playrix', 'rovio', 'jam-city', 'scopely', 'machine-zone', 'kabam', 'nexon', 'netmarble', 'ncsoft', 'pearl-abyss', 'krafton', 'pubg', 'riot-games', 'valve', 'blizzard', 'activision', 'electronic-arts', 'take-two', 'ubisoft', 'square-enix', 'capcom', 'sega', 'bandai-namco', 'konami', 'koei-tecmo', 'nintendo', 'sony-interactive', 'xbox', 'bethesda', 'zenimax', 'id-software', 'arkane', 'machinegames', 'tango-gameworks', 'coursera', 'udacity', 'edx', 'skillshare', 'masterclass', 'udemy', 'pluralsight', 'linkedin-learning', 'lynda', 'cbtnuggets', 'itpro', 'ine', 'linux-academy', 'acloudguru', 'datacamp', 'dataquest', 'codecademy', 'freecodecamp', 'odin-project', 'khan-academy', 'brilliant', 'outlier', 'mastery', 'minerva', 'lambda-school', 'bloom-institute', 'app-academy', 'hack-reactor', 'flatiron-school', 'general-assembly', 'ironhack', 'le-wagon', 'springboard', 'thinkful', 'designlab', 'figma', 'canva', 'invision', 'sketch', 'adobe', 'corel', 'affinity', 'procreate', 'clip-studio', 'paint-tool-sai', 'krita', 'gimp', 'blender', 'maya', '3ds-max', 'cinema-4d', 'houdini', 'zbrush', 'mudbox', 'substance', 'mari', 'katana', 'nuke', 'fusion', 'after-effects', 'premiere', 'final-cut', 'davinci', 'avid', 'pro-tools', 'logic-pro', 'ableton', 'fl-studio', 'cubase', 'studio-one', 'reaper', 'bitwig', 'reason', 'maschine', 'mpc', 'push', 'launchpad', 'reddit', 'pinterest', 'snapchat', 'tiktok', 'twitter', 'facebook', 'instagram', 'whatsapp', 'messenger', 'telegram', 'signal', 'discord', 'slack', 'teams', 'zoom', 'skype', 'webex', 'meet', 'facetime', 'duo', 'viber', 'line', 'kakao', 'wechat', 'qq', 'momo', 'tantan', 'tinder', 'bumble', 'hinge', 'okcupid', 'match', 'pof', 'zoosk', 'badoo', 'happn', 'grindr', 'her', 'scruff', 'jackd', 'growlr', 'chasable', 'daddyhunt', 'bearwww', 'silverdaddies', 'biggercity', 'ycombinator', 'techstars', '500startups', 'plugandplay', 'sosv', 'startupbootcamp', 'masschallenge', 'alchemist', 'angelpad', 'mucker', 'science', 'betaworks', 'sequoia', 'a16z', 'benchmark', 'founders-fund', 'lightspeed', 'accel', 'index', 'greylock', 'bessemer', 'kleiner-perkins', 'nea', 'gv', 'capitalg', 'softbank', 'tiger-global', 'coatue', 'd1-capital', 'addition', 'dragoneer', 'insight', 'general-atlantic', 'silver-lake', 'thoma-bravo', 'vista', 'hellman-friedman'] + [
    'bettyblocks', 'offerup', 'storj', 'bison', 'glossier', 'away', 'trello', 'grubhub', 'docs', 'orbit', 'kickstarter', 'retool', 'roam', 'flink', 'figment', 'mediafire', 'letgo', 'webflow', 'seafile', 'peloton', 'indiegogo', 'postmates', 'bubble', 'obsidian', 'textile', 'wrike', 'logseq', 'grab', 'ocean', 'hopper', 'sendanywhere', 'wetransfer', 'hopr', 'casper', 'carousell', 'maidsafe', 'gun', 'notion', 'monday', 'word', 'keynote', 'thredup', 'lokinet', 'ubereats', 'infura', 'medium', 'i2p', 'invision', 'idx', 'zapier', 'eventbrite', 'shopee', 'pinata', 'gopuff', 'spideroak', 'filecoin', 'mega', 'substack', 'smartsheet', 'box', 'warbyparker', 'alchemy', 'tresorit', 'bukalapak', 'mural', 'asana', 'vinted', 'pages', 'sugar', 'space', 'lazada', 'framer', 'doordash', 'sketch', 'owncloud', 'ipfs', 'orchid', 'zomato', 'deliveroo', 'replit', 'traveloka', 'althea', 'swiggy', 'swarm', 'icloud', 'duolingo', 'outsystems', 'mysterium', 'poshmark', 'kiva', 'dropbox', 'zeplin', 'yelp', 'excel', 'stitchfix', 'stockx', 'figma', 'iawriter', 'appsheet', 'renttherunway', 'coursera', 'jira', 'miro', 'ssb', 'quora', 'drive', 'thread', 'canva', 'ulysses', 'caspio', 'everlane', 'slides', 'blockdaemon', 'quickbase', 'numbers', 'quicknode', 'rosettestone', 'nym', 'evernote', 'quip', 'gojek', 'instacart', 'mendix', 'confluence', 'pcloud', 'fleek', 'streamr', 'mercari', 'dat', 'nextcloud', 'grailed', 'freenet', 'getir', 'bear', 'zeronet', 'airtable', 'patreon', 'justeat', 'sheets', 'resilio', 'sentinel', 'ceramic', 'sync', 'adalo', 'scrivener', 'gofundme', 'arweave', 'sia', 'thunkable', 'allbirds', 'babbel', 'udacity', 'foodpanda', 'syncthing', 'helium', 'pydio', 'depop', 'onedrive', 'gorillas', 'tokopedia', 'shipt', 'glide', 'coda', 'goat'
]

def is_usa_job(location_str):
    if not location_str:
        return True # Default to keeping it if no location is provided
        
    loc = location_str.lower()
    
    # Exclude explicit international locations
    exclude_terms = ['canada', 'uk', 'united kingdom', 'india', 'london', 'toronto', 'vancouver', 'berlin', 'germany', 'australia', 'sydney', 'emea', 'apac', 'ireland', 'dublin', 'france', 'paris', 'singapore', 'bangalore', 'bengaluru', 'hyderabad', 'pune', 'chennai', 'mumbai', 'delhi', 'tokyo', 'japan', 'china', 'beijing', 'shanghai', 'hong kong', 'taiwan', 'seoul', 'korea', 'amsterdam', 'netherlands', 'spain', 'madrid', 'barcelona', 'mexico', 'brazil', 'sao paulo', 'argentina', 'colombia', 'chile', 'israel', 'tel aviv', 'sweden', 'stockholm', 'poland', 'warsaw', 'romania', 'bucharest', 'switzerland', 'zurich', 'italy', 'rome', 'milan', 'costa rica', 'manila', 'philippines']
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
                import re
                tech_keywords = ['data', 'machine learning', 'artificial intelligence', 'nlp', 'deep learning', 'analytics', 'scientist', 'llm', 'computer vision', 'mlops', 'generative', 'robotics', 'researcher', 'automation', 'quant']
                if not (any(keyword in title for keyword in tech_keywords) or re.search(r'\bai\b', title)):
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
                    if not exp_match:
                        exp_match = re.search(r'(\d+)\+?\s*years?', clean_text, re.IGNORECASE)
                    if exp_match:
                        exp_req = f"{exp_match.group(1)}+ years"
                    else:
                        title_lower = title.lower()
                        if any(k in title_lower for k in ['staff', 'principal', 'vp', 'director', 'head', 'manager', 'lead', 'senior', 'sr.', 'sr ', 'chief']):
                            exp_req = 'Senior'
                        elif any(k in title_lower for k in ['mid', 'intermediate']):
                            exp_req = 'Mid-level'
                        elif any(k in title_lower for k in ['junior', 'jr', 'entry', 'intern', 'grad']):
                            exp_req = 'Entry Level'
                        else:
                            exp_req = 'Not Specified'
                    
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
                import re
                tech_keywords = ['data', 'machine learning', 'artificial intelligence', 'nlp', 'deep learning', 'analytics', 'scientist', 'llm', 'computer vision', 'mlops', 'generative', 'robotics', 'researcher', 'automation', 'quant']
                if not (any(keyword in title for keyword in tech_keywords) or re.search(r'\bai\b', title)):
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
                    if exp_match:
                        exp_req = f"{exp_match.group(1)}+ years"
                    else:
                        title_lower = title.lower()
                        if any(k in title_lower for k in ['staff', 'principal', 'vp', 'director', 'head', 'manager', 'lead', 'senior', 'sr.', 'sr ', 'chief']):
                            exp_req = 'Senior'
                        elif any(k in title_lower for k in ['mid', 'intermediate']):
                            exp_req = 'Mid-level'
                        elif any(k in title_lower for k in ['junior', 'jr', 'entry', 'intern', 'grad']):
                            exp_req = 'Entry Level'
                        else:
                            exp_req = 'Not Specified'
                    
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
                import re
                tech_keywords = ['data', 'machine learning', 'artificial intelligence', 'nlp', 'deep learning', 'analytics', 'scientist', 'llm', 'computer vision', 'mlops', 'generative', 'robotics', 'researcher', 'automation', 'quant']
                if not (any(keyword in title for keyword in tech_keywords) or re.search(r'\bai\b', title)):
                    continue
                    
                clean_text = job.get('descriptionPlain', '')
                
                exp_match = re.search(r'(\d+)\+?\s*years?[^\.]{0,40}?experience', clean_text, re.IGNORECASE)
                if not exp_match:
                    exp_match = re.search(r'(\d+)\+?\s*years?', clean_text, re.IGNORECASE)
                if exp_match:
                    exp_req = f"{exp_match.group(1)}+ years"
                else:
                    title_lower = title.lower()
                    if any(k in title_lower for k in ['staff', 'principal', 'vp', 'director', 'head', 'manager', 'lead', 'senior', 'sr.', 'sr ', 'chief']):
                        exp_req = 'Senior'
                    elif any(k in title_lower for k in ['mid', 'intermediate']):
                        exp_req = 'Mid-level'
                    elif any(k in title_lower for k in ['junior', 'jr', 'entry', 'intern', 'grad']):
                        exp_req = 'Entry Level'
                    else:
                        exp_req = 'Not Specified'
                
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

def scrape_ashby():
    print("Scraping Ashby boards...")
    headers = {'content-type': 'application/json'}
    for board in ASHBY_BOARDS:
        print(f"Fetching jobs for {board}...")
        try:
            body = {
                'operationName': 'ApiJobBoardWithTeams',
                'variables': { 'organizationHostedJobsPageName': board },
                'query': 'query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) { jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) { jobPostings { id title locationName } } }'
            }
            res = requests.post('https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams', json=body, headers=headers)
            if res.status_code == 200:
                data = res.json()
                if 'data' in data and data['data']['jobBoard'] and 'jobPostings' in data['data']['jobBoard']:
                    jobs = data['data']['jobBoard']['jobPostings']
                    inserted = 0
                    for job in jobs:
                        title = job.get('title', '').lower()
                        import re
                        tech_keywords = ['data', 'machine learning', 'artificial intelligence', 'nlp', 'deep learning', 'analytics', 'scientist', 'llm', 'computer vision', 'mlops', 'generative', 'robotics', 'researcher', 'automation', 'quant']
                        if not (any(keyword in title for keyword in tech_keywords) or re.search(r'\bai\b', title)):
                            continue
                            
                        location_str = job.get('locationName', 'Remote')
                        if not is_usa_job(location_str):
                            continue
                            
                        job_record = {
                            "title": job.get('title'),
                            "company": board.capitalize(),
                            "location": location_str,
                            "description": "Apply on Ashby",
                            "url": f"https://jobs.ashbyhq.com/{board}/{job.get('id')}",
                            "source": "ashby",
                            "experience_required": "Not Specified",
                        }
                        
                        try:
                            req_headers = {
                                "apikey": SUPABASE_KEY,
                                "Authorization": f"Bearer {SUPABASE_KEY}",
                                "Content-Type": "application/json",
                                "Prefer": "return=minimal"
                            }
                            insert_res = requests.post(f"{SUPABASE_URL}/rest/v1/jobs", headers=req_headers, json=job_record)
                            if insert_res.status_code in [200, 201]:
                                inserted += 1
                        except Exception as e:
                            pass
                    print(f"  Inserted {inserted} new technical jobs for {board}.")
        except Exception as e:
            print(f"  Error processing {board}: {e}")


def scrape_jobicy():
    print("Scraping Jobicy (Global Remote Jobs)...")
    try:
        # Fetch 200 remote jobs across all categories, heavily weighted toward US timezone
        res = requests.get('https://jobicy.com/api/v2/remote-jobs?count=200&geo=usa', headers={'User-Agent': 'Mozilla/5.0'})
        if res.status_code != 200:
            print(f"  Failed to fetch Jobicy: {res.status_code}")
            return
            
        data = res.json()
        jobs = data.get('jobs', [])
        inserted = 0
        
        for job in jobs:
            title = job.get('jobTitle', '').lower()
            
            # 1. Strict Tech Filter
            tech_keywords = ['data', 'machine learning', 'artificial intelligence', 'nlp', 'deep learning', 'analytics', 'scientist', 'llm', 'computer vision', 'mlops', 'generative', 'robotics', 'researcher', 'automation', 'quant', 'ai']
            if not any(re.search(r'\b' + keyword + r'\b', title) for keyword in tech_keywords):
                continue
                
            # 2. Strict US Filter
            location_str = job.get('jobGeo', '')
            if not is_us_job(location_str):
                continue
                
            company_name = job.get('companyName', 'Unknown')
            job_url = job.get('url', '')
            
            # Use jobSlug as a unique fallback id
            job_id = job.get('id', job.get('jobSlug', ''))
            
            # Supabase lookup
            check_res = requests.get(f"{SUPABASE_URL}/rest/v1/jobs?url=eq.{job_url}&select=id", headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}"
            })
            job_exists = check_res.status_code == 200 and len(check_res.json()) > 0
            
            if not job_exists:
                html_content = job.get('jobDescription', '')
                soup = BeautifulSoup(html_content, 'html.parser')
                clean_text = soup.get_text(separator='\n', strip=True)
                
                exp_match = re.search(r'(\d+)\+?\s*years?[^\.]{0,40}?experience', clean_text, re.IGNORECASE)
                if not exp_match:
                    exp_match = re.search(r'(\d+)\+?\s*years?', clean_text, re.IGNORECASE)
                if exp_match:
                    exp_req = f"{exp_match.group(1)}+ years"
                else:
                    title_lower = title.lower()
                    if any(k in title_lower for k in ['staff', 'principal', 'vp', 'director', 'head', 'manager', 'lead', 'senior', 'sr.', 'sr ', 'chief']):
                        exp_req = 'Senior'
                    elif any(k in title_lower for k in ['mid', 'intermediate']):
                        exp_req = 'Mid-level'
                    elif any(k in title_lower for k in ['junior', 'jr', 'entry', 'intern', 'grad']):
                        exp_req = 'Entry Level'
                    else:
                        exp_req = 'Not Specified'
                
                posted_at = job.get('pubDate', '')
                
                job_data = {
                    "title": job.get('jobTitle', ''),
                    "company": company_name,
                    "location": location_str,
                    "url": job_url,
                    "experience_required": exp_req,
                    "description": clean_text[:15000],
                    "posted_at": posted_at if posted_at else None
                }
                
                insert_res = requests.post(f"{SUPABASE_URL}/rest/v1/jobs", headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                }, json=job_data)
                
                if insert_res.status_code in [201, 204]:
                    inserted += 1
                    
        print(f"  Inserted {inserted} new US Data/AI jobs from Jobicy.")
    except Exception as e:
        print(f"  Error processing Jobicy: {e}")


def scrape_themuse():
    print("Scraping The Muse (Traditional Corporate Jobs)...")
    try:
        inserted = 0
        headers = {'User-Agent': 'Mozilla/5.0'}
        # Loop through first 5 pages (100 jobs) of Data & Analytics in the US
        for page in range(1, 6):
            url = f"https://www.themuse.com/api/public/jobs?page={page}&category=Data%20and%20Analytics&location=United%20States"
            res = requests.get(url, headers=headers)
            if res.status_code != 200:
                print(f"  Failed to fetch The Muse page {page}: {res.status_code}")
                continue
                
            data = res.json()
            jobs = data.get('results', [])
            
            for job in jobs:
                title = job.get('name', '').lower()
                
                tech_keywords = ['data', 'machine learning', 'artificial intelligence', 'nlp', 'deep learning', 'analytics', 'scientist', 'llm', 'computer vision', 'mlops', 'generative', 'robotics', 'researcher', 'automation', 'quant', 'ai']
                if not any(re.search(r'\b' + keyword + r'\b', title) for keyword in tech_keywords):
                    continue
                    
                locations = job.get('locations', [])
                location_str = locations[0].get('name', 'United States') if locations else 'United States'
                
                # The Muse API is pre-filtered for US, but double check just in case
                if not is_usa_job(location_str):
                    continue
                    
                company_name = job.get('company', {}).get('name', 'Unknown')
                job_url = job.get('refs', {}).get('landing_page', '')
                
                check_res = requests.get(f"{SUPABASE_URL}/rest/v1/jobs?url=eq.{job_url}&select=id", headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}"
                })
                job_exists = check_res.status_code == 200 and len(check_res.json()) > 0
                
                if not job_exists:
                    html_content = job.get('contents', '')
                    soup = BeautifulSoup(html_content, 'html.parser')
                    clean_text = soup.get_text(separator='\n', strip=True)
                    
                    exp_match = re.search(r'(\d+)\+?\s*years?[^\.]{0,40}?experience', clean_text, re.IGNORECASE)
                    if not exp_match:
                        exp_match = re.search(r'(\d+)\+?\s*years?', clean_text, re.IGNORECASE)
                    if exp_match:
                        exp_req = f"{exp_match.group(1)}+ years"
                    else:
                        title_lower = title.lower()
                        if any(k in title_lower for k in ['staff', 'principal', 'vp', 'director', 'head', 'manager', 'lead', 'senior', 'sr.', 'sr ', 'chief']):
                            exp_req = 'Senior'
                        elif any(k in title_lower for k in ['mid', 'intermediate']):
                            exp_req = 'Mid-level'
                        elif any(k in title_lower for k in ['junior', 'jr', 'entry', 'intern', 'grad']):
                            exp_req = 'Entry Level'
                        else:
                            exp_req = 'Not Specified'
                    
                    posted_at = job.get('publication_date', '')
                    
                    job_data = {
                        "title": job.get('name', ''),
                        "company": company_name,
                        "location": location_str,
                        "url": job_url,
                        "experience_required": exp_req,
                        "description": clean_text[:15000],
                        "posted_at": posted_at if posted_at else None,
                        "source": "themuse"
                    }
                    
                    insert_res = requests.post(f"{SUPABASE_URL}/rest/v1/jobs", headers={
                        "apikey": SUPABASE_KEY,
                        "Authorization": f"Bearer {SUPABASE_KEY}",
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal"
                    }, json=job_data)
                    
                    if insert_res.status_code in [201, 204]:
                        inserted += 1
                        
        print(f"  Inserted {inserted} new US Data/AI jobs from The Muse.")
    except Exception as e:
        print(f"  Error processing The Muse: {e}")

def cleanup_old_jobs():
    print("Cleaning up old jobs to prevent database bloat...")
    try:
        from datetime import datetime, timedelta
        cutoff = datetime.now() - timedelta(days=30)
        
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        
        # Delete jobs where posted_at is older than 30 days
        res = requests.delete(f"{SUPABASE_URL}/rest/v1/jobs?posted_at=lt.{cutoff.isoformat()}", headers=headers)
        
        # Also delete jobs where created_at is older than 30 days (just in case posted_at was null)
        res2 = requests.delete(f"{SUPABASE_URL}/rest/v1/jobs?created_at=lt.{cutoff.isoformat()}", headers=headers)
        
        print(f"Cleanup complete. Status 1: {res.status_code}, Status 2: {res2.status_code}")
    except Exception as e:
        print(f"Error during cleanup: {e}")


def scrape_himalayas():
    print("Scraping Himalayas API...")
    try:
        res = requests.get('https://himalayas.app/jobs/api?limit=1000')
        if res.status_code != 200:
            print("  Failed to fetch Himalayas API")
            return
            
        data = res.json()
        jobs = data.get('jobs', [])
        inserted = 0
        
        for job in jobs:
            title = job.get('title', '').lower()
            
            # 1. Strict Tech Filter
            tech_keywords = ['data', 'machine learning', 'artificial intelligence', 'nlp', 'deep learning', 'analytics', 'scientist', 'llm', 'computer vision', 'mlops', 'generative', 'robotics', 'researcher', 'automation', 'quant', 'ai']
            if not any(re.search(r'\b' + keyword + r'\b', title) for keyword in tech_keywords):
                continue
                
            # 2. Strict USA Filter
            locations = job.get('locationRestrictions', [])
            loc_str = ", ".join(locations)
            if not is_usa_job(loc_str) and loc_str != '':
                continue
                
              # 3. Experience
              exp_match = re.search(r'(\d+)\+?\s*years?[^\.]{0,40}?experience', clean_text, re.IGNORECASE)
              if not exp_match:
                  exp_match = re.search(r'(\d+)\+?\s*years?', clean_text, re.IGNORECASE)
              
              if exp_match:
                  exp_req = f"{exp_match.group(1)}+ years"
              else:
                  sen = job.get('seniority', [])
                  if sen:
                      exp_req = ", ".join(sen)
                  else:
                      title_lower = title.lower()
                      if any(k in title_lower for k in ['staff', 'principal', 'vp', 'director', 'head', 'manager', 'lead', 'senior', 'sr.', 'sr ', 'chief']):
                          exp_req = 'Senior'
                      elif any(k in title_lower for k in ['mid', 'intermediate']):
                          exp_req = 'Mid-level'
                      elif any(k in title_lower for k in ['junior', 'jr', 'entry', 'intern', 'grad']):
                          exp_req = 'Entry Level'
                      else:
                          exp_req = 'Not Specified'

            
            # 4. Date
            pubDate = job.get('pubDate')
            posted_at = None
            if pubDate:
                from datetime import datetime
                posted_at = datetime.fromtimestamp(pubDate).isoformat()
                
            job_record = {
                "title": job.get('title'),
                "company": job.get('companyName'),
                "location": loc_str or "United States (Remote)",
                "description": job.get('description', '')[:15000],
                "url": job.get('applicationLink'),
                "source": "himalayas",
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
                
        print(f"  Inserted {inserted} new technical jobs from Himalayas.")
    except Exception as e:
        print(f"  Error processing Himalayas: {e}")


def scrape_remoteok():
    scrape_jobicy()
    print("Scraping RemoteOK API...")
    try:
        res = requests.get('https://remoteok.com/api', headers={'User-Agent': 'Mozilla/5.0'})
        if res.status_code != 200:
            print("  Failed to fetch RemoteOK API")
            return
            
        jobs = res.json()[1:] # First item is legal info
        inserted = 0
        
        for job in jobs:
            title = job.get('position', '').lower()
            
            tech_keywords = ['data', 'machine learning', 'artificial intelligence', 'nlp', 'deep learning', 'analytics', 'scientist', 'llm', 'computer vision', 'mlops', 'generative', 'robotics', 'researcher', 'automation', 'quant', 'ai']
            if not any(re.search(r'\b' + keyword + r'\b', title) for keyword in tech_keywords):
                continue
                
            loc_str = job.get('location', '')
            if not is_usa_job(loc_str) and 'worldwide' not in loc_str.lower() and loc_str != '':
                continue
                
            posted_at = job.get('date')
            
            job_record = {
                "title": job.get('position'),
                "company": job.get('company'),
                "location": loc_str or "United States (Remote)",
                "description": job.get('description', '')[:15000],
                "url": job.get('url'),
                "source": "remoteok",
                "experience_required": "Not Specified",
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
                
        print(f"  Inserted {inserted} new technical jobs from RemoteOK.")
    except Exception as e:
        print(f"  Error processing RemoteOK: {e}")


if __name__ == "__main__":
    scrape_greenhouse()
    scrape_workday()
    scrape_lever()
    scrape_ashby()
    scrape_himalayas()
    scrape_remoteok()
    scrape_jobicy()
    scrape_themuse()
    cleanup_old_jobs()
    print("Scraping complete!")

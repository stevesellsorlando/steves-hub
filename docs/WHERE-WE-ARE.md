# Where We Are: Steve's Real Estate Hub

_Last updated: November 22, 2026. This note and the plan are also saved in GitHub: steves-hub/docs/_

## About Steve
- Name: Steve
- Set up by: Sarah (Aspen Home Realty)
- If stuck, call Sarah: 720-717-0664
- CRM he uses now: Follow Up Boss

## Done so far
- [x] Step 1: Greeting and Claude tips (done, Steve is ready)
- [x] Step 2: Name the hub and share vision (done; Steve confirmed. His top two "take off my plate": keeping track of clients, and texting + emails)
- [x] Step 3: Feature checklist (done: yes to all 47, no extra ideas, added 3 of his own: probate list, morning message, Claude puts things on calendar)
- [x] Step 4: Homepage (done)
- [x] Step 5: Side menu + More + phone bar (done)
- [x] Step 6: Colors and logo (done)
- [x] Step 7: CRM setup (done; Steve approved the summary)
- [x] Step 8: Connections (done)
- [x] Step 9: Approvals (done)
- [x] Step 10: Services explained (done; Steve: "this all looks good")
- [x] Step 11: Confirm plan (done; plan + 6 must-haves saved in STEVES-HUB-PLAN.md)
- [ ] Step 12: Build (in progress: all 3 accounts DONE. Phase 1 code written on branch phase-1-starter (PR open): sign-in, side menu + phone bar, Last updated, Clients/Probates/Expireds lists, fast after-call screen, person card (notes, Called/Texted, follow-ups, details, Became a client), basic To-Do with type filters, simple Home. SQL: supabase/001_starter.sql. DONE: Steve ran supabase/001_starter.sql in steves-hub (Success). NEXT: creates his login user DONE: his hub login user created (password saved by Steve). New sign-ups turned OFF. PR #1 MERGED into main (Steve OK'd). NOW: Vercel import (Vercel import page open, NOT deployed yet; adding key 1 NEXT_PUBLIC_SUPABASE_URL from Supabase project home / Settings > Data API), then merge PR, then import in Vercel + add 2 keys.)

## Steve's choices so far
- Hub name: **Steve's Hub**
- Perfect hub would: keep track of his clients, keep him on time for appointments, show his calendar and the weather every day. (He says "clients.")
- Biggest frustration: wants the hub to put important things on his calendar for him; he isn't good at checking his calendar every day to see what he has to do. -> Idea: the hub should come to HIM (morning summary by text/email/phone notification), not wait for him to look.
- Morning: starts phone calls at 8 a.m. -> morning summary + "who to call today" list should reach him before 8.
- Works mostly on his computer -> design desktop-first (still works on phone).
- Works mostly with sellers -> listings/properties, seller reports, listing systems matter.
- About 1 to 10 deals a year -> keep it simple; staying in touch with people matters more than heavy deal machinery.
- Lead sources (his words): **"listings and calling on probate"**; very little from leads people send him. So: probate calling is the main engine; his listings bring in more business (sign calls, buyers/neighbors from listings). Online-lead inbox = low priority.
- Helpers: none, just Steve -> helper logins not needed now.
- Hour a week: wants the hub to **handle all his texting and emails** -> Claude drafts texts/emails, Steve approves, they send. Texting needs Twilio (explain in Step 8/10).
- Probate idea: probate = prospecting list; fits sellers focus. Needs: import probate list, track estate contact (executor/personal representative/attorney), follow-up cadence, status.
- Features (Step 3): **Yes to all 47** of Sarah's features (#44 helper logins will just sit unused until he needs one). Build order still decided by his 6 must-haves in Step 11.
- Homepage picks: **weather (+ week ahead), mortgage/lending rates, real estate news + social media ideas, active listings, this week's calendar incl. family events.** (He skipped to-dos, Needs your OK, who's due, probate calls on the homepage; those live on their own pages + morning message. Can revisit.)
- Weather + local news area: **Orlando, FL**
- Side menu (approved, + Expireds added in Step 7): **Home, Calendar, To-Do, Clients, Probates, Expireds, Listings, Marketing, Bookkeeping, Tracker, More**
- Under More: Leads, Open Houses, Systems, Growth, Local know-how, Personal, Settings (and anything else)
- Phone bottom bar: **Home, Calendar, Clients, Probates, More**
- Colors: **Charcoal + gold** (classic, upscale)
- Brokerage: **Royalty Real Estate Boutique**
- Logo: brokerage logo (gold "RR" with a crown on black) saved at assets/brokerage-logo.png. Matches charcoal + gold.
- Family events: show on homepage next to work. Today they reach him by **texts or emails** from his spouse. Idea: he forwards/tells Claude and it goes on the calendar; or later a shared family calendar.
- Added (his yes): **Probate list page**, **Morning "here's your day" text/email before 8 a.m.** (appointments, weather, who to call, what's due), **tell Claude and it goes on the calendar with a reminder**.

## CRM setup (Step 7)
- How he uses FUB today (his words): after each call where the name and phone are confirmed correct, he adds the person to FUB, writes notes on what they told him, and adds a follow-up task. Does the same for a listing or a probate home (creates a follow-up task). -> Core loop for the hub: **call -> add/confirm person -> note -> next follow-up task**. Make that one fast screen.
- Separate lists: wants **probate leads** and **listing/expired leads** kept SEPARATE (own pages), apart from regular Clients. NOTE: his earlier "listings" lead source likely means **expired listings** prospecting. -> Page named **Expireds**. Side menu now: Home, Calendar, To-Do, Clients, Probates, **Expireds**, Listings, Marketing, Bookkeeping, Tracker, More. (Phone bar unchanged for now; maybe ask if Expireds should replace something.) Probate/Expired lead -> one click moves to Clients with notes.
- Tasks: one-tap "Follow up in 1 day / 3 days / 1 week / 2 weeks / 1 month / pick a date" on every card; daily follow-ups on To-Do + morning message. (approved)
- Notes: dated timeline on every card, newest first; type, microphone, or tell Claude; note + follow-up on the same screen. (approved)
- Tags: unlimited labels per card, tap to filter, FUB tags import. (approved)
- Email: templates (bring FUB templates over), Claude drafts from notes, all wait in Needs your OK, send from his real address. Needs email connection + spam check (SPF/DKIM/DMARC). (approved)
- Appointments: connect Outlook/Google calendar, "Set appointment" button on every card linked to the person, reminders, today's appts in morning message, family events too. (approved)
- Likes most about FUB (keep): **easy to add people, task reminders, everything for a person on one page.** (Not attached to its look.)
- FUB frustrations (FIX THESE): (1) **hard to find all the people with the same kind of task** (e.g. all expired-listing follow-ups) -> give every task a type (Expired / Probate / Client / Listing...) and one-click filters + "Call list" mode that walks through them. (2) **sending scheduled / automatic emails** is hard -> "Send later" on any email + simple email plans (e.g. expired series day 1/3/7/14), approve the whole series once.
- Setup style: **Make it like Follow Up Boss** (familiar), minus the two frustrations.
- FUB research notes: stages commonly Lead, Hot Prospect, Nurture, Active Client, Pending, Closed, Past Client, Sphere, Trash (customizable; teams vary). Export: People > All People > select > Export, tick **All Columns** (else only visible columns). Notes may NOT be in the CSV; test with a small export. Exporting doesn't delete anything in FUB. (Network blocks followupboss.com; found via web search.)
- Stages (approved): Clients = **Lead, Hot Prospect, Nurture, Active Client, Pending, Closed, Past Client, Sphere, Trash**. Probates & Expireds = **New, Attempted, Talked To, Appointment Set, Not Interested, Became a Client** (Became a Client -> moves to Clients with notes).
- Check-in reminders: **No**, follow-up tasks are enough. (Can add later. Safety net: list of anyone with "no follow-up task set" (promised to build).)
- Buyer/Seller/Both + Signed/Verbal/Not yet on client cards: **Yes**.
- Extra card fields (all yes): timeframe to sell, price in mind, reason for selling, where they're moving to, mortgage balance / free and clear, buyers: pre-approved + lender + price range, how they found me.
- Couples default: **one card per couple** ("Mike & Lisa Garcia"), both phones/emails on it; can link separate cards when needed.
- Day-one tags: **Sphere / Friends & Family, Investor, Executor, Vacant Property, Needs Repairs / As-Is, Out of State Owner, Referral Source, Vendor** (+ his FUB tags import). Skipped: Past Client (it's a stage), Probate Attorney.
- Lead sources: **Probate, Expired listing, Sign call, Referral, Sphere, Past client, Open house, Zillow / Realtor.com, My website or social media, My brokerage (Royalty)**. (Skipped FSBO, prospecting tools.)
- Smart lists (each with "Start calling" walk-through): **Today's follow-ups, Overdue follow-ups, Probate follow-ups due today, Expired follow-ups due today, Appointments set, Sphere & past clients not contacted in 6 months.** (Didn't pick "No follow-up set"; keep it tucked away, not on main lists.)
- Pipeline boards (approved): SELLERS = **Appointment Set, Signed, Coming Soon, Active, Pending, Closed**; BUYERS = **Appointment Set, Signed, Showing Homes, Offer Made, Pending, Closed**.
- Follow-up plans for: **New probate lead, New expired lead, After listing appointment (not signed), Under contract (seller updates), After closing (thank you, review, anniversary)**. Plans stop on appointment/not interested. Emails still follow approval rules (Step 9).
- Client card (approved): name, buyer/seller, signed, stage, source, phones, emails, address, tags, selling details, buying details, birthday, home anniversary, kids, notes timeline, follow-ups, appointments, emails sent, files, homes sent, referral info **+ closing date, best time to call, preferred contact (call/text/email), social media**.
- Team / lead routing: **not needed** (solo). Skipped Q16.
- Email: **Google, with his own domain** (Google Workspace). When connecting: check SPF/DKIM/DMARC ("ID card") click by click in Google Admin + his domain's DNS.
- Calendar: **Google Calendar** (connect, two-way).
- Texting: **No texting in his hub** (he'll text on his own). No Twilio. NOTE: he earlier wanted texting off his plate; one-tap "Called"/"Texted" log buttons still useful. Could offer draft-and-copy later.
- Website lead forms: **No website**, skip for now.
- Quick links: **Stellar MLS, Form Simplicity (contracts), ShowingTime, Orange County Property Appraiser** (property records). Never share MLS login.
- Claude app connector: **Yes** (project named "Steve's Hub"; say "In Steve's Hub, ...").
- In-hub "Ask Claude" button: **Later** (no Anthropic API needed for now).
- Approvals (Step 9): **Ask me first for everything** (adding, updating, to-dos/calendar, logging, bulk changes, emails). Follow-up plan emails also wait in Needs your OK each time until he loosens it.
- Prices checked Nov 2026: Claude Pro $20/mo, Max $100/mo; Supabase Pro $25/mo (daily backups, no pausing; Free pauses after 7 idle days); Vercel Hobby free (personal, non-commercial), Pro $20/mo; Follow Up Boss Grow ~$69/mo monthly or ~$58/mo annual. Google Workspace: already paying. Anthropic API: not needed (button = later).
- 6 must-haves (approved, build first): (1) Clients/Probates/Expireds + fast after-call screen, (2) FUB import, (3) Google email draft-approve-send, (4) Google calendar, (5) To-Do with follow-up types + Start calling, (6) Homepage + morning email.
- Vercel: **Free (Hobby) while building, Pro ($20/mo) once used for real business.**
- Export: Steve **has exported from FUB before**. Do a small test export first to check notes come along. Do NOT cancel FUB until hub is checked.
- FUB features he actually uses: **People list, Tasks, Notes, Tags, Email templates + sending email, Appointments/calendar.** Doesn't use: stages, smart lists, action plans, lead inbox/routing, dialer, texting, pipeline, website tracking, phone app.

## Accounts set up (never passwords)
- Vercel: signed up with GitHub (protected by GitHub two-step login), **Hobby** plan. Project not imported yet.
- Supabase database: **001_starter.sql run** (people, notes, tasks + privacy rules).
- Supabase: signed up with GitHub (protected by GitHub two-step login); organization **Steve's Hub** (Free plan); project **steves-hub** (East US). DB password saved by Steve (not here). Move to Pro ($25) before real clients go in.
- GitHub: username **stevesellsorlando**, connected to Claude (app installed on steves-hub only) (account created; private repo **steves-hub**; **two-step login ON** with Google Authenticator; recovery codes downloaded + kept safe by Steve)

## Very next step
- Walk Steve click by click: (1) Supabase SQL Editor (project steves-hub) -> paste supabase/001_starter.sql -> Run -> "ran it". (2) Supabase Authentication > Users > Add user (his email + a new password, Auto Confirm) and turn OFF new sign-ups. (3) Merge PR. (4) Vercel: import steves-hub, add NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (from Supabase Project Settings > API / API Keys), Deploy. (5) Practice with 5-6 made-up people.

## Where I got stuck
- Supabase SQL Editor: Steve saw a notice "Snippets no longer save automatically" instead of the empty box I described, and thought he was in the wrong place. **Fix: that notice is just a banner inside the SQL Editor; close it and click "+" / New query.** (Sarah: describe that banner in the instructions.)
- GitHub two-step login: the 6-digit code from Google Authenticator kept failing ("verification code failed"), even with a fresh code. **Fix: on iPhone, Settings > General > Date & Time > "Set Automatically" ON, then a fresh code worked.** (Sarah: worth adding this tip before the code step.)

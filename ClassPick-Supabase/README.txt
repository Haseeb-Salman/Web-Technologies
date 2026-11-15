CLASSPICK - HTML, CSS, JAVASCRIPT + SUPABASE
================================================

FILES
- login.html / login.js: administrator login
- index.html / app.js: student management and random picker
- style.css: responsive dark neon design
- vercel.json: simple Vercel configuration
- supabase-setup.sql: database table, access policies and 50-student limit

IMPORTANT: SUPABASE SETUP
1. Create a project at https://supabase.com/
2. Open SQL Editor and run all contents of supabase-setup.sql.
3. Open Authentication > Providers > Email and disable new user signups.
4. Open Authentication > Users and create your administrator user manually.
5. Open Project Settings > API (or API Keys). Copy the Project URL and publishable key (or legacy anon key).
6. Open BOTH app.js and login.js. Replace:
   YOUR_SUPABASE_PROJECT_URL
   YOUR_SUPABASE_PUBLISHABLE_KEY
   with your actual project URL and publishable key.
7. Save both files.

SECURITY
- Row Level Security is enabled.
- The policies in this starter project allow any authenticated Supabase user to access student records.
- Therefore, keep public signups disabled and create only trusted administrator accounts.
- Never put the Supabase service_role/secret key in browser code.

RUN LOCALLY
Because this project uses JavaScript modules, open it through a local static server, not by double-clicking the HTML file. You can use VS Code Live Server.

DEPLOY TO VERCEL
1. Upload the project folder to a GitHub repository.
2. Import that repository at https://vercel.com/new
3. Select Other as framework preset; leave the root directory as the project folder.
4. Deploy. No Node.js server or npm install is required.

FEATURES
- Admin email/password login
- No signup page
- Add, search, and remove students
- Maximum 50 students (also enforced by database trigger)
- Unique roll numbers
- Numeric-aware roll sorting
- Random selection without repeats until a new round
- Clear all student records
- Responsive layout

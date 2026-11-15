CLASSPICK - BS-IT MULTI-SEMESTER VERSION

FILES
- login.html / login.js: Supabase admin login
- index.html / app.js: semester dashboard, student records and random picker
- style.css: responsive dark neon UI and animations
- vercel.json: Vercel routing
- supabase-migration.sql: run ONCE in your existing Supabase SQL Editor

IMPORTANT BEFORE RUNNING
1. Open app.js and login.js.
2. Replace YOUR_SUPABASE_PROJECT_URL and YOUR_SUPABASE_PUBLISHABLE_KEY with the SAME values used by your current project.
3. Do not create a new Supabase project. This version is designed to use your existing database.

DATABASE MIGRATION
1. BACK UP your Supabase table first (recommended).
2. Open Supabase Dashboard > SQL Editor.
3. Paste and run the contents of supabase-migration.sql once.
4. This migration assigns all existing students with no class_name to BS-IT 5th Semester.
5. It removes the old globally-unique roll constraint and makes roll numbers unique within each semester.
6. It replaces the old global 50-student trigger with a per-semester 50-student limit.

RUN LOCALLY
Open the folder in VS Code and use Live Server on login.html. Do not open the HTML file directly using file://.

DEPLOY TO VERCEL
Push these files to your GitHub repository, import the repository into Vercel, choose Other, leave build command empty, and use the project root as output directory. Set Supabase Authentication > URL Configuration > Site URL and Redirect URLs to your deployed Vercel URL.

NOTE
Existing 5th semester records are preserved by the SQL migration. The special popup messages for roll numbers 241901-241926 and 241927-241950 are retained.

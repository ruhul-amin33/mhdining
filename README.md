# Muktijoddha Hall Dining Portal
Database = Google Sheet, Backend = Google Apps Script, Hosting = Vercel.

## Step 1 — Google Sheet + Backend (5 min)
1. sheets.google.com -> notun Sheet banan, naam: "Muktijoddha Hall Dining".
2. Menu: Extensions -> Apps Script.
3. Code.gs-er shob muche `apps-script/Code.gs` file-er code paste korun. Save.
4. Upore function dropdown theke `setup` select kore **Run** korun. Permission Allow korun (ekbar). Sheet-e Settings, Notices, Payments tab toiri hobe.
5. Left menu: Project Settings (gear) -> Script Properties -> `ADMIN_PASSWORD` ache (default `admin123`). Value change kore nijer password din.
6. Deploy -> New deployment -> Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   -> Deploy -> **Web app URL** copy korun.

## Step 2 — config.js
`config.js` file khule URL ta boshan:
    window.API_URL="https://script.google.com/macros/s/XXXX/exec";

## Step 3 — Vercel-e host
Option A (shohoj): vercel.com -> Add New -> Project -> folder drag&drop (index.html, config.js, vercel.json) -> Deploy.
Option B: GitHub-e push kore Vercel-e import korun. (Framework: Other, build command lagbe na.)

## Manager change (protি 30 din)
Page-e "Manager Login" -> Manager Panel-e naam, phone, term start date, bKash/Nagad number set korun
ar "Notun Manager Password" diye password bodle din. Notun manager-ke shudhu password din.

## Notes
- Apps Script code change korle: Deploy -> Manage deployments -> Edit -> New version.
- Student kewl nijer number/Trx ID diye login kore nijer tottho dekhe; onner list shudhu manager dekhe (password diye).
- Shob data Google Sheet-e thake; sheet theke Excel/CSV download kora jay.

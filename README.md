# مفتاح العلوم — Miftah-ul-Uloom

اسلامی مدارس، علماء اور طلباء کے لیے عربی و اردو کتب کی ڈیجیٹل لائبریری اور تحقیقی پلیٹ فارم۔

An Islamic digital library and research platform (Next.js + TypeScript + MongoDB) for managing, reading,
and searching Arabic/Urdu Islamic books, with diacritic-insensitive Arabic search and one-click A'raab
show/hide.

## ✅ What's implemented

- Next.js 16 App Router, TypeScript, Tailwind CSS, full RTL Arabic/Urdu UI
- Islamic design system (deep green / gold / cream, `app/globals.css`)
- MongoDB (Mongoose) schema with page-wise text + normalized (diacritic-stripped) search index
- PDF upload → text extraction (pdfjs-dist) → normalization → indexing, done once at upload time
- Search inside a single book, search across the whole library, and search by book name/metadata
- Diacritic-insensitive Arabic search (`lib/arabic.ts`): strip/restore A'raab, normalize Alef/Yaa/Taa
  Marbuta forms, highlight matches while preserving the original diacritized text for display
- PDF reader (`react-pdf` / pdf.js) with zoom, page navigation, fullscreen, text selection
- Copy with/without A'raab, and DOCX export (RTL-correct `.docx` via the `docx` package)
- Admin dashboard: add / edit / delete books, upload progress states, delete confirmation
- Admin authentication: bcrypt password hash + JWT session cookie, protected `/admin/*` routes
- Pluggable file storage: Vercel Blob in production, local `/public/uploads` fallback for dev
- Empty/error/loading states in Urdu throughout, SEO metadata, `sitemap.xml`, `robots.txt`

## ⚠️ What you still need to do

1. **Provision MongoDB** (e.g. MongoDB Atlas free tier) and set `MONGODB_URI`.
2. **Choose file storage** for PDFs/covers — the app defaults to **Vercel Blob**
   (`BLOB_READ_WRITE_TOKEN`); without it, files are written to `/public/uploads` locally,
   which is fine for development but **not** for Vercel's read-only filesystem in production.
3. **Set admin credentials** — run `node scripts/hash-password.js yourPassword` and put the
   result in `ADMIN_PASSWORD_HASH`, plus `ADMIN_USERNAME` and a random `JWT_SECRET`.
4. **OCR for scanned PDFs**: the app detects non-searchable (image-only) PDFs and flags them
   (`isSearchable: false`) instead of pretending they're indexed — it does not run OCR itself.
   Plug in a service like Tesseract.js, Google Vision, or Azure OCR in `lib/pdf.ts` if you have
   scanned books.
5. **Add your ~100 books** through `/admin` once deployed.

## Getting started (local dev)

```bash
cp .env.example .env.local   # fill in MONGODB_URI, ADMIN_*, JWT_SECRET
node scripts/hash-password.js "yourPassword"   # copy output into ADMIN_PASSWORD_HASH
npm install
npm run dev
```

Visit `http://localhost:3000`. Admin panel: `http://localhost:3000/admin` (redirects to login).

## Deploying to Vercel

1. Push this project to a GitHub repo, import it in Vercel.
2. In Vercel → Storage, create a **Blob** store and it will auto-populate `BLOB_READ_WRITE_TOKEN`.
3. Add the remaining environment variables from `.env.example` in Vercel → Settings → Environment
   Variables (`MONGODB_URI`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET`).
4. Deploy. Large PDF uploads happen through the `/api/books` route — Vercel's default body-size
   limit is 4.5MB on Hobby; for bigger PDFs either upgrade plan limits or switch the upload flow to
   direct-to-Blob client uploads (`@vercel/blob`'s `upload()` client helper) if needed.

## Project structure

```
app/
  page.tsx                 Homepage (hero, stats, recent books)
  library/                 Library listing + reader ([id])
  search/                  Global search (book-name / content modes)
  admin/                   Admin dashboard, login, new/edit book forms
  api/                     books CRUD, search, auth, docx export, stats
components/                BookCard, BookForm, PdfViewer, InBookSearch, AraabToggle, Navbar, Footer
lib/
  arabic.ts                A'raab strip/restore, normalization, highlighting
  pdf.ts                   PDF text extraction (pdfjs-dist)
  db.ts / models/Book.ts   MongoDB connection + schema
  auth.ts                  Admin JWT session helpers
  storage.ts               Vercel Blob / local file storage
scripts/hash-password.js   Generates ADMIN_PASSWORD_HASH
```

## Notes on the A'raab (diacritics) feature

- The original PDF file is **never modified**. A'raab removal/restoration only affects extracted
  text shown in search results, the "selected text" copy popup, and DOCX export.
- Search always matches diacritic-insensitively: a query for `الصلاة` matches `الصَّلَاةُ` in the
  indexed text, because both the stored index and the incoming query are normalized the same way
  before comparison (`normalizeForSearch` in `lib/arabic.ts`).
- The PDF page itself (canvas image) always renders exactly as authored in the source PDF — A'raab
  visibility toggling doesn't (and can't, without re-rendering/OCR) change the visual glyphs on the
  page image itself, only the extracted/copyable text layer.

# FairchildDoodles Website

Static marketing site for Fairchild Golden Doodles. Pure HTML/CSS/JS, deployed via Azure Static Web Apps.

## Quick Start
- Open `index.html` in a browser for a quick preview.
- For local testing with fetch-based assets, run a simple local server (example below).

### Simple local server (optional)
If you want to avoid any `file://` restrictions:
```powershell
python -m http.server 5500
```
Then visit `http://localhost:5500`.

## Site Structure
Top-level pages:
- `index.html` — Home
- `about.html` — About Us
- `puppies.html` — Available puppies
- `gallery.html` — Puppy Gallery (grid + lightbox)
- `contact.html` — Contact/Reserve form

Core assets:
- `styles.css` — Global styling
- `script.js` — Shared behaviors (nav toggle, scroll reveal, carousel, gallery lightbox)
- `logo.png` — Brand logo

## Images & Media
Images live in `Pictures/` and its subfolders.

### Parents carousel
Folder: `Pictures/parents-carousel/`
- The Meet the Parents carousel reads images from this folder.
- To add/remove images: update the HTML slides in `index.html` and `about.html`.

### Puppy gallery
Folder: `Pictures/puppy-gallery/`
- The gallery page loads images from `Pictures/puppy-gallery/manifest.json`.
- A build script keeps this manifest and the inline gallery JSON up to date.

### Family portraits
Folder: `Pictures/FamilyPortraits/`
- Used in the “Welcome to the Family” section on the home page.

## Updating Content
### Home page hero text
File: `index.html`
- Headline and subtext are in the hero section.
- Styling lives in `styles.css` under the `.hero` section.

### Meet the Parents (carousel + info card)
Files:
- `index.html` and `about.html` (markup)
- `styles.css` (layout + styling)
- `script.js` (carousel behavior)

To add a new slide:
1. Add your image into `Pictures/parents-carousel/`.
2. Add another `.parents-slide` block in both `index.html` and `about.html`.

### Puppy Gallery (grid + lightbox)
File: `gallery.html`
- Grid is generated from JSON data.

To add images:
1. Put images in `Pictures/puppy-gallery/`.
2. Run the manifest builder script (see below).
3. Commit changes.

## Gallery Manifest Script
Script: `scripts/build-gallery-manifest.ps1`

This script:
- Scans `Pictures/puppy-gallery`
- Rewrites `Pictures/puppy-gallery/manifest.json`
- Updates the inline JSON in `gallery.html`

Run it after you add/remove gallery images:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-gallery-manifest.ps1
```

## Deployment (Azure Static Web Apps)
The site deploys via GitHub Actions.

Workflow file:
- `.github/workflows/azure-static-web-apps-witty-field-0ff29f010.yml`

Important:
- The secret used by the workflow must match the Static Web App deployment token.
- If the action fails with “No matching Static Web App was found or the api key was invalid,” regenerate the token in Azure and update the repo secret.

## Common Edits
- **Nav links:** update in all HTML files (or use search/replace).
- **Colors and typography:** `styles.css` under `:root` and font sections.
- **Gallery layout:** `styles.css` under “Puppy gallery page”.
- **Carousel behavior:** `script.js` under “Parents Carousel”.

## Troubleshooting
### Gallery images not showing
Cause: manifest/inline JSON missing new files.  
Fix: run the manifest script and commit the changes.

### Azure deploy fails with token error
Cause: wrong/expired deployment token.  
Fix: Azure Portal → Static Web App → Manage deployment token → regenerate → update GitHub secret.

## Notes
- This is a static site: no backend is required.
- The contact form is frontend-only (no email sending). Integrate a backend endpoint if needed.

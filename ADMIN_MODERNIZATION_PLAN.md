# DoodleSite Admin Modernization Plan

## Document Purpose

This document defines the approved game plan for evolving DoodleSite from a developer-maintained static site into an admin-friendly Azure Static Web App with browser-based content management.

This is a planning document only. It describes the architecture, admin experience, storage model, security model, and implementation phases that will be used when development begins.

## Project Goals

The current site works, but it relies on manual HTML edits and manual image organization. The goal is to replace that workflow with an admin experience that allows approved admins to sign in and update the site without editing source files.

The target experience is:

- an admin logs in through Google
- the admin can create and update litters
- the admin can add or update puppies within litters
- the admin can upload and organize puppy photos
- the admin can manage gallery photos
- the admin can manage selected homepage, about page, and other site images
- the admin can edit approved text areas from text boxes in the admin dashboard
- changes go live immediately after save

The solution should remain efficient, inexpensive to host, and simple to maintain.

## Approved High-Level Direction

The site will remain on Azure Static Web Apps and be extended rather than rebuilt from scratch.

Approved decisions:

- authentication: provider-based login
- provider: Google
- hosting direction: stay on Azure Static Web Apps
- admin scope: litters, puppies, gallery images, selected site images, selected site text
- publishing model: immediate live updates, no draft/publish workflow

One future configuration item is still intentionally deferred:

- the exact Google account or allowlist of Google accounts will be provided later

## Why This Direction Fits The Current Site

The current repository is a static HTML, CSS, and JavaScript site with images stored locally and deployed through Azure Static Web Apps. That existing shape is useful because:

- the public site is already lightweight and fast
- the public-facing layout does not need a full redesign to become manageable
- Azure Static Web Apps can support both the public site and a small backend
- the largest pain point is content maintenance, not public rendering performance

This means the best path is not a full replacement. The best path is a hybrid model:

- keep the public site lightweight
- move changing content into managed storage
- add a protected admin dashboard
- add API endpoints for content reads and writes

## Current Pain Points

The site is currently difficult to administer because content updates are tightly coupled to code edits.

Examples:

- `puppies.html` is manually hard-coded for each puppy and each weekly image
- gallery updates depend on image folder changes and manifest regeneration
- page copy changes require editing HTML files directly
- there is no admin authentication or browser-based editing surface
- images live in the repo, which increases repository weight over time

This creates unnecessary maintenance overhead and makes normal business tasks feel like developer tasks.

## Target Architecture

The site will move to a static-plus-dynamic-content architecture.

### Public Site

The public-facing pages remain part of the Azure Static Web App. The public site continues to serve the main pages, but content that changes frequently will no longer be baked into HTML.

The public site will:

- keep the current site structure where possible
- continue serving static assets for layout and styling
- fetch dynamic content for litters, puppies, gallery images, and editable text areas

### Backend

An `api/` backend will be added using Azure Functions. This backend will handle:

- authenticated admin access checks
- content CRUD operations
- image upload orchestration
- content retrieval for public pages
- validation and normalization of admin inputs

### Storage

Two storage systems will be used:

1. Azure Blob Storage for images
2. Azure Table Storage for structured content records and metadata

This is the recommended balance of low cost, good performance, and manageable complexity.

## Authentication And Authorization

### Approved Login Strategy

The admin will log in using a Google account through Azure Static Web Apps authentication.

This is preferred over a site-managed username/password because it avoids:

- password storage
- password reset flows
- password hashing and credential lifecycle management
- a larger security surface area

### How Login Will Work

Target admin flow:

1. Admin visits `/admin`
2. The site checks whether the user is authenticated
3. If the user is not authenticated, the site redirects to sign in with Google
4. If the user is authenticated but not approved, access is denied
5. If the user is authenticated and approved, the admin dashboard loads

### Where Login Credentials Are Held

The site itself will not hold the admin password.

Instead:

- authentication is delegated to Google through Azure Static Web Apps auth
- the app stores only the authenticated identity information needed to authorize the admin
- approved admin email addresses or identities will be defined later during setup

### Authorization Model

Not every authenticated user should become an admin. The system will enforce an allowlist.

Recommended model:

- maintain a list of approved admin email addresses or identity IDs
- validate that list on protected API routes
- reject all admin operations unless the user matches the allowlist

This allows the Google login strategy to remain simple while still keeping the admin area private.

## Admin Experience Blueprint

The admin area should feel like a content dashboard, not a developer tool.

### Admin Dashboard Sections

The initial dashboard should be organized into these areas:

- Overview
- Litters
- Puppies
- Gallery
- Site Images
- Text Content
- Settings or Access Summary

### Overview

The overview page should show quick operational context:

- active litters
- total available puppies
- recent image uploads
- quick links to common tasks

### Litters

This section should allow the admin to:

- create a new litter
- edit litter details
- archive old litters
- set the current active litter
- update litter-level banner or summary text

### Puppies

This section should allow the admin to:

- add puppies under a litter
- set display names
- set gender
- set bow or collar labels
- set price
- set availability status
- arrange display order
- upload and organize puppy-specific photos

### Gallery

This section should allow the admin to:

- upload gallery photos
- reorder gallery items
- edit alt text
- remove outdated gallery items

### Site Images

This section should be limited to approved image zones rather than allowing uncontrolled edits everywhere.

Examples of manageable image zones:

- homepage hero or featured section imagery
- parent section images
- about page image blocks
- other intentional marketing image slots

This keeps the system structured and avoids a chaotic free-for-all media model.

### Text Content

This section should expose selected editable copy blocks in a safe and organized way.

Examples:

- home hero title
- home hero subtitle
- announcement banner text
- page section intros
- about page body copy
- allergy page explanatory copy
- contact page informational text

This does not mean every sentence on the site should be unstructured rich text. It means approved text blocks should be individually mapped to editable fields.

## Immediate Publish Model

You chose not to use drafts. That simplifies the content lifecycle.

The publishing behavior will be:

- admin saves a change
- backend validates and stores the update
- the public site reads the new content immediately

Benefits:

- fewer states to manage
- faster admin workflow
- less implementation overhead

Risks:

- mistakes go live right away
- accidental deletes or bad wording changes become instantly visible

Required guardrails:

- delete confirmations
- image previews before final save
- validation for required fields
- lightweight success/failure messaging

## Storage Design

### Image Storage: Azure Blob Storage

All admin-managed images should be stored outside the repo in Azure Blob Storage.

This is important because:

- the git repository should not grow indefinitely from image uploads
- images are better served from object storage than from source control
- uploads can be managed without code deployments

Recommended folder organization:

- `images/litters/{litter-id}/`
- `images/litters/{litter-id}/{puppy-id}/`
- `images/gallery/`
- `images/site-sections/`

Example:

- `images/litters/2026-02-05/pink-bow/`
- `images/site-sections/home-hero/`

### Content Storage: Azure Table Storage

Structured site content should be stored in Azure Table Storage.

This is recommended because:

- it is inexpensive
- it is sufficient for the expected scale
- it works well for structured records
- it avoids the extra cost and complexity of a more advanced database unless needed later

### Why Not Keep Images In The Repo

Keeping admin-uploaded images in the repository would create several problems:

- repository size would grow continuously
- content updates would still depend on git-based workflows
- image management would remain developer-centric
- deployment history would become cluttered with binary content

Blob Storage is the correct place for this type of media.

## Memory And Storage Efficiency Strategy

The site should be efficient both in storage use and page delivery.

### Upload Pipeline Expectations

When an admin uploads an image, the system should:

1. validate file type and size
2. store the uploaded source safely
3. generate optimized derivatives for public use
4. save only the metadata required for retrieval and display

### Image Variants

Recommended variants:

- thumbnail for admin listings and cards
- medium optimized display image for most public views
- optionally original image for archive or future reuse

### Format Strategy

Recommended public-serving format:

- WebP for optimized public display when practical

Depending on the upload pipeline, original files may remain as JPEG or PNG if needed for archival reasons, but public pages should prefer optimized display variants.

### Public Rendering Efficiency

The public site should:

- lazy-load non-critical images
- use smaller thumbnails where cards are shown
- avoid loading all puppy images at once when not needed
- minimize repeated downloads through stable URLs and caching

### Admin Interface Efficiency

The admin dashboard should:

- use thumbnails instead of full images in list views
- paginate or progressively load large galleries if needed
- avoid loading every image record into a single initial page

## Content Model

The content system should be intentionally structured. It should not become a single giant bucket of freeform JSON.

### Litter Record

Suggested fields:

- `id`
- `title`
- `birthDate`
- `readyDate`
- `status`
- `bannerText`
- `summaryText`
- `defaultMalePrice`
- `defaultFemalePrice`
- `heroImageId`
- `displayOrder`

Notes:

- `status` can support values like `active` and `archived`
- only one litter may be treated as the current public litter at a time, unless a future requirement changes that behavior

### Puppy Record

Suggested fields:

- `id`
- `litterId`
- `displayName`
- `gender`
- `colorLabel`
- `price`
- `availabilityStatus`
- `description`
- `featuredImageId`
- `displayOrder`

Expected availability states:

- `available`
- `reserved`
- `sold`

### Image Record

Suggested fields:

- `id`
- `ownerType`
- `ownerId`
- `storagePath`
- `thumbnailPath`
- `altText`
- `displayOrder`
- `weekLabel`
- `isActive`
- `sectionKey`

Examples of `ownerType`:

- `litter`
- `puppy`
- `gallery`
- `site-section`

### Editable Text Block Record

Suggested fields:

- `id`
- `pageKey`
- `sectionKey`
- `fieldLabel`
- `contentValue`
- `inputType`
- `displayOrder`
- `isActive`

Example block IDs:

- `home.hero.title`
- `home.hero.subtitle`
- `home.banner.announcement`
- `about.family.body`
- `contact.info.summary`

This approach gives the admin direct control over important copy while keeping the system structured and predictable.

## Public Site Rendering Strategy

The public site will gradually move from hard-coded content to data-driven content.

### Pages That Should Become Data-Driven First

Priority order:

1. `puppies.html`
2. `gallery.html`
3. selected homepage sections
4. selected about page sections

### Puppies Page

Current condition:

- puppy cards and weekly images are hard-coded in HTML

Target condition:

- the page shell remains in place
- the page fetches litter and puppy data
- puppy cards are rendered from live records
- image sets are loaded from managed metadata

### Gallery Page

Current condition:

- image updates depend on a local image folder and a manifest generation step

Target condition:

- gallery items come from managed image records
- no manual manifest maintenance is required for admin uploads

### Site Copy And Marketing Sections

Only approved text and image zones should become editable. The page layout still remains code-defined, but content values are filled from managed records.

This avoids turning the site into a full generic page builder, which would add complexity without clear value.

## Admin-Editable Scope

The admin should be able to manage the following categories from the browser:

- litter records
- puppy records
- puppy photo collections
- gallery images
- selected homepage images
- selected about page images
- other intentional marketing image slots
- selected site text blocks

The admin should not be given uncontrolled access to arbitrary code, layout, CSS, or template logic. That remains part of the application and should continue to be managed through development changes.

## Approved Editable Content Inventory

The editable scope is now more specifically defined. The admin should be able to change content within structured fields and text boxes, but should not be able to alter the underlying layout or design system.

### Puppies Page: Dog And Puppy Management

The admin should be able to:

- add a new dog or puppy record to a litter
- rename existing dogs or puppies
- update puppy status such as available, reserved, or sold
- update pricing
- upload and reorder puppy photos
- add a paragraph-style description for each puppy if desired

Recommended puppy fields:

- display name
- litter association
- gender
- color or collar label
- price
- availability status
- short summary
- longer paragraph description
- featured image
- photo gallery

Important UI rule:

- the admin should edit puppy descriptions in text areas attached to each puppy record, not by editing HTML directly

### About Page: Expandable Paragraph Content

On the About page, the admin should be able to add to and revise the existing story paragraphs without changing the page layout.

This means the admin can manage:

- the page intro subtitle if desired
- the `Our Story` paragraph group
- parent section descriptive copy if that is included in scope later

Recommended approach for the `Our Story` section:

- store the content as an ordered list of paragraph blocks
- allow the admin to edit existing paragraphs
- allow the admin to add a new paragraph block
- allow the admin to remove a paragraph block
- keep a sensible maximum so the page does not become visually unbalanced

Recommended content keys:

- `about.header.subtitle`
- `about.story.paragraphs`

Optional if included later:

- `about.parents.intro`
- `about.parents.summary`
- `about.parents.sadie.description`
- `about.parents.bronco.description`

### Contact Page: Structured Text Box Editing

On the contact page and the page sections that explain purchase process or expectations, the admin should be able to modify each text box section while preserving the existing design.

That means the admin can edit the content inside the cards and steps, but cannot change:

- the card layout
- the section ordering logic unless ordering is intentionally exposed
- the CSS styling
- the icon treatment unless icons are intentionally made editable

Recommended editable areas on `contact.html`:

- page subtitle under `Contact Us`
- `Get In Touch` card content
- `What to Expect` card content

Within `Get In Touch`, the admin should be able to update:

- business name text
- location text
- email address
- phone number
- response time text

Within `What to Expect`, the admin should be able to update each step box:

- step title
- step paragraph description

Recommended contact content keys:

- `contact.header.subtitle`
- `contact.get-in-touch.location`
- `contact.get-in-touch.email`
- `contact.get-in-touch.phone`
- `contact.get-in-touch.response-time`
- `contact.expectations.steps`

Recommended `contact.expectations.steps` structure:

- ordered step number
- step title
- step description

### Design Guardrail

For all of the above content, the admin experience should follow this rule:

- editable content lives inside structured fields
- page layout remains code-defined

This preserves the main design while still giving the admin meaningful control over the wording and business content.

## First-Pass Admin Forms

Based on the approved editable scope, the first-pass admin dashboard should include these forms.

### Litter And Puppy Form Set

- create litter
- edit litter details
- add puppy
- edit puppy
- upload puppy images
- reorder puppy images

### About Page Content Form

- edit page subtitle
- manage ordered story paragraphs

### Contact And Purchase Process Form

- edit contact page subtitle
- edit contact information fields
- edit expectation or purchase-process step list

This keeps the admin workflow aligned with the real business tasks you described.

## Page-By-Page Content Schema

This section converts the approved editable scope into a field-by-field inventory. The goal is to define exactly what becomes data-driven and what remains hard-coded in layout templates.

### Page: `puppies.html`

This page should be driven primarily by litter records, puppy records, and puppy image records.

#### Layout Elements That Stay Developer-Controlled

- page structure
- puppy card visual design
- carousel behavior
- card status badge styling
- CTA layout

#### Admin-Editable Page-Level Fields

- `puppies.header.title`
- `puppies.header.subtitle`
- `puppies.header.infoLabel`
- `puppies.header.infoTitle`
- `puppies.header.infoBody`
- `puppies.banner.announcement`
- `puppies.cta.title`
- `puppies.cta.body`
- `puppies.cta.buttonLabel`

Recommended defaults based on current content:

- `puppies.header.title`: `Available Puppies`
- `puppies.header.subtitle`: litter date and update summary
- `puppies.header.infoLabel`: `Current Litter`
- `puppies.header.infoTitle`: `Meet the Puppies`
- `puppies.header.infoBody`: intro copy for the page

#### Admin-Editable Litter Fields Used On This Page

- `litter.title`
- `litter.birthDate`
- `litter.readyDate`
- `litter.bannerText`
- `litter.summaryText`
- `litter.defaultMalePrice`
- `litter.defaultFemalePrice`
- `litter.isActive`

#### Admin-Editable Puppy Fields Used On This Page

- `puppy.displayName`
- `puppy.gender`
- `puppy.colorLabel`
- `puppy.price`
- `puppy.availabilityStatus`
- `puppy.shortSummary`
- `puppy.longDescription`
- `puppy.displayOrder`
- `puppy.featuredImageId`

#### Admin-Editable Puppy Image Fields Used On This Page

- `image.altText`
- `image.weekLabel`
- `image.displayOrder`
- `image.isFeatured`

#### Public Rendering Behavior

- the page loads the active litter
- the page loads all puppies for that litter in display order
- each puppy card renders its name, price, status, optional summary, optional description, and image set
- each puppy image group renders in week order or image order depending on the stored metadata

### Page: `about.html`

This page should be driven by a mix of text-block records and approved site-image slots.

#### Layout Elements That Stay Developer-Controlled

- page header layout
- about section layout
- two-column story/image composition
- parents carousel design
- CTA strip layout

#### Admin-Editable Text Fields

- `about.header.title`
- `about.header.subtitle`
- `about.story.title`
- `about.story.paragraphs`
- `about.parents.sectionTitle`
- `about.parents.sectionSubtitle`
- `about.parents.cardTitle`
- `about.parents.cardSummary`
- `about.parents.sadie.name`
- `about.parents.sadie.description`
- `about.parents.bronco.name`
- `about.parents.bronco.description`
- `about.cta.title`
- `about.cta.body`
- `about.cta.primaryLabel`
- `about.cta.secondaryLabel`

#### Admin-Editable Image Slots

- `about.story.image`
- `about.parents.carousel`

#### Structured Rules

- `about.story.paragraphs` should be stored as an ordered paragraph collection
- the admin can add, edit, remove, and reorder paragraphs within a safe limit
- `about.parents.carousel` should allow image upload, ordering, captions, and alt text
- the design should keep the current carousel behavior without making layout editable

### Page: `contact.html`

This page should become a structured text-driven page with optional future support for contact card icons if needed.

#### Layout Elements That Stay Developer-Controlled

- page header layout
- card layout
- step card layout
- typography and spacing system

#### Admin-Editable Text Fields

- `contact.header.title`
- `contact.header.subtitle`
- `contact.card.contact.title`
- `contact.card.expectations.title`
- `contact.get-in-touch.businessName`
- `contact.get-in-touch.location`
- `contact.get-in-touch.email`
- `contact.get-in-touch.phone`
- `contact.get-in-touch.responseTime`
- `contact.expectations.steps`

#### Structured `contact.expectations.steps` Schema

Each step record should include:

- `stepNumber`
- `title`
- `description`
- `displayOrder`
- `isActive`

#### Editing Rule

The admin may change the wording of each expectation box, add a new step, remove a step, and reorder steps, but may not alter the card design itself.

### Page: `gallery.html`

This page should be image-driven through gallery records and gallery image records.

#### Layout Elements That Stay Developer-Controlled

- page header layout
- gallery grid design
- lightbox behavior

#### Admin-Editable Text Fields

- `gallery.header.title`
- `gallery.header.subtitle`
- `gallery.section.title`
- `gallery.section.subtitle`

#### Admin-Editable Image Fields

- `galleryItem.image`
- `galleryItem.altText`
- `galleryItem.caption`
- `galleryItem.displayOrder`
- `galleryItem.isActive`

#### Public Rendering Behavior

- the page loads gallery images from storage-backed metadata
- the page no longer depends on a local manifest rebuild

### Page: `index.html`

This page contains several marketing sections. Not all of them need to be fully editable immediately, but a defined subset should be made manageable from admin.

#### Layout Elements That Stay Developer-Controlled

- hero layout
- announcement banner styling
- feature card grid structure
- parent section layout
- CTA strip layout

#### Recommended First-Pass Editable Text Fields

- `home.announcement.body`
- `home.announcement.buttonLabel`
- `home.hero.title`
- `home.hero.subtitle`
- `home.hero.buttonLabel`
- `home.aboutPreview.title`
- `home.aboutPreview.paragraph1`
- `home.aboutPreview.paragraph2`
- `home.aboutPreview.buttonLabel`
- `home.parents.sectionTitle`
- `home.parents.sectionSubtitle`
- `home.parents.cardTitle`
- `home.parents.cardSummary`
- `home.parents.sadie.name`
- `home.parents.sadie.description`
- `home.parents.bronco.name`
- `home.parents.bronco.description`
- `home.featuredPuppies.sectionTitle`
- `home.featuredPuppies.sectionSubtitle`
- `home.featuredPuppies.cardTitle`
- `home.featuredPuppies.cardBody`
- `home.featuredPuppies.buttonLabel`
- `home.whyChooseUs.sectionTitle`
- `home.whyChooseUs.sectionSubtitle`
- `home.feature1.title`
- `home.feature1.body`
- `home.feature2.title`
- `home.feature2.body`
- `home.feature3.title`
- `home.feature3.body`
- `home.cta.title`
- `home.cta.body`
- `home.cta.buttonLabel`

#### Recommended First-Pass Editable Image Slots

- `home.aboutPreview.image`
- `home.parents.carousel`

#### Recommendation

Although these fields can be made editable, implementation should prioritize puppies, about, and contact first because those represent the most important admin workflows already approved.

### Page: `allergies.html`

This page was not explicitly named in the requested editable scope, but it already contains structured informational content and can be included later if desired.

#### Recommended Later-Phase Editable Fields

- `allergies.header.title`
- `allergies.header.subtitle`
- `allergies.section.title`
- `allergies.section.subtitle`
- `allergies.bulletPoints`
- `allergies.note.title`
- `allergies.note.paragraph1`
- `allergies.note.paragraph2`

#### Recommendation

This should be a later-phase enhancement, not a first implementation priority.

## First Admin Screen Map

This section defines the initial admin navigation and the responsibilities of each screen.

### Screen: `/admin`

Purpose:

- entry dashboard
- auth check landing page
- quick navigation to major edit areas

Recommended widgets:

- active litter summary
- available puppy count
- recent image uploads
- quick buttons for `Add Litter`, `Add Puppy`, `Edit About`, and `Edit Contact`

### Screen: `/admin/litters`

Purpose:

- list all litters
- create a new litter
- edit existing litter metadata
- set current active litter

Recommended table columns:

- litter title
- birth date
- ready date
- active status
- puppy count
- actions

### Screen: `/admin/litters/:litterId`

Purpose:

- edit a single litter
- manage puppies within that litter

Recommended sections:

- litter details form
- litter banner text
- puppy list
- `Add Puppy` action

### Screen: `/admin/puppies/:puppyId`

Purpose:

- edit one puppy record
- manage one puppy’s photo set

Recommended form groups:

- identity and naming
- pricing and availability
- short summary
- long description text area
- featured image selection
- image gallery management

### Screen: `/admin/gallery`

Purpose:

- upload gallery images
- reorder gallery entries
- edit alt text and captions

Recommended features:

- drag-and-drop upload
- thumbnail grid
- inline alt text editing
- reorder controls
- delete confirmation

### Screen: `/admin/content/about`

Purpose:

- manage About page text and image content

Recommended sections:

- header fields
- story paragraph manager
- story image slot
- parents section text
- parents carousel image manager
- CTA text fields

### Screen: `/admin/content/contact`

Purpose:

- manage Contact page text and purchase process text boxes

Recommended sections:

- header fields
- contact information form
- expectation steps manager

### Screen: `/admin/content/home`

Purpose:

- manage approved homepage text and image slots

Recommended sections:

- announcement banner
- hero content
- about preview
- parents section
- featured puppies preview
- feature cards
- CTA strip

### Screen: `/admin/site-images`

Purpose:

- centralized review of all site-section images not tied directly to puppy or gallery entities

Recommended filters:

- page
- section
- active/inactive

## First Implementation Schema Decisions

To keep the first build manageable, the initial implementation should support a deliberately constrained schema.

### First Release Text Collections

- puppy page text blocks
- about page text blocks
- contact page text blocks

### First Release Image Collections

- puppy images
- gallery images
- about story image
- about parents carousel images

### First Release Entity Relationships

- one active litter to many puppies
- one puppy to many puppy images
- one gallery collection to many gallery images
- one page section to many site images where carousel behavior is needed
- one page section to one text block or paragraph collection depending on content type

## API Contract Draft For First Build

The first implementation phase should follow a narrow API contract rather than attempting a complete system immediately.

### Public Read Endpoints For First Build

- `GET /api/public/puppies-page`
- `GET /api/public/about-page`
- `GET /api/public/contact-page`
- `GET /api/public/gallery-page`

Each endpoint should return all content needed for that page in a view-model shape that minimizes frontend complexity.

### Admin Endpoints For First Build

- `GET /api/admin/litters`
- `POST /api/admin/litters`
- `PUT /api/admin/litters/{id}`
- `GET /api/admin/litters/{id}`
- `GET /api/admin/puppies/{id}`
- `POST /api/admin/puppies`
- `PUT /api/admin/puppies/{id}`
- `POST /api/admin/puppies/{id}/images`
- `DELETE /api/admin/puppy-images/{id}`
- `GET /api/admin/content/about`
- `PUT /api/admin/content/about`
- `GET /api/admin/content/contact`
- `PUT /api/admin/content/contact`
- `GET /api/admin/gallery`
- `POST /api/admin/gallery/images`
- `PUT /api/admin/gallery/order`
- `DELETE /api/admin/gallery/images/{id}`

### Validation Rules For First Build

- required text fields cannot save as blank where the public layout expects visible content
- email fields must validate as email addresses
- phone fields should allow a normalized storage format
- image uploads must restrict type and file size
- puppy names should be required
- puppy price should be a positive numeric value
- step titles should be required on contact expectation steps

## Security Requirements

Because the admin area changes live site content, security rules need to be explicit.

### Required Protections

- all admin routes must require authentication
- all admin API routes must enforce authorization server-side
- frontend checks are useful for user experience but are not enough for security
- file uploads must validate allowed types and size limits
- secrets must never be exposed in client-side code
- admin-only write operations must never be callable anonymously

### Delete And Replace Safety

Since content goes live immediately, delete operations should be handled carefully.

Recommended behavior:

- require confirmation before delete
- soft-delete where practical for metadata records
- prevent orphaned references when removing active images

### Auditability

A light audit trail would be valuable even for a small site.

Suggested audit metadata on content records:

- `createdAt`
- `updatedAt`
- `updatedBy`

This is not a full enterprise audit system, but it is enough to understand who changed what.

## API Design Direction

The backend should expose a clear separation between public read endpoints and admin management endpoints.

### Public Read Endpoints

Examples:

- `GET /api/public/litters/current`
- `GET /api/public/gallery`
- `GET /api/public/site-content`

These should return only published live content appropriate for anonymous visitors.

### Admin Endpoints

Examples:

- `GET /api/admin/litters`
- `POST /api/admin/litters`
- `PUT /api/admin/litters/{id}`
- `GET /api/admin/puppies`
- `POST /api/admin/puppies`
- `POST /api/admin/images/upload`
- `PUT /api/admin/text-blocks/{id}`

These endpoints must be protected and validated carefully.

## UX Principles For The Admin Dashboard

The admin interface should remain simple and task-focused.

### Principles

- forms should match real business tasks
- image upload should be drag-and-drop or simple file selection
- the admin should see image previews before save
- the admin should not need to understand storage paths
- the admin should not need to understand HTML structure
- common edits should take only a few clicks

### Practical Quality Of Life Features

The dashboard should eventually support:

- image preview thumbnails
- drag-to-reorder image lists
- clear available/reserved/sold toggles
- inline edit forms for short text changes
- strong empty-state guidance when there are no litters or no images yet

## Migration Strategy

The site should be migrated incrementally to reduce risk.

### Phase 1: Finalize Content Map

Define exactly which text blocks and image zones are admin-managed.

Outputs:

- list of editable text keys
- list of editable image slots
- final entity shapes for litters, puppies, and images

### Phase 2: Add Auth And Protected Admin Shell

Build the `/admin` route, sign-in flow, and allowlist-based authorization.

Outputs:

- working Google sign-in flow
- protected admin shell
- unauthorized handling

### Phase 3: Add Storage And Admin APIs

Create the backend and storage integration.

Outputs:

- Azure Functions API scaffold
- Blob Storage integration
- Table Storage integration
- content validation rules

### Phase 4: Build Litter And Puppy Management

Replace hard-coded puppy content with managed data.

Outputs:

- admin forms for litter and puppy creation
- image upload and association
- dynamic rendering on `puppies.html`

### Phase 5: Build Gallery Management

Replace the manifest-based gallery workflow.

Outputs:

- admin gallery upload tools
- gallery ordering and alt text management
- dynamic rendering on `gallery.html`

### Phase 6: Build Site Text And Site Image Management

Add management for selected marketing content.

Outputs:

- admin-managed text blocks
- admin-managed approved page image zones
- dynamic content injection for selected static pages

### Phase 7: Polish And Hardening

Improve quality and long-term usability.

Outputs:

- better validation messages
- delete safety improvements
- storage cleanup handling
- performance review

## Risks And Design Constraints

### Immediate Publish Risk

Because changes go live immediately, the admin UI needs stronger safeguards against mistakes.

### Scope Creep Risk

If every word and every image slot becomes editable without structure, the system can become confusing and fragile. The better approach is curated editability with clear labels and intent.

### Storage Cleanup Risk

If image replacement is not handled carefully, unused blobs can accumulate over time. The plan should include a cleanup policy for unreferenced files.

### Public Rendering Dependency

Once content becomes API-driven, the public site depends on content availability. The read path should therefore be simple and robust.

## What Will Still Remain Developer-Controlled

Even after admin tools are added, some things should remain outside admin control:

- site layout structure
- CSS design system and styling
- JavaScript interaction logic
- navigation architecture
- application security configuration
- infrastructure provisioning details

This keeps the admin experience clean and prevents accidental structural damage to the site.

## Recommended Build Priority

The recommended order of actual implementation work is:

1. map editable areas and data models
2. add Google auth and admin route protection
3. add Azure Functions plus storage integration
4. make `puppies.html` dynamic
5. make `gallery.html` dynamic
6. add editable text and selected site image management
7. refine usability and performance

This order targets the biggest administrative pain first.

## Success Criteria

The project can be considered successful when all of the following are true:

- an approved admin can sign in with Google
- a new litter can be created without editing HTML
- puppy cards can be added and updated through the admin dashboard
- puppy images can be uploaded and arranged in the browser
- gallery images can be managed in the browser
- selected site images can be updated in the browser
- approved text blocks can be reworded in text boxes
- the public site updates immediately after save
- images are stored outside the repo
- the repository no longer needs routine content-only edits

## Next Step After Planning

The next step is not implementation yet. The next step should be a narrower technical design pass that identifies:

- the exact editable text block inventory
- the exact editable image slot inventory
- the first-pass admin screen layout
- the exact API contract for the first implementation phase

Once that is agreed, development can begin in a controlled order.

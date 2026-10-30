# Courses & Tests Feature Implementation

## Overview
Successfully implemented 3 new tables and full CRUD functionality for Courses, Tests, and Exams management system.

---

## Database Schema

### 1. **courses** table
```
- id
- license_category_id (FK to license_categories)
- created_by (FK to users)
- name_ar, name_fr (bilingual titles)
- description_ar, description_fr (optional descriptions)
- cover_path (image)
- pdf_ar_path, pdf_fr_path (PDF files for each language)
- status (draft|published|archived)
- timestamps
```

### 2. **tests** table
```
- id
- license_category_id (FK to license_categories)
- created_by (FK to users)
- name_ar, name_fr (bilingual titles)
- description_ar, description_fr (optional descriptions)
- cover_path (image)
- duration_minutes (default: 30)
- pass_percentage (default: 70)
- status (draft|published|archived)
- timestamps
```

### 3. **test_questions** pivot table
```
- id
- test_id (FK to tests, cascade delete)
- question_id (FK to questions, restrict delete)
- question_order (ordering)
- points (default: 1)
- unique constraints on (test_id, question_id) and (test_id, question_order)
```

---

## Backend Implementation

### Models Created
1. **Course.php** - `app/Models/Course.php`
   - Relationships: belongsTo LicenseCategory, belongsTo User (creator)
   - Fillable fields for all attributes

2. **Test.php** - `app/Models/Test.php`
   - Relationships: belongsTo LicenseCategory, belongsTo User (creator)
   - belongsToMany Questions through test_questions pivot
   - HasMany TestQuestions

3. **TestQuestion.php** - `app/Models/TestQuestion.php`
   - Pivot model (no timestamps)
   - BelongsTo Test and Question

### Controllers Created
1. **CourseController.php** - `app/Http/Controllers/Admin/CourseController.php`
   - Full CRUD: index, store, update, destroy
   - File handling: cover images, PDF files (AR + FR)
   - Filtering: by category, status, search
   - Pagination support
   - Private file serving (protected routes)

2. **TestController.php** - `app/Http/Controllers/Admin/TestController.php`
   - Full CRUD: index, store, update, destroy
   - Question management: attach/detach questions from bank
   - File handling: cover images
   - Filtering: by category, status, search
   - Pagination support

### Routes Added (`routes/web.php`)
```php
// Courses
Route::get('/courses', [CourseController::class, 'index']);
Route::post('/courses', [CourseController::class, 'store']);
Route::patch('/courses/{course}', [CourseController::class, 'update']);
Route::delete('/courses/{course}', [CourseController::class, 'destroy']);
Route::get('/courses/{course}/file/{slot}', [CourseController::class, 'file']);

// Tests
Route::get('/tests', [TestController::class, 'index']);
Route::post('/tests', [TestController::class, 'store']);
Route::patch('/tests/{test}', [TestController::class, 'update']);
Route::delete('/tests/{test}', [TestController::class, 'destroy']);
Route::get('/tests/{test}/file/{slot}', [TestController::class, 'file']);
```

---

## Frontend Implementation

### Pages Created

#### **Courses**
1. **Index.jsx** - `resources/js/Pages/Courses/Index.jsx`
   - Grid/card view of all courses
   - Stats cards (total, published, draft)
   - Search + filters (category, status)
   - Pagination
   - Create/Edit/Delete actions
   - PDF file preview links

2. **CourseForm.jsx** - `resources/js/Pages/Courses/CourseForm.jsx`
   - Modal form for create/edit
   - Bilingual inputs (AR + FR)
   - Cover image upload with preview
   - PDF upload for both languages
   - Status selector
   - Category dropdown

#### **Tests**
1. **Index.jsx** - `resources/js/Pages/Tests/Index.jsx`
   - Grid/card view of all tests
   - Stats cards (total, published, draft)
   - Search + filters (category, status)
   - Pagination
   - Shows question count per test
   - Create/Edit/Delete actions

2. **TestForm.jsx** - `resources/js/Pages/Tests/TestForm.jsx`
   - Modal form for create/edit
   - Bilingual inputs (AR + FR)
   - Cover image upload with preview
   - Duration and pass percentage inputs
   - **Question Picker**: dual-pane interface
     - Left: Available questions (searchable)
     - Right: Selected questions (ordered list)
     - Drag-and-drop ordering support
   - Status selector
   - Category dropdown

#### **Category Dashboard**
Updated **CategoryDashboard.jsx** - `resources/js/Pages/Exams/CategoryDashboard.jsx`
- Now shows 3 sections per category:
  1. **Courses** - with PDF links
  2. **Tests** - with question counts
  3. **Exams** - (existing)
- Each section has "Manage" button linking to filtered index page
- Empty states for each section
- Status badges (published/draft/archived)

---

## Navigation Updates

### Sidebar (`resources/js/Layouts/Sidebar.jsx`)
Added 2 new navigation items:
- **Courses** (FaBook icon) → `/courses`
- **Tests** (FaClipboardCheck icon) → `/tests`

Positioned between "Questions" and "Exams & Cours" group.

---

## i18n Translations

### French (`resources/js/i18n/locales/fr.json`)
Added complete translations for:
- `nav.courses`, `nav.tests`
- `courses.*` (45+ keys)
- `tests.*` (50+ keys)
- `categoryDashboard.*` (9 keys)

### Arabic (`resources/js/i18n/locales/ar.json`)
Added complete RTL translations for:
- `nav.courses`, `nav.tests`
- `courses.*` (45+ keys)
- `tests.*` (50+ keys)
- `categoryDashboard.*` (9 keys)

---

## Key Features

### Security
✅ File uploads stored in private `local` disk (not public)
✅ Protected routes requiring authentication
✅ Files served through controllers with auth middleware
✅ Cascade/restrict delete constraints on FK relationships

### UX Features
✅ Bilingual support (Arabic RTL + French LTR)
✅ Live search with 350ms debounce
✅ Image previews before upload
✅ Status badges with color coding
✅ Pagination with query string preservation
✅ Flash notifications (success/error)
✅ Empty states with helpful messages
✅ Confirmation modals for destructive actions

### Data Integrity
✅ Question order preserved in pivot table
✅ Unique constraints prevent duplicate assignments
✅ Soft validation (status enum, file types)
✅ Restrict delete on questions used in tests
✅ Cascade delete on test_questions when test deleted

---

## File Structure

```
app/
├── Http/Controllers/Admin/
│   ├── CourseController.php
│   └── TestController.php
├── Models/
│   ├── Course.php
│   ├── Test.php
│   ├── TestQuestion.php
│   └── LicenseCategory.php (updated)
database/migrations/
├── 2026_10_30_000001_create_courses_table.php
├── 2026_10_30_000002_create_tests_table.php
└── 2026_10_30_000003_create_test_questions_table.php
resources/js/
├── Pages/
│   ├── Courses/
│   │   ├── Index.jsx
│   │   └── CourseForm.jsx
│   ├── Tests/
│   │   ├── Index.jsx
│   │   └── TestForm.jsx
│   └── Exams/
│       └── CategoryDashboard.jsx (updated)
├── Layouts/
│   └── Sidebar.jsx (updated)
└── i18n/locales/
    ├── fr.json (updated)
    └── ar.json (updated)
routes/
└── web.php (updated)
```

---

## Usage

### Accessing the Features

1. **Courses**: Navigate to `/courses` or click "Cours" in sidebar
2. **Tests**: Navigate to `/tests` or click "Tests" in sidebar
3. **Category Dashboard**: Click any category badge in "Examens & Cours" sidebar group
   - Shows courses, tests, and exams for that specific category

### Creating Content

**Course:**
1. Click "Nouveau cours" button
2. Fill bilingual names + descriptions
3. Upload cover image (optional)
4. Upload PDF files for AR and/or FR (optional)
5. Select category and status
6. Click Save

**Test:**
1. Click "Nouveau test" button
2. Fill bilingual names + descriptions
3. Upload cover image (optional)
4. Set duration (minutes) and pass percentage
5. Select category and status
6. Add questions from the available list (click to add)
7. Click Save

### Frontend Routes
- `/courses` - Courses index
- `/courses?category=X` - Filtered by category
- `/tests` - Tests index
- `/tests?category=X` - Filtered by category
- `/exams/{categoryId}` - Category dashboard

---

## Technical Notes

### Pattern Consistency
All implementation follows existing project patterns:
- Controller structure matches QuestionController and CategoryController
- Frontend pages follow Categories/Index.jsx pattern
- i18n keys follow existing namespace conventions
- Route naming follows existing conventions (plural resource names)

### Storage
- Cover images: `storage/app/courses/covers/` and `storage/app/tests/covers/`
- PDF files: `storage/app/courses/pdfs/`
- All served via controllers (not public symlink)

### Validation
- Cover images: jpg, jpeg, png, webp (max 4MB)
- PDF files: pdf only (max 20MB)
- Required fields: name_ar, name_fr, category, status

---

## Next Steps (Optional Enhancements)

1. **Student access**: Create student-facing pages to view and take tests
2. **Test results**: Track student performance on tests
3. **Analytics**: Show test completion rates, average scores
4. **Content versioning**: Track changes to courses/tests
5. **Bulk operations**: Import/export courses and tests
6. **Rich text editor**: For descriptions (currently plain text)
7. **Video support**: Add video fields to courses

---

## Migration Status
✅ All 3 migrations ran successfully
✅ No PHP/JavaScript errors
✅ All routes registered
✅ All models loaded
✅ Sidebar navigation updated
✅ i18n translations complete (FR + AR)

---

**Implementation Date**: October 30, 2026  
**Status**: ✅ Complete and Ready for Use

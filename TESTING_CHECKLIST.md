# Testing Checklist for Courses & Tests Feature

## Pre-Testing Setup
- [ ] Run migrations: `php artisan migrate`
- [ ] Build frontend assets: `npm run build` or `npm run dev`
- [ ] Start Laravel server: `php artisan serve`
- [ ] Login as admin user

---

## Courses Module Testing

### Navigation
- [ ] Sidebar shows "Cours" menu item
- [ ] Clicking "Cours" navigates to `/courses`
- [ ] Page loads without errors

### Index Page
- [ ] Stats cards display correctly (Total, Published, Draft)
- [ ] Search input works with live filtering
- [ ] Category filter dropdown shows all categories
- [ ] Status filter buttons work (All, Published, Draft, Archived)
- [ ] Empty state shows when no courses exist
- [ ] "Nouveau cours" button opens creation modal

### Create Course
- [ ] Modal opens when clicking "Nouveau cours"
- [ ] All form fields render correctly
- [ ] Category dropdown populates
- [ ] Cover image upload shows preview
- [ ] PDF file pickers work for both AR and FR
- [ ] Bilingual inputs (French and Arabic) work
- [ ] Status dropdown has 3 options
- [ ] Form validates required fields
- [ ] Success message appears after creation
- [ ] New course appears in list

### Edit Course
- [ ] Edit button opens modal with existing data
- [ ] All fields populate correctly
- [ ] Cover image shows if exists
- [ ] PDF file indicators show if files exist
- [ ] Can replace cover image
- [ ] Can replace PDF files
- [ ] Can remove cover image (X button)
- [ ] Can change status
- [ ] Success message appears after update
- [ ] Changes reflect in list

### Delete Course
- [ ] Delete button opens confirmation modal
- [ ] Cancel button closes modal without deleting
- [ ] Confirm button deletes the course
- [ ] Success message appears
- [ ] Course removed from list

### File Serving
- [ ] Cover images load correctly in cards
- [ ] PDF links (FR/AR) are clickable
- [ ] PDFs open in new tab
- [ ] URLs are protected (require authentication)

---

## Tests Module Testing

### Navigation
- [ ] Sidebar shows "Tests" menu item
- [ ] Clicking "Tests" navigates to `/tests`
- [ ] Page loads without errors

### Index Page
- [ ] Stats cards display correctly (Total, Published, Draft)
- [ ] Search input works with live filtering
- [ ] Category filter dropdown shows all categories
- [ ] Status filter buttons work (All, Published, Draft, Archived)
- [ ] Question count badge shows per test
- [ ] Duration displays correctly
- [ ] Empty state shows when no tests exist
- [ ] "Nouveau test" button opens creation modal

### Create Test
- [ ] Modal opens when clicking "Nouveau test"
- [ ] All form fields render correctly
- [ ] Category dropdown populates
- [ ] Cover image upload shows preview
- [ ] Duration accepts numbers (1-300)
- [ ] Pass percentage accepts decimals (0-100)
- [ ] Status dropdown has 3 options
- [ ] Question picker shows 2 panes:
  - [ ] Left pane: Available questions (searchable)
  - [ ] Right pane: Selected questions (empty initially)
- [ ] Search in available questions works
- [ ] Clicking question adds it to selected list
- [ ] Question order numbers show (1, 2, 3...)
- [ ] Remove button (X) removes question from selected list
- [ ] Question count badge updates dynamically
- [ ] Form validates required fields
- [ ] Success message appears after creation
- [ ] New test appears in list

### Edit Test
- [ ] Edit button opens modal with existing data
- [ ] All fields populate correctly
- [ ] Cover image shows if exists
- [ ] Previously selected questions show in right pane
- [ ] Can add more questions
- [ ] Can remove questions
- [ ] Question order preserved
- [ ] Success message appears after update
- [ ] Changes reflect in list

### Delete Test
- [ ] Delete button opens confirmation modal
- [ ] Cancel button closes modal without deleting
- [ ] Confirm button deletes the test
- [ ] Success message appears
- [ ] Test removed from list

---

## Category Dashboard Testing

### Navigation
- [ ] Clicking category in "Examens & Cours" sidebar group opens dashboard
- [ ] URL is `/exams/{categoryId}`
- [ ] Page loads without errors
- [ ] Category name and code display in header

### Courses Section
- [ ] Shows "Cours" heading with count badge
- [ ] "Gérer les cours" button links to filtered courses page
- [ ] Empty state shows if no courses
- [ ] Course cards display:
  - [ ] Cover image or placeholder
  - [ ] Status badge with correct color
  - [ ] Title (bilingual)
  - [ ] Description (if exists)
  - [ ] PDF links (FR/AR) if they exist
- [ ] Multiple courses display in grid layout

### Tests Section
- [ ] Shows "Tests" heading with count badge
- [ ] "Gérer les tests" button links to filtered tests page
- [ ] Empty state shows if no tests
- [ ] Test cards display:
  - [ ] Cover image or placeholder
  - [ ] Status badge with correct color
  - [ ] Title (bilingual)
  - [ ] Description (if exists)
  - [ ] Question count
- [ ] Multiple tests display in grid layout

### Exams Section
- [ ] Shows "Examens officiels" heading with count badge
- [ ] Empty state shows if no exams (existing functionality)
- [ ] Exam cards display correctly (existing functionality)

---

## Bilingual Testing (AR/FR)

### French Language
- [ ] Switch to French in language selector
- [ ] All labels show in French
- [ ] Text direction is LTR
- [ ] French names/descriptions display first
- [ ] Arabic as fallback when French missing

### Arabic Language
- [ ] Switch to Arabic in language selector
- [ ] All labels show in Arabic
- [ ] Text direction is RTL
- [ ] Arabic names/descriptions display first
- [ ] French as fallback when Arabic missing
- [ ] Layout doesn't break with RTL

---

## Filtering & Search Testing

### Courses Filtering
- [ ] Search by course name works
- [ ] Filter by category works
- [ ] Filter by status works
- [ ] Multiple filters work together
- [ ] Filters persist in URL query string
- [ ] Pagination works with filters

### Tests Filtering
- [ ] Search by test name works
- [ ] Filter by category works
- [ ] Filter by status works
- [ ] Multiple filters work together
- [ ] Filters persist in URL query string
- [ ] Pagination works with filters

---

## Data Validation Testing

### Courses
- [ ] Cannot save without category
- [ ] Cannot save without name_fr
- [ ] Cannot save without name_ar
- [ ] Cannot save without status
- [ ] Cover accepts only images (jpg, png, webp)
- [ ] Cover max 4MB enforced
- [ ] PDF accepts only .pdf files
- [ ] PDF max 20MB enforced
- [ ] Error messages display for invalid inputs

### Tests
- [ ] Cannot save without category
- [ ] Cannot save without name_fr
- [ ] Cannot save without name_ar
- [ ] Cannot save without duration
- [ ] Cannot save without pass_percentage
- [ ] Cannot save without status
- [ ] Duration must be 1-300
- [ ] Pass percentage must be 0-100
- [ ] Cover accepts only images (jpg, png, webp)
- [ ] Cover max 4MB enforced
- [ ] Error messages display for invalid inputs

---

## Pagination Testing

### Courses
- [ ] Shows 12 courses per page
- [ ] Pagination controls appear when >12 courses
- [ ] Next/Previous buttons work
- [ ] Page number buttons work
- [ ] Current page highlighted
- [ ] Shows "X–Y / Total" count

### Tests
- [ ] Shows 12 tests per page
- [ ] Pagination controls appear when >12 tests
- [ ] Next/Previous buttons work
- [ ] Page number buttons work
- [ ] Current page highlighted
- [ ] Shows "X–Y / Total" count

---

## Permissions Testing

### File Access
- [ ] Logged-in users can access course files
- [ ] Logged-in users can access test files
- [ ] Logged-out users get 401/403 on file URLs
- [ ] Direct file URLs don't work (files not in public/)

### Route Access
- [ ] All `/courses` routes require admin auth
- [ ] All `/tests` routes require admin auth
- [ ] Student users cannot access these routes

---

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)

---

## Responsive Design

Test at different screen sizes:
- [ ] Mobile (< 640px)
- [ ] Tablet (640px - 1024px)
- [ ] Desktop (> 1024px)

Check:
- [ ] Navigation collapses to hamburger on mobile
- [ ] Forms are usable on mobile
- [ ] Cards stack properly
- [ ] Tables scroll horizontally if needed
- [ ] Modals fit on small screens

---

## Performance Testing

- [ ] Index pages load in < 2 seconds
- [ ] Large course list (100+) loads reasonably
- [ ] Large test list (100+) loads reasonably
- [ ] Image uploads complete successfully
- [ ] PDF uploads complete successfully
- [ ] File downloads start immediately

---

## Error Handling

- [ ] Network errors show user-friendly messages
- [ ] File upload errors show clear messages
- [ ] Form validation errors are clear
- [ ] Database errors handled gracefully
- [ ] Missing files handled (404)
- [ ] Unauthorized access handled (403)

---

## Integration Testing

### With Questions
- [ ] Tests can use questions from bank
- [ ] Deleting a question used in test shows error
- [ ] Questions filter by category in test picker
- [ ] Question count accurate in test cards

### With Categories
- [ ] Courses filter correctly by category
- [ ] Tests filter correctly by category
- [ ] Category dashboard shows correct content
- [ ] Deleting category with courses/tests shows error

### With Files
- [ ] Uploaded files persist after refresh
- [ ] File URLs include version timestamp
- [ ] Cache busting works on file updates
- [ ] Old files deleted when replaced
- [ ] Files deleted when parent record deleted

---

## Regression Testing

Ensure existing features still work:
- [ ] Questions module unaffected
- [ ] Categories module unaffected
- [ ] Students module unaffected
- [ ] Users module unaffected
- [ ] Exams module unaffected
- [ ] Authentication works
- [ ] Sidebar navigation works
- [ ] Language switching works
- [ ] Dark mode toggle works

---

## Final Checks

- [ ] No console errors in browser
- [ ] No PHP errors in Laravel log
- [ ] Database queries are efficient (no N+1)
- [ ] Flash messages clear after 4 seconds
- [ ] Modals close on ESC key
- [ ] Focus management works in modals
- [ ] All buttons have hover states
- [ ] Loading states show when processing

---

## Sign-Off

**Tested By**: _______________  
**Date**: _______________  
**Build Version**: _______________  
**Status**: [ ] Pass [ ] Fail  
**Notes**: _______________

---

**Total Checkboxes**: 200+  
**Estimated Testing Time**: 2-3 hours for comprehensive testing

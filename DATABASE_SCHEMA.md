# 📊 Database Schema - Courses & Tests Module

## Entity Relationship Diagram

```
┌─────────────────────┐
│  license_categories │
│                     │
│  - id               │
│  - code             │
│  - name_ar          │
│  - name_fr          │
│  - description_ar   │
│  - description_fr   │
│  - icon_path        │
│  - is_active        │
└─────────┬───────────┘
          │
          │ (has many)
          │
    ┌─────┴─────┬─────────────┬─────────────┐
    │           │             │             │
    ▼           ▼             ▼             ▼
┌───────┐  ┌────────┐   ┌─────────┐  ┌──────────┐
│courses│  │ tests  │   │ exams   │  │questions │
└───┬───┘  └───┬────┘   └─────────┘  └────┬─────┘
    │          │                           │
    │          │ (many-to-many)            │
    │          └───────────────────────────┘
    │                      │
    │                      ▼
    │            ┌──────────────────┐
    │            │ test_questions   │
    │            │  (pivot table)   │
    │            │                  │
    │            │  - test_id       │
    │            │  - question_id   │
    │            │  - question_order│
    │            │  - points        │
    │            └──────────────────┘
    │
    │ (belongs to)
    ▼
┌───────┐
│ users │
│       │
│ - id  │
│ - name│
└───────┘
```

---

## Table Details

### 1. courses
**Purpose**: Store educational course materials

| Column            | Type          | Attributes         | Description                    |
|-------------------|---------------|--------------------|--------------------------------|
| id                | BIGINT        | PK, AUTO_INCREMENT | Primary key                    |
| license_category_id| BIGINT       | FK, INDEXED        | Reference to category          |
| created_by        | BIGINT        | FK                 | User who created               |
| name_ar           | VARCHAR(200)  | NOT NULL           | Arabic title                   |
| name_fr           | VARCHAR(200)  | NOT NULL           | French title                   |
| description_ar    | TEXT          | NULLABLE           | Arabic description             |
| description_fr    | TEXT          | NULLABLE           | French description             |
| cover_path        | VARCHAR(255)  | NULLABLE           | Path to cover image            |
| pdf_ar_path       | VARCHAR(255)  | NULLABLE           | Path to Arabic PDF             |
| pdf_fr_path       | VARCHAR(255)  | NULLABLE           | Path to French PDF             |
| status            | ENUM          | NOT NULL, DEFAULT  | draft/published/archived       |
| created_at        | TIMESTAMP     | NULLABLE           | Creation timestamp             |
| updated_at        | TIMESTAMP     | NULLABLE           | Update timestamp               |

**Indexes**:
- `license_category_id, status`

**Foreign Keys**:
- `license_category_id` → `license_categories.id` (RESTRICT ON DELETE)
- `created_by` → `users.id` (RESTRICT ON DELETE)

---

### 2. tests
**Purpose**: Store test/quiz configurations

| Column              | Type          | Attributes         | Description                    |
|---------------------|---------------|--------------------|--------------------------------|
| id                  | BIGINT        | PK, AUTO_INCREMENT | Primary key                    |
| license_category_id | BIGINT        | FK, INDEXED        | Reference to category          |
| created_by          | BIGINT        | FK                 | User who created               |
| name_ar             | VARCHAR(200)  | NOT NULL           | Arabic title                   |
| name_fr             | VARCHAR(200)  | NOT NULL           | French title                   |
| description_ar      | TEXT          | NULLABLE           | Arabic description             |
| description_fr      | TEXT          | NULLABLE           | French description             |
| cover_path          | VARCHAR(255)  | NULLABLE           | Path to cover image            |
| duration_minutes    | SMALLINT      | NOT NULL, DEFAULT  | Test duration (minutes)        |
| pass_percentage     | DECIMAL(5,2)  | NOT NULL, DEFAULT  | Passing score (0-100)          |
| status              | ENUM          | NOT NULL, DEFAULT  | draft/published/archived       |
| created_at          | TIMESTAMP     | NULLABLE           | Creation timestamp             |
| updated_at          | TIMESTAMP     | NULLABLE           | Update timestamp               |

**Indexes**:
- `license_category_id, status`

**Foreign Keys**:
- `license_category_id` → `license_categories.id` (RESTRICT ON DELETE)
- `created_by` → `users.id` (RESTRICT ON DELETE)

---

### 3. test_questions (Pivot Table)
**Purpose**: Link tests with questions and define ordering

| Column         | Type          | Attributes         | Description                    |
|----------------|---------------|--------------------|--------------------------------|
| id             | BIGINT        | PK, AUTO_INCREMENT | Primary key                    |
| test_id        | BIGINT        | FK, INDEXED        | Reference to test              |
| question_id    | BIGINT        | FK, INDEXED        | Reference to question          |
| question_order | SMALLINT      | NOT NULL           | Display order (1, 2, 3...)     |
| points         | DECIMAL(6,2)  | NOT NULL, DEFAULT  | Points for this question       |

**Unique Constraints**:
- `(test_id, question_id)` - Same question can't appear twice in a test
- `(test_id, question_order)` - No duplicate order numbers in a test

**Foreign Keys**:
- `test_id` → `tests.id` (CASCADE ON DELETE)
- `question_id` → `questions.id` (RESTRICT ON DELETE)

**Note**: No timestamps on pivot table

---

## Relationships Summary

### LicenseCategory
```php
hasMany(Course::class)
hasMany(Test::class)
hasMany(Exam::class)
hasMany(Question::class)
```

### Course
```php
belongsTo(LicenseCategory::class)
belongsTo(User::class, 'created_by')
```

### Test
```php
belongsTo(LicenseCategory::class)
belongsTo(User::class, 'created_by')
hasMany(TestQuestion::class)
belongsToMany(Question::class, 'test_questions')
    ->withPivot(['question_order', 'points'])
    ->orderBy('test_questions.question_order')
```

### TestQuestion
```php
belongsTo(Test::class)
belongsTo(Question::class)
```

### Question (Updated)
```php
belongsTo(LicenseCategory::class)
hasMany(ExamQuestion::class)
hasMany(TestQuestion::class)  // NEW
belongsToMany(Test::class)     // NEW
belongsToMany(Exam::class)
```

---

## Data Flow Examples

### Creating a Course
```
1. User submits course form
2. CourseController validates input
3. Files uploaded to storage/app/courses/
4. Course record created in database
5. File paths saved to cover_path, pdf_ar_path, pdf_fr_path
6. created_by set to authenticated user ID
7. license_category_id set to selected category
```

### Creating a Test
```
1. User submits test form with selected questions
2. TestController validates input
3. Files uploaded to storage/app/tests/
4. Test record created in database
5. For each selected question:
   - Create test_questions pivot record
   - Set question_order based on position
   - Set points (default: 1)
6. created_by set to authenticated user ID
7. license_category_id set to selected category
```

### Fetching Category Content
```sql
-- Get all courses for category
SELECT * FROM courses 
WHERE license_category_id = {id} 
ORDER BY created_at DESC;

-- Get all tests with question count
SELECT t.*, COUNT(tq.id) as questions_count
FROM tests t
LEFT JOIN test_questions tq ON t.id = tq.test_id
WHERE t.license_category_id = {id}
GROUP BY t.id
ORDER BY t.created_at DESC;

-- Get test questions in order
SELECT q.*, tq.question_order, tq.points
FROM questions q
JOIN test_questions tq ON q.id = tq.question_id
WHERE tq.test_id = {id}
ORDER BY tq.question_order ASC;
```

---

## Migration Order

Migrations MUST run in this order due to foreign key dependencies:

```
1. create_license_categories_table     (base table)
2. create_users_table                  (base table)
3. create_questions_table              (depends on categories, users)
4. create_courses_table                ✨ NEW (depends on categories, users)
5. create_tests_table                  ✨ NEW (depends on categories, users)
6. create_test_questions_table         ✨ NEW (depends on tests, questions)
```

---

## Cascade Rules

### ON DELETE Behavior

**RESTRICT** (Prevent deletion if referenced):
- `license_category_id` in courses, tests
- `created_by` in courses, tests
- `question_id` in test_questions

**CASCADE** (Delete related records):
- `test_id` in test_questions (deleting test removes all question associations)

### Example Scenarios

**Scenario 1**: Delete a course
```
✅ Course deleted
✅ Files deleted from storage
✅ No related records affected
```

**Scenario 2**: Delete a test
```
✅ Test deleted
✅ All test_questions records CASCADE deleted
✅ Questions remain intact (can be reused)
✅ Files deleted from storage
```

**Scenario 3**: Try to delete a category with courses
```
❌ DELETE fails (RESTRICT constraint)
💡 Must deactivate or delete courses first
```

**Scenario 4**: Try to delete a question used in tests
```
❌ DELETE fails (RESTRICT constraint)
💡 Must remove from tests first or deactivate
```

---

## File Storage Structure

```
storage/app/
├── courses/
│   ├── covers/
│   │   ├── xY7zK3mN9qP2.jpg
│   │   └── aB4cD8eF1gH5.webp
│   └── pdfs/
│       ├── iJ6kL0mN3oP7_ar.pdf
│       └── qR8sT2uV5wX9_fr.pdf
└── tests/
    └── covers/
        ├── yZ1aB4cD7eF0.png
        └── gH3iJ6kL9mN2.jpg
```

**File Naming**: Laravel auto-generates unique names  
**Access**: Via authenticated controller routes only  
**Max Sizes**:
- Images: 4MB
- PDFs: 20MB

---

## Query Performance

### Indexes Created
1. `courses(license_category_id, status)` - Fast category filtering
2. `tests(license_category_id, status)` - Fast category filtering
3. `test_questions(test_id)` - Fast question lookup by test
4. `test_questions(question_id)` - Fast test lookup by question

### Optimized Queries
```php
// ✅ Efficient - Eager load relationships
Test::with('licenseCategory')->withCount('questions')->get();

// ❌ Inefficient - N+1 problem
Test::all()->each(fn($t) => $t->licenseCategory->name);

// ✅ Efficient - Use joins for filtering
Test::whereHas('questions', fn($q) => $q->where('is_active', true))->get();
```

---

## Data Integrity

### Constraints Enforced

1. **Unique Constraints**
   - `(test_id, question_id)` - No duplicate questions in test
   - `(test_id, question_order)` - No order conflicts

2. **Foreign Key Constraints**
   - All FKs enforce referential integrity
   - RESTRICT prevents orphaned records
   - CASCADE cleans up related data

3. **Check Constraints** (via Laravel validation)
   - `duration_minutes`: 1-300
   - `pass_percentage`: 0-100
   - `status`: only draft/published/archived
   - File types: validated on upload

4. **NOT NULL Constraints**
   - All bilingual names required
   - Category required
   - Status required

---

## Backup Recommendations

### Critical Data
- Courses table (content + metadata)
- Tests table (configuration)
- Test_questions table (associations)
- File storage (covers + PDFs)

### Backup Strategy
```bash
# Database backup
php artisan backup:run --only-db

# File backup
tar -czf storage-backup.tar.gz storage/app/courses storage/app/tests

# Full backup (recommended)
php artisan backup:run
```

---

## Statistics Queries

### Dashboard Stats
```sql
-- Total courses by status
SELECT status, COUNT(*) as count 
FROM courses 
GROUP BY status;

-- Total tests by category
SELECT lc.name_fr, COUNT(t.id) as test_count
FROM license_categories lc
LEFT JOIN tests t ON lc.id = t.license_category_id
GROUP BY lc.id;

-- Average questions per test
SELECT AVG(question_count) as avg_questions
FROM (
    SELECT test_id, COUNT(*) as question_count
    FROM test_questions
    GROUP BY test_id
) as counts;

-- Most used questions in tests
SELECT q.id, COUNT(tq.test_id) as usage_count
FROM questions q
JOIN test_questions tq ON q.id = tq.question_id
GROUP BY q.id
ORDER BY usage_count DESC
LIMIT 10;
```

---

## Version History

**v1.0.0** - October 30, 2026
- Initial schema creation
- courses table
- tests table
- test_questions pivot table
- Full relationships established

---

**Total Tables**: 3 new tables  
**Total Relationships**: 8 new relationships  
**Total Indexes**: 4 indexes  
**Total Foreign Keys**: 6 foreign keys  
**Total Constraints**: 2 unique constraints

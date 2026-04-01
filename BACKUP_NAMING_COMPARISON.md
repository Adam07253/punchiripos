# Backup Naming Convention - Before & After

## Part 4 Implementation: Backup System Update

---

## BEFORE (Old System)

### Naming Pattern
```
shopdb_YYYY-MM-DD_divClose_<n>.db
shopdb_YYYY-MM-DD_divOpen.db
```

### Example Files
```
backups/
├── shopdb_2026-03-18_divClose_1.db
├── shopdb_2026-03-18_divClose_2.db
├── shopdb_2026-03-18_divClose_3.db
├── shopdb_2026-03-25_divClose_1.db
├── shopdb_2026-03-26_divClose_1.db
└── shopdb_2026-03-26_divClose_2.db
```

### Issues
- ❌ Prefix "shopdb" not aligned with store name
- ⚠️ Inconsistent with branding

---

## AFTER (New System)

### Naming Pattern
```
storedb_YYYY-MM-DD_divClose_<n>.db
storedb_YYYY-MM-DD_divOpen.db
```

### Example Files
```
backups/
├── storedb_2026-03-31_divOpen.db       ← Automatic (12 PM)
├── storedb_2026-03-31_divClose_1.db    ← Manual close #1
├── storedb_2026-03-31_divClose_2.db    ← Manual close #2
├── storedb_2026-03-31_divClose_3.db    ← Manual close #3
├── storedb_2026-04-01_divOpen.db       ← Next day automatic
└── storedb_2026-04-01_divClose_1.db    ← Next day close
```

### Benefits
- ✅ Prefix "storedb" aligned with store database
- ✅ Consistent branding
- ✅ Clear naming convention
- ✅ Easy to identify backup type and date

---

## Backup Types Explained

### 1. divOpen (Automatic Daily Backup)
**When:** Every day at 12:00 PM (noon)  
**Format:** `storedb_YYYY-MM-DD_divOpen.db`  
**Purpose:** Daily snapshot when store opens  
**Frequency:** Once per day (automatic)

**Example:**
```
storedb_2026-03-31_divOpen.db
```

### 2. divClose (Manual Store Closing)
**When:** User clicks "Close Store" button  
**Format:** `storedb_YYYY-MM-DD_divClose_<n>.db`  
**Purpose:** Backup when store closes for the day  
**Frequency:** Multiple times per day (manual)

**Examples:**
```
storedb_2026-03-31_divClose_1.db  ← First close
storedb_2026-03-31_divClose_2.db  ← Second close (reopened)
storedb_2026-03-31_divClose_3.db  ← Third close
```

---

## Multi-Close Scenario

### Real-World Example

**Date: March 31, 2026**

| Time     | Event                | Backup Created                          |
|----------|----------------------|-----------------------------------------|
| 12:00 PM | Store opens (auto)   | `storedb_2026-03-31_divOpen.db`        |
| 06:00 PM | Store closes         | `storedb_2026-03-31_divClose_1.db`     |
| 07:00 PM | Store reopens        | (no backup)                             |
| 09:00 PM | Store closes again   | `storedb_2026-03-31_divClose_2.db`     |
| 10:00 PM | Store reopens        | (no backup)                             |
| 11:30 PM | Final close          | `storedb_2026-03-31_divClose_3.db`     |

**Result:** 4 backups for March 31
- 1 divOpen (automatic)
- 3 divClose (manual, sequential)

---

## Sequential Numbering Logic

### How It Works

1. User clicks "Close Store"
2. System checks existing backups for today
3. Finds highest number (e.g., `divClose_2.db`)
4. Creates next backup with number + 1 (e.g., `divClose_3.db`)

### Code Logic
```javascript
function getNextCloseNumber(dateStr) {
  const files = fs.readdirSync(backupFolder);
  const pattern = new RegExp(`^storedb_${dateStr}_divClose_(\\d+)\\.db$`);
  
  const numbers = files
    .map(file => {
      const match = file.match(pattern);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter(num => num !== null);
  
  return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
}
```

---

## Day-wise Organization

### Multiple Days Example

```
backups/
├── storedb_2026-03-29_divOpen.db
├── storedb_2026-03-29_divClose_1.db
├── storedb_2026-03-30_divOpen.db
├── storedb_2026-03-30_divClose_1.db
├── storedb_2026-03-30_divClose_2.db
├── storedb_2026-03-31_divOpen.db
├── storedb_2026-03-31_divClose_1.db
├── storedb_2026-03-31_divClose_2.db
├── storedb_2026-03-31_divClose_3.db
├── storedb_2026-04-01_divOpen.db
└── storedb_2026-04-01_divClose_1.db
```

### Key Points
- ✅ Each day is independent
- ✅ No overwrites across days
- ✅ Easy to find specific day's backups
- ✅ Sequential numbering resets each day

---

## Cloudflare R2 Storage

### Cloud Organization

```
R2 Bucket: punchiri-backups
├── 2026/
│   ├── 03/
│   │   ├── storedb_2026-03-29_divOpen.db
│   │   ├── storedb_2026-03-29_divClose_1.db
│   │   ├── storedb_2026-03-30_divOpen.db
│   │   ├── storedb_2026-03-30_divClose_1.db
│   │   ├── storedb_2026-03-31_divOpen.db
│   │   └── storedb_2026-03-31_divClose_1.db
│   └── 04/
│       ├── storedb_2026-04-01_divOpen.db
│       └── storedb_2026-04-01_divClose_1.db
```

### Benefits
- Organized by year/month
- Easy to browse and restore
- Automatic upload after local backup
- Redundant storage (local + cloud)

---

## Migration Notes

### Backward Compatibility
- Old `shopdb_*` backups remain intact
- System works with both old and new formats
- No data loss during transition
- New backups use `storedb_*` format

### Existing Backups
```
backups/
├── shopdb_2026-03-18_divClose_1.db    ← OLD (legacy)
├── shopdb_2026-03-25_divClose_1.db    ← OLD (legacy)
├── storedb_2026-03-31_divOpen.db      ← NEW
└── storedb_2026-03-31_divClose_1.db   ← NEW
```

---

## Testing Commands

### Run Backup Test
```bash
node test-part4-backup.js
```

### Manual Store Closing
```bash
curl -X POST http://localhost:3000/api/store-closing-backup
```

### Check Backup Files
```bash
ls -lh backups/storedb_*
```

---

## Summary

| Feature                  | Before      | After       |
|--------------------------|-------------|-------------|
| Prefix                   | `shopdb`    | `storedb`   |
| divOpen format           | ✅          | ✅          |
| divClose format          | ✅          | ✅          |
| Sequential numbering     | ✅          | ✅          |
| Multi-close support      | ✅          | ✅          |
| Day-wise organization    | ✅          | ✅          |
| R2 cloud upload          | ✅          | ✅          |
| Backward compatibility   | N/A         | ✅          |

**Status:** ✅ Part 4 Complete - All backup features working with new naming convention

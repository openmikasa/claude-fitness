# CSV Import Format Guide for Claude Fitness

## Quick Answer

Your CSV needs **at least a date column**. Everything else is optional and will be auto-detected based on your column names.

## Minimum Example

```csv
date,exercise,weight,reps,sets
2024-01-15,Bench Press,80,8,4
2024-01-15,Squat,120,10,3
```

## Supported Column Names (Auto-Detected)

The system automatically recognizes these column patterns:

| Field | Recognized Column Names |
|-------|------------------------|
| **Date** (REQUIRED) | `date`, `workout date`, `workout_date`, `day` |
| **Exercise** | `exercise`, `exercise name`, `exercise_name`, `name` |
| **Weight** | `weight`, `load`, `kg`, `lbs` |
| **Reps** | `reps`, `repetitions`, `rep` |
| **Sets** | `sets`, `set` |
| **Notes** | `notes`, `note`, `comments`, `comment` |

## Example Formats

### Strength Training
```csv
date,exercise,weight,reps,sets,notes
2024-01-15,Bench Press,80,8,4,Good form
2024-01-15,Squat,120,10,3,Felt strong
2024-01-16,Deadlift,160,5,2,New PR
```

### Multiple Exercises Per Day
```csv
date,exercise,weight,reps,sets
2024-01-15,Bench Press,80,8,4
2024-01-15,Squat,120,10,3
2024-01-15,Barbell Row,70,8,3
```

## File Requirements

- **Format**: `.csv` or `.txt` files
- **Max Size**: 10MB
- **Max Rows**: 5,000 workouts
- **Delimiter**: Comma, semicolon, or tab (auto-detected)
- **Headers**: First row must contain column names

## Validation Rules

### Date (Required)
- Any standard date format works: `2024-01-15`, `01/15/2024`, `Jan 15, 2024`
- Must be a valid date

### Numeric Fields
- **Weight**: Must be ≥ 0
- **Reps**: Must be ≥ 1 (whole number)
- **Sets**: Must be ≥ 1 (whole number)

### Notes
- Free text, any length
- Optional

## Import Process

The app uses a 4-step wizard:

1. **Upload** - Drag and drop your CSV file
2. **Map Columns** - System auto-maps columns (you can adjust if needed)
3. **Review** - Preview your data before importing
4. **Import** - Server validates and imports in batches

## Error Handling

- System continues importing even if some rows fail
- You'll get a detailed report:
  - Total rows processed
  - Successful imports
  - Failed rows with specific error messages
- Failed rows won't crash the whole import

## Where to Find It

Navigate to: **Workouts** → **Import** in the app menu

Or directly: `/workouts/import`

## Tips

1. **Keep it simple**: Start with just date + exercise columns
2. **Let auto-detect work**: Use common column names like "date", "exercise", "weight"
3. **Test with small file first**: Try 10-20 rows before importing thousands
4. **Date consistency**: Use the same date format throughout your file
5. **Multiple exercises per day**: Just repeat the date for each exercise

## No Implementation Needed

This is informational only - the CSV import functionality already exists and is working in your app. You just need to format your historical training data according to the patterns above.

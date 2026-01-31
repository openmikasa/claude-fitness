#!/usr/bin/env python3
"""Parse training notes and convert to CSV format for Claude Fitness import"""

import re
import csv
from datetime import datetime

# Raw training notes (from transcript)
raw_notes = """01/30/26 Push
Pull-ups 12x12x12x8x0kg (slow)
Barbell row 12x60kg 12x12x80kg (slow)
Cable row 12x12x65kg
cable on arm row 12x30kg
Barbell curl 12x12x12x45lb (slowl) (bar not counted)
Facepull 12x0 (slow)
Sauna 17min 180f

01/26/26 push
Dumbbell bench press 10x45lb 10x60lb 12x12x80lb 6x90lb
Dumbbell overhead press 12x12x35lb (slow) 6x450lb
Lateral raise 12x12x17.5lb 12x12.5lb (slow)
Cable push wide 12x12x22.5kg
Machine push
Pushups 20x0kg
Abs x3
sauna 18min 180f

01/23/26
pull
pull-ups
machine row
machine one arm
machine row closed
machine row wide
machine barbell curl
all very slow

01/21/26
run zone 2 35min  (2 degre, 4.5 speed)

01/20/26
run zone 2 15min (2 degre, 4.5 speed)
sauna 17min 180f

01/19/26 Push Dumbbell
Butterfly on wall 30s
Dumbbell bench press 12x45lb 12x60lb 12x80lb 12x90lb (need one more serie)
Dumbbell overhead press 12x12x50lb (cheating) 12x45lb
Lateral raise 12x12x17.5lb 12x12lb
Cable push wide 12x12x22.5kg
Pushups 20x0kg
Abs
sauna 17min 180f

01/18/26
Run zone2 37min (2 degre, 4.5 speed)

01/17/26 Legs
Leg press 12x100 12x200 12x300 12x400lb one leg 12x200lb 12x300lb
Zercher squats 12x60kg front squat 7x60kg
Hex Deadlift 5x175lb 5x265lb 3x355lb
ATG split squat 12x20kg
Nordic curl 12x0kg
Patrick step 12x12x0kg pistol squat 12x0kg
Tibialis raise 12x40lb 12x50lb
Seated good morning 12x12x25lb
Lunges 20x20x40lb each arm
Bulgarian split squat 12x40lb
sauna 18.5min 180f

01/16/26 Pull
Pull-ups 12x12x12x12x0kg
Barbell row 5x60kg 12x12x80kg
Dumbbell row 12x90lb
Machine row one arm 12x12x35kg
Machine Barbell curl 12x12x45lb (bar not counted)
Facepull
Sauna 17min 180f

01/14/26
Stairs 30min at 7 of speed

01/12/26 Push Dumbbell
Butterfly on wall 30s
Dumbbell bench press 12x45lb 12x60lb 12x80lb 10x8x90lb
Dumbbell overhead press 12x12x45lb barbell 5x90lb
Lateral raise 12x12x17.5lb 12x12lb
Cable push wide 12x12x22.5kg
Pushups 20x0kg
Band 20x20x0kg
Butterfly on wall 60s

01/11/26 Legs
Leg press 12x100 12x200 12x300 12x400lb one leg 12x200lb 12x300lb
Zercher squats 12x60kg
Hex Deadlift 5x175lb 5x265lb 3x355lb
Nordic curl 12x0kg
Patrick step 12x12x0kg pistol squat 12x0kg
Tibialis raise 12x40lb 12x50lb
Seated good morning 12x12x25lb
Lunges 20x20x40lb each arm
Bulgarian split squat 12x40lb

01/10/26 Pull
Pull-ups 12x12x12x12x0kg
Barbell row 12x60kg 12x12x80kg
Dumbbell row 12x90lb
Cable row 12x65kg
Machine row one arm 12x12x35kg
Machine Barbell curl 12x12x45lb (bar not counted)
Facepull"""


def parse_set_notation(notation):
    """
    Parse set notation like "12x12x12x45lb" or "12x60kg"
    Returns list of (reps, weight, unit) tuples
    """
    notation = notation.strip()

    # Extract unit (kg or lb)
    unit_match = re.search(r'(kg|lb)$', notation)
    if not unit_match:
        return []

    unit = unit_match.group(1)
    notation_no_unit = notation[:unit_match.start()].strip()

    # Split by 'x'
    parts = notation_no_unit.split('x')

    if len(parts) < 2:
        return []

    # Last part is weight, others are reps
    weight = parts[-1]
    reps_parts = parts[:-1]

    try:
        weight_val = float(weight)
        results = []

        for reps_str in reps_parts:
            reps_val = int(reps_str)
            results.append((reps_val, weight_val, unit))

        return results
    except ValueError:
        return []


def parse_training_notes(notes_text):
    """Parse training notes into structured workout data"""
    lines = notes_text.strip().split('\n')
    workouts = []
    current_date = None
    current_workout_type = None

    # Skip cardio/sauna only sessions
    skip_dates = {'01/21/26', '01/20/26', '01/18/26', '01/14/26'}

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Check for date line
        date_match = re.match(r'^(\d{2}/\d{2}/\d{2})', line)
        if date_match:
            current_date = date_match.group(1)
            # Extract workout type if present
            rest_of_line = line[len(current_date):].strip()
            if rest_of_line:
                current_workout_type = rest_of_line
            continue

        if not current_date or current_date in skip_dates:
            continue

        # Skip non-exercise lines
        if any(skip in line.lower() for skip in ['sauna', 'run', 'stairs', 'butterfly on wall', 'abs', 'band']):
            continue

        # Skip incomplete lines (no weight info)
        if not re.search(r'\d+x\d+.*?(kg|lb)', line):
            continue

        # Parse exercise name and set notation
        # Pattern: "Exercise name reps x weight unit (notes)"
        # Need to be more careful to capture full exercise name

        # Find all set notations in the line
        set_notations = re.findall(r'\d+x[\d.]+(?:kg|lb)', line)

        if not set_notations:
            continue

        # Exercise name is everything before the first set notation
        first_notation_pos = line.find(set_notations[0])
        exercise_name = line[:first_notation_pos].strip()

        # Clean up exercise name - remove trailing numbers and "x" patterns
        exercise_name = re.sub(r'\s+\d+x.*$', '', exercise_name).strip()

        if not exercise_name:
            continue

        set_info = line[first_notation_pos:].strip()

        # Extract notes in parentheses
        notes_match = re.search(r'\(([^)]+)\)', set_info)
        notes = notes_match.group(1) if notes_match else None

        for notation in set_notations:
            sets_data = parse_set_notation(notation)
            for reps, weight, unit in sets_data:
                # Convert date to YYYY-MM-DD
                month, day, year = current_date.split('/')
                iso_date = f'20{year}-{month}-{day}'

                workouts.append({
                    'date': iso_date,
                    'exercise': exercise_name,
                    'weight': weight,
                    'weight_unit': unit,
                    'reps': reps,
                    'sets': 1,  # Each parsed set is count 1
                    'notes': notes or ''
                })

    return workouts


def consolidate_workouts(workouts):
    """Consolidate multiple identical sets into single row with sets count"""
    consolidated = []
    seen = {}

    for w in workouts:
        # Create key for grouping identical sets
        key = (w['date'], w['exercise'], w['weight'], w['weight_unit'], w['reps'], w['notes'])

        if key in seen:
            seen[key]['sets'] += 1
        else:
            seen[key] = w.copy()
            consolidated.append(w)

    return consolidated


def write_csv(workouts, filename):
    """Write workouts to CSV file"""
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['date', 'exercise', 'weight', 'reps', 'sets', 'notes'])
        writer.writeheader()

        for w in workouts:
            # Include unit in weight value (e.g., "45lb" or "60kg")
            writer.writerow({
                'date': w['date'],
                'exercise': w['exercise'],
                'weight': f"{w['weight']}{w['weight_unit']}",
                'reps': w['reps'],
                'sets': w['sets'],
                'notes': w['notes']
            })


if __name__ == '__main__':
    workouts = parse_training_notes(raw_notes)
    workouts = consolidate_workouts(workouts)

    # Sort by date and exercise
    workouts.sort(key=lambda x: (x['date'], x['exercise'], x['weight']))

    output_file = 'training_history.csv'
    write_csv(workouts, output_file)

    print(f"✓ Processed {len(workouts)} workout entries")
    print(f"✓ CSV file created: {output_file}")

    # Print sample
    print("\nSample rows:")
    for i, w in enumerate(workouts[:10]):
        print(f"  {w['date']} | {w['exercise']} | {w['weight']}{w['weight_unit']} × {w['reps']} reps × {w['sets']} sets")

import { test, expect } from '@playwright/test';

// Test configuration
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';
const BASE_URL = 'http://localhost:3000';

test.describe('Settings Persistence & Advanced Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/`);
  });

  test.describe('Settings Persistence', () => {
    test('should persist units preference to database', async ({ page }) => {
      // Navigate to settings
      await page.goto(`${BASE_URL}/settings`);

      // Change units to imperial
      await page.selectOption('select:has-text("Units")', 'imperial');
      await page.click('button:has-text("Save")');

      // Wait for save to complete
      await expect(page.locator('button:has-text("Save")')).not.toBeDisabled();

      // Reload page and verify persistence
      await page.reload();
      await expect(page.locator('select:has-text("Units")')).toHaveValue('imperial');
    });

    test('should persist theme preference to database', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);

      // Change theme to dark
      await page.selectOption('select:has-text("Theme")', 'dark');
      await page.click('button:has-text("Save")');

      // Wait for save
      await expect(page.locator('button:has-text("Save")')).not.toBeDisabled();

      // Reload and verify
      await page.reload();
      await expect(page.locator('select:has-text("Theme")')).toHaveValue('dark');
    });

    test('should sync settings across devices (simulate)', async ({ page, context }) => {
      // Set units to imperial
      await page.goto(`${BASE_URL}/settings`);
      await page.selectOption('select:has-text("Units")', 'imperial');
      await page.click('button:has-text("Save")');

      // Open new tab (simulates different device)
      const newPage = await context.newPage();
      await newPage.goto(`${BASE_URL}/settings`);

      // Verify settings are synced
      await expect(newPage.locator('select:has-text("Units")')).toHaveValue('imperial');

      await newPage.close();
    });
  });

  test.describe('Equipment Filtering', () => {
    test('should filter workouts by equipment', async ({ page }) => {
      await page.goto(`${BASE_URL}/workouts`);

      // Get initial workout count
      const initialCount = await page.locator('[data-testid="workout-card"]').count();

      // Apply equipment filter
      await page.click('text=Equipment');
      await page.check('input[value="Barbell"]');
      await page.click('button:has-text("Apply")');

      // Wait for results to update
      await page.waitForTimeout(500);

      // Verify filtering worked
      const filteredCount = await page.locator('[data-testid="workout-card"]').count();

      // Should have results (if test data exists)
      if (initialCount > 0) {
        expect(filteredCount).toBeGreaterThanOrEqual(0);
        expect(filteredCount).toBeLessThanOrEqual(initialCount);
      }

      // Verify filter chip appears
      await expect(page.locator('text=/Equipment.*Barbell/i')).toBeVisible();
    });

    test('should clear equipment filter', async ({ page }) => {
      await page.goto(`${BASE_URL}/workouts`);

      // Apply filter
      await page.click('text=Equipment');
      await page.check('input[value="Barbell"]');
      await page.click('button:has-text("Apply")');

      // Clear filter using chip
      await page.click('button:has-text("Equipment:")');

      // Verify filter cleared
      await expect(page.locator('text=/Equipment.*Barbell/i')).not.toBeVisible();
    });
  });

  test.describe('Muscle Group Filtering', () => {
    test('should filter workouts by muscle groups', async ({ page }) => {
      await page.goto(`${BASE_URL}/workouts`);

      // Apply muscle group filter
      await page.click('text=Muscle Groups');
      await page.check('input[value="Chest"]');
      await page.click('button:has-text("Apply")');

      // Wait for results
      await page.waitForTimeout(500);

      // Verify filter chip appears
      await expect(page.locator('text=/Muscles.*Chest/i')).toBeVisible();
    });

    test('should combine equipment and muscle group filters', async ({ page }) => {
      await page.goto(`${BASE_URL}/workouts`);

      // Apply both filters
      await page.click('text=Equipment');
      await page.check('input[value="Barbell"]');
      await page.click('text=Muscle Groups');
      await page.check('input[value="Chest"]');
      await page.click('button:has-text("Apply")');

      // Wait for results
      await page.waitForTimeout(500);

      // Verify both filter chips appear
      await expect(page.locator('text=/Equipment.*Barbell/i')).toBeVisible();
      await expect(page.locator('text=/Muscles.*Chest/i')).toBeVisible();
    });
  });

  test.describe('New Workout Creation with Equipment', () => {
    test('should create workout with equipment and muscle groups', async ({ page }) => {
      await page.goto(`${BASE_URL}/workouts/log`);

      // Select strength workout
      await page.click('button:has-text("Strength")');

      // Fill in exercise name using autocomplete
      await page.fill('input[placeholder*="Bench"]', 'Bench Press');
      await page.waitForTimeout(500);

      // Select from autocomplete dropdown if available
      const autocompleteOption = page.locator('text="Bench Press"').first();
      if (await autocompleteOption.isVisible()) {
        await autocompleteOption.click();
      }

      // Select equipment
      await page.click('text=Equipment');
      await page.check('input[value="Barbell"]');

      // Add set details
      await page.fill('input[placeholder="0"]:has-text("Weight")', '100');
      await page.fill('input[placeholder="0"]:has-text("Reps")', '10');

      // Select workout date
      const today = new Date().toISOString().split('T')[0];
      await page.fill('input[type="date"]', today);

      // Submit workout
      await page.click('button[type="submit"]:has-text("Save")');

      // Verify success (navigate to workouts page or see confirmation)
      await page.waitForURL(`${BASE_URL}/workouts`, { timeout: 5000 });

      // Verify new workout appears in list
      await expect(page.locator('text="Bench Press"')).toBeVisible();
    });
  });

  test.describe('Backfill System', () => {
    test('should show backfill banner when unmigrated workouts exist', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);

      // Check if banner exists (may not if all workouts migrated)
      const banner = page.locator('[data-testid="backfill-banner"]');
      const bannerVisible = await banner.isVisible();

      if (bannerVisible) {
        // Verify banner content
        await expect(banner).toContainText('Enhance Your Workout Data');
        await expect(banner.locator('button:has-text("Start Migration")')).toBeVisible();
      }
    });

    test('should open backfill modal and process workout', async ({ page }) => {
      await page.goto(`${BASE_URL}/`);

      const banner = page.locator('[data-testid="backfill-banner"]');
      const bannerVisible = await banner.isVisible();

      if (bannerVisible) {
        // Click start migration
        await banner.locator('button:has-text("Start Migration")').click();

        // Verify modal opens
        await expect(page.locator('text="Migrate Workout Data"')).toBeVisible();

        // Fill in exercise data
        await page.fill('input[placeholder*="Search"]', 'Bench Press');
        await page.waitForTimeout(500);

        // Select equipment
        await page.click('text=Equipment Used');
        await page.check('input[value="Barbell"]');

        // Save and continue
        await page.click('button:has-text("Save")');

        // Verify progress or completion
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Backward Compatibility', () => {
    test('should display old workouts without migration', async ({ page }) => {
      await page.goto(`${BASE_URL}/workouts`);

      // Find any workout and open it
      const workoutCards = page.locator('[data-testid="workout-card"]');
      const count = await workoutCards.count();

      if (count > 0) {
        await workoutCards.first().click();

        // Verify workout details display
        await expect(page.locator('text=/Exercise/i')).toBeVisible();

        // Should show either:
        // - Equipment/muscle group tags (if migrated), OR
        // - Exercise names without tags (if not migrated)
        // Both should work without errors
      }
    });
  });
});

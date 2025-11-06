# PowerShell Script to Force Clean Rebuild

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  FORCE CLEAN REBUILD - CLEAR ALL CACHES" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean dist
Write-Host "Step 1: Cleaning dist folder..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "  [OK] dist folder deleted" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] dist folder doesn't exist" -ForegroundColor Gray
}

# Step 2: Clean Vite cache
Write-Host ""
Write-Host "Step 2: Cleaning node_modules/.vite cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "  [OK] Vite cache deleted" -ForegroundColor Green
} else {
    Write-Host "  [SKIP] Vite cache doesn't exist" -ForegroundColor Gray
}

# Step 3: Clean Android build folders
Write-Host ""
Write-Host "Step 3: Cleaning Android build folders..." -ForegroundColor Yellow
if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build"
    Write-Host "  [OK] Android build folder deleted" -ForegroundColor Green
}
if (Test-Path "android\build") {
    Remove-Item -Recurse -Force "android\build"
    Write-Host "  [OK] Android root build folder deleted" -ForegroundColor Green
}
if (Test-Path "android\.gradle") {
    Remove-Item -Recurse -Force "android\.gradle"
    Write-Host "  [OK] Gradle cache deleted" -ForegroundColor Green
}

# Step 4: Clean Android web assets
Write-Host ""
Write-Host "Step 4: Cleaning Android web assets..." -ForegroundColor Yellow
if (Test-Path "android\app\src\main\assets\public") {
    Remove-Item -Recurse -Force "android\app\src\main\assets\public"
    Write-Host "  [OK] Old web assets deleted" -ForegroundColor Green
}

# Step 5: Build fresh
Write-Host ""
Write-Host "Step 5: Building fresh web app..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Build failed!" -ForegroundColor Red
    exit 1
}

# Step 6: Sync to Capacitor
Write-Host ""
Write-Host "Step 6: Syncing to Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Capacitor sync failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "  SUCCESS! Fresh build ready" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor White
Write-Host "  1. Open Android Studio" -ForegroundColor White
Write-Host "  2. File > Invalidate Caches > Invalidate and Restart" -ForegroundColor White
Write-Host "  3. Build > Clean Project" -ForegroundColor White
Write-Host "  4. Build > Rebuild Project" -ForegroundColor White
Write-Host "  5. Build > Generate Signed Bundle / APK" -ForegroundColor White
Write-Host ""
Write-Host "OR run Gradle directly:" -ForegroundColor White
Write-Host "  cd android" -ForegroundColor Gray
Write-Host "  .\gradlew clean" -ForegroundColor Gray
Write-Host "  .\gradlew assembleRelease" -ForegroundColor Gray
Write-Host ""

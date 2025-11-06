# PowerShell Script to Replace Android Default Icons with RoshLingua Logo
# Run this from the project root directory

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  REPLACING ANDROID DEFAULT ICONS WITH ROSHLINGUA LOGO" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Source logo
$sourceLogo = "public\roshlingua-logo-192.png"
$sourceLogo512 = "public\roshlingua-logo-512.png"

# Check if source logo exists
if (-not (Test-Path $sourceLogo)) {
    Write-Host "❌ Error: Logo not found at $sourceLogo" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Found RoshLingua logo: $sourceLogo" -ForegroundColor Green
Write-Host ""

# Define all target directories and files
$targets = @(
    "android\app\src\main\res\mipmap-mdpi\ic_launcher.png",
    "android\app\src\main\res\mipmap-mdpi\ic_launcher_round.png",
    "android\app\src\main\res\mipmap-mdpi\ic_launcher_foreground.png",
    
    "android\app\src\main\res\mipmap-hdpi\ic_launcher.png",
    "android\app\src\main\res\mipmap-hdpi\ic_launcher_round.png",
    "android\app\src\main\res\mipmap-hdpi\ic_launcher_foreground.png",
    
    "android\app\src\main\res\mipmap-xhdpi\ic_launcher.png",
    "android\app\src\main\res\mipmap-xhdpi\ic_launcher_round.png",
    "android\app\src\main\res\mipmap-xhdpi\ic_launcher_foreground.png",
    
    "android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png",
    "android\app\src\main\res\mipmap-xxhdpi\ic_launcher_round.png",
    "android\app\src\main\res\mipmap-xxhdpi\ic_launcher_foreground.png",
    
    "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png",
    "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_round.png",
    "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher_foreground.png"
)

Write-Host "Replacing $($targets.Count) icon files..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($target in $targets) {
    try {
        # Create directory if it doesn't exist
        $targetDir = Split-Path -Parent $target
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            Write-Host "  Created directory: $targetDir" -ForegroundColor Gray
        }
        
        # Copy logo to target
        Copy-Item -Path $sourceLogo -Destination $target -Force
        Write-Host "  ✓ Replaced: $target" -ForegroundColor Green
        $successCount++
    }
    catch {
        Write-Host "  ❌ Failed: $target" -ForegroundColor Red
        Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✓ Successfully replaced: $successCount files" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "❌ Failed: $failCount files" -ForegroundColor Red
}
Write-Host ""

# Add splash screen (optional)
Write-Host "Adding splash screen logo..." -ForegroundColor Yellow
$splashTarget = "android\app\src\main\res\drawable\splash.png"
$splashDir = Split-Path -Parent $splashTarget

try {
    if (-not (Test-Path $splashDir)) {
        New-Item -ItemType Directory -Path $splashDir -Force | Out-Null
    }
    
    if (Test-Path $sourceLogo512) {
        Copy-Item -Path $sourceLogo512 -Destination $splashTarget -Force
        Write-Host "✓ Added splash screen: $splashTarget" -ForegroundColor Green
    } else {
        Copy-Item -Path $sourceLogo -Destination $splashTarget -Force
        Write-Host "✓ Added splash screen: $splashTarget (using 192px logo)" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Failed to add splash screen" -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  NEXT STEPS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "1. Open Android Studio" -ForegroundColor White
Write-Host "2. Open folder: android\" -ForegroundColor White
Write-Host "3. Build > Clean Project" -ForegroundColor White
Write-Host "4. Build > Generate Signed Bundle / APK" -ForegroundColor White
Write-Host "5. Select APK > Next" -ForegroundColor White
Write-Host "6. Choose your keystore and build!" -ForegroundColor White
Write-Host ""
Write-Host "✅ All icons replaced! Ready to build in Android Studio." -ForegroundColor Green
Write-Host ""

# List all replaced files for verification
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  VERIFICATION - Check these files:" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Get-ChildItem -Path "android\app\src\main\res\mipmap-*\ic_launcher*.png" -Recurse | ForEach-Object {
    $size = (Get-Item $_.FullName).Length
    $sizeKB = [math]::Round($size / 1KB, 2)
    Write-Host "  $($_.FullName) ($sizeKB KB)" -ForegroundColor Gray
}
Write-Host ""

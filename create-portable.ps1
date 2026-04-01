# Punchiri Billing System - Create Portable Distribution

Write-Host "========================================"
Write-Host "Punchiri Billing System"
Write-Host "Creating Portable Distribution"
Write-Host "========================================"
Write-Host ""

# Check if unpacked version exists
if (-not (Test-Path "dist\win-unpacked")) {
    Write-Host "ERROR: Unpacked version not found!"
    Write-Host "Please run 'npm run dist' first"
    exit 1
}

Write-Host "Found unpacked version"

# Create output filename with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd"
$outputFile = "Punchiri-Billing-System-Portable-$timestamp.zip"

# Remove old zip if exists
if (Test-Path $outputFile) {
    Write-Host "Removing old zip file..."
    Remove-Item $outputFile -Force
}

# Create zip file
Write-Host "Creating portable zip file..."
Compress-Archive -Path "dist\win-unpacked\*" -DestinationPath $outputFile -CompressionLevel Optimal

if (Test-Path $outputFile) {
    $fileSize = (Get-Item $outputFile).Length / 1MB
    Write-Host ""
    Write-Host "========================================"
    Write-Host "SUCCESS!"
    Write-Host "========================================"
    Write-Host "Portable version created: $outputFile"
    Write-Host "File size: $([math]::Round($fileSize, 2)) MB"
    Write-Host ""
    Write-Host "Distribution Instructions:"
    Write-Host "1. Send this zip file to users"
    Write-Host "2. Users extract the zip"
    Write-Host "3. Users run Punchiri Billing System.exe"
    Write-Host "4. Done! No installation needed"
    Write-Host ""
    Write-Host "Note: Windows SmartScreen warning is normal"
    Write-Host "Users can click More info -> Run anyway"
} else {
    Write-Host "ERROR: Failed to create zip file"
    exit 1
}

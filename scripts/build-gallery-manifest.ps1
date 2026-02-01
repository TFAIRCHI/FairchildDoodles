$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$galleryDir = Join-Path $root 'Pictures\puppy-gallery'
$manifestPath = Join-Path $galleryDir 'manifest.json'
$galleryHtml = Join-Path $root 'gallery.html'

if (-not (Test-Path $galleryDir)) {
    throw "Gallery folder not found: $galleryDir"
}

$files = Get-ChildItem -Path $galleryDir -File -Include *.jpg,*.jpeg,*.png | Sort-Object Name

$items = @()
foreach ($file in $files) {
    $name = [System.IO.Path]::GetFileName($file.Name)
    $alt = ($file.BaseName -replace '_', ' ')
    $items += @{
        src = "Pictures/puppy-gallery/$name"
        alt = $alt
    }
}

$json = $items | ConvertTo-Json -Depth 4
$jsonIndented = ($json -split "`r?`n") | ForEach-Object { "        $_" } | Out-String
$jsonIndented = $jsonIndented.TrimEnd()

Set-Content -Path $manifestPath -Value $json

if (Test-Path $galleryHtml) {
    $html = Get-Content -Path $galleryHtml -Raw
    $pattern = '(?s)(<script id="puppyGalleryData" type="application/json">).*?(</script>)'
    $replacement = "`$1`r`n$jsonIndented`r`n        `$2"
    $updated = [Regex]::Replace($html, $pattern, $replacement)
    Set-Content -Path $galleryHtml -Value $updated
}

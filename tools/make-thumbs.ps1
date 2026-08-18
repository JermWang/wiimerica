Add-Type -AssemblyName System.Drawing

# Rebuilds public/thumbs/ — small JPEG copies of every image in the source
# folders below, used for the 12 channel tiles on the menu.
# Run after adding or replacing channel art:   npm run thumbs
#
# Thumbs are written flat, keyed by basename, so a file is addressed the same
# way no matter which source folder it came from. Keep basenames unique.

$root    = Split-Path $PSScriptRoot -Parent
$srcDirs = @(
    (Join-Path $root "public\wiimerica"),
    (Join-Path $root "public\miimerica")
) | Where-Object { Test-Path $_ }
$out     = Join-Path $root "public\thumbs"
$maxW   = 720
$quality = 82

New-Item -ItemType Directory -Force -Path $out | Out-Null

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
         Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [int64]$quality)

# Does the image actually use transparency? (32bpp alone does not mean it does.)
function Test-HasAlpha([System.Drawing.Image]$img) {
    if (-not [System.Drawing.Image]::IsAlphaPixelFormat($img.PixelFormat)) { return $false }
    $bmp = New-Object System.Drawing.Bitmap $img
    try {
        $stepY = [Math]::Max(1, [int]($bmp.Height / 60))
        $stepX = [Math]::Max(1, [int]($bmp.Width / 60))
        for ($y = 0; $y -lt $bmp.Height; $y += $stepY) {
            for ($x = 0; $x -lt $bmp.Width; $x += $stepX) {
                if ($bmp.GetPixel($x, $y).A -lt 250) { return $true }
            }
        }
    } finally { $bmp.Dispose() }
    return $false
}

# Bounding box of the pixels that are actually visible. Art exported from a
# design tool often carries a lot of empty margin — the logo was 68% vertical
# padding, which the boot screen reserved as a huge gap under the wordmark.
function Get-AlphaBounds([System.Drawing.Bitmap]$bmp, [int]$threshold = 10) {
    $minX = $bmp.Width; $minY = $bmp.Height; $maxX = -1; $maxY = -1
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        for ($x = 0; $x -lt $bmp.Width; $x++) {
            if ($bmp.GetPixel($x, $y).A -gt $threshold) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    if ($maxX -lt 0) { return $null }   # fully transparent
    New-Object System.Drawing.Rectangle $minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)
}

function New-Resized([System.Drawing.Image]$img, [int]$w, [int]$h, $background) {
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    if ($null -ne $background) { $g.Clear($background) }
    $g.DrawImage($img, 0, 0, $w, $h)
    $g.Dispose()
    return $bmp
}

$before = 0; $after = 0; $n = 0

$srcDirs | ForEach-Object { Get-ChildItem -File -Path "$_\*" -Include *.png,*.jpg,*.jpeg } | ForEach-Object {
    $before += $_.Length
    $img  = [System.Drawing.Image]::FromFile($_.FullName)
    $base = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
    try {
        $w = $img.Width; $h = $img.Height
        if ($w -gt $maxW) { $h = [int]($h * $maxW / $w); $w = $maxW }

        # JPEG copy — used for the channel tiles, which sit on white anyway.
        # JPEG has no alpha, so flatten transparency onto white rather than black.
        $bmp  = New-Resized $img $w $h ([System.Drawing.Color]::White)
        $dest = Join-Path $out "$base.jpg"
        $bmp.Save($dest, $codec, $params)
        $bmp.Dispose()
        $after += (Get-Item $dest).Length
        $n++

        # Images that genuinely use transparency also get a PNG copy, for
        # places that sit on a dark background (the boot screen logo).
        # This copy is trimmed to its visible pixels so the layout does not
        # reserve space for empty margins baked into the export.
        if (Test-HasAlpha $img) {
            $bmpA  = New-Resized $img $w $h $null
            $destA = Join-Path $out "$base.png"

            $box = Get-AlphaBounds $bmpA
            if ($null -ne $box -and ($box.Width -lt $bmpA.Width -or $box.Height -lt $bmpA.Height)) {
                $cropped = $bmpA.Clone($box, $bmpA.PixelFormat)
                $bmpA.Dispose()
                $bmpA = $cropped
                "  trimmed $base.png -> $($box.Width)x$($box.Height)"
            }

            $bmpA.Save($destA, [System.Drawing.Imaging.ImageFormat]::Png)
            $bmpA.Dispose()
            $after += (Get-Item $destA).Length
            $n++
        }
    } finally { $img.Dispose() }
}

"thumbs written: $n"
"before: {0:N1} MB" -f ($before/1MB)
"after:  {0:N1} MB" -f ($after/1MB)

Add-Type -AssemblyName System.Drawing

# Rebuilds public/thumbs/ — small JPEG copies of every image in
# public/wiimerica/, used for the 12 channel tiles on the menu.
# Run after adding or replacing channel art:   npm run thumbs

$root   = Split-Path $PSScriptRoot -Parent
$src    = Join-Path $root "public\wiimerica"
$out    = Join-Path $root "public\thumbs"
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

Get-ChildItem -File -Path "$src\*" -Include *.png,*.jpg,*.jpeg | ForEach-Object {
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
        if (Test-HasAlpha $img) {
            $bmpA  = New-Resized $img $w $h $null
            $destA = Join-Path $out "$base.png"
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

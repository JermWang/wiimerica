Add-Type -AssemblyName System.Drawing

# Generates the favicon set and the social share card into assets/img/.
# Run after changing the source art:   npm run share
#
# Built from real project art only — never drawn or generated text.
# Card = PFP backdrop, darkened, with the real Miimerica logo over it.
# A purpose-made 1200x630 file at public/miimerica/share.png (or .jpg) wins
# outright and is used as-is.

$root     = Split-Path $PSScriptRoot -Parent
$out      = Join-Path $root "assets\img"
$pfp      = Join-Path $root "public\wiimerica\PFP.png"
$logo     = Join-Path $root "public\thumbs\miimerica-logo.png"   # already trimmed

# optional purpose-made share art, preferred when present
$shareArt = @("share.png", "share.jpg", "share.jpeg") |
            ForEach-Object { Join-Path $root "public\miimerica\$_" } |
            Where-Object { Test-Path $_ } |
            Select-Object -First 1

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
             Where-Object { $_.MimeType -eq 'image/jpeg' }
$jpegParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$jpegParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [int64]88)

function New-Canvas([int]$w, [int]$h) {
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    return @($bmp, $g)
}

# ---- favicons: square, straight from the PFP -------------------------------
$src = [System.Drawing.Image]::FromFile($pfp)
foreach ($size in 32, 180) {
    $c = New-Canvas $size $size
    $c[1].DrawImage($src, 0, 0, $size, $size)
    $c[1].Dispose()
    $dest = Join-Path $out "icon-$size.png"
    $c[0].Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $c[0].Dispose()
    "icon-$size.png  {0:N1} KB" -f ((Get-Item $dest).Length / 1KB)
}

# ---- share card: 1200x630, cover-cropped from the source art ---------------
$W = 1200; $H = 630
$cardSrc = if ($shareArt) { [System.Drawing.Image]::FromFile($shareArt) } else { $src }

$c = New-Canvas $W $H
$bmp = $c[0]; $g = $c[1]

$scale = [Math]::Max($W / $cardSrc.Width, $H / $cardSrc.Height)
$dw = [int]($cardSrc.Width * $scale); $dh = [int]($cardSrc.Height * $scale)
$g.DrawImage($cardSrc, [int](($W - $dw) / 2), [int](($H - $dh) / 2), $dw, $dh)

# With no purpose-made card, lay the real logo over the darkened PFP
$usedLabel = if ($shareArt) { Split-Path $shareArt -Leaf } else { "PFP.png" }
if (-not $shareArt -and (Test-Path $logo)) {
    $shade = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(140, 0, 0, 0))
    $g.FillRectangle($shade, 0, 0, $W, $H)
    $shade.Dispose()

    $logoImg = [System.Drawing.Image]::FromFile($logo)
    $lw = [int]($W * 0.78)
    $lh = [int]($logoImg.Height * $lw / $logoImg.Width)
    $g.DrawImage($logoImg, [int](($W - $lw) / 2), [int](($H - $lh) / 2), $lw, $lh)
    $logoImg.Dispose()
    $usedLabel = "PFP.png + miimerica-logo.png"
}

$g.Dispose()
$dest = Join-Path $out "og-card.jpg"
$bmp.Save($dest, $jpegCodec, $jpegParams)
$bmp.Dispose()
if ($shareArt) { $cardSrc.Dispose() }
$src.Dispose()

"og-card.jpg  {0}x{1}  {2:N1} KB  from {3}" -f $W, $H, ((Get-Item $dest).Length / 1KB), $usedLabel

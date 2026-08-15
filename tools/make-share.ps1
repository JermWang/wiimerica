Add-Type -AssemblyName System.Drawing

# Generates the favicon set and the social share card into assets/img/.
# Run after changing PFP.png or the logo:   npm run share

$root = Split-Path $PSScriptRoot -Parent
$out  = Join-Path $root "assets\img"
$pfp  = Join-Path $root "public\wiimerica\PFP.png"
$logo = Join-Path $root "public\thumbs\wiimerica logo.png"   # already trimmed

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
             Where-Object { $_.MimeType -eq 'image/jpeg' }
$jpegParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$jpegParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [int64]86)

function New-Canvas([int]$w, [int]$h) {
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
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

# ---- share card: 1200x630, PFP darkened behind the wordmark ----------------
$W = 1200; $H = 630
$c = New-Canvas $W $H
$bmp = $c[0]; $g = $c[1]

# cover-crop the square PFP to the card, keeping the centre band
$scale = [Math]::Max($W / $src.Width, $H / $src.Height)
$dw = [int]($src.Width * $scale); $dh = [int]($src.Height * $scale)
$g.DrawImage($src, [int](($W - $dw) / 2), [int](($H - $dh) / 2), $dw, $dh)

# darken so the wordmark reads cleanly on top
$shade = New-Object System.Drawing.SolidBrush (
    [System.Drawing.Color]::FromArgb(150, 0, 0, 0))
$g.FillRectangle($shade, 0, 0, $W, $H)
$shade.Dispose()

$logoImg = [System.Drawing.Image]::FromFile($logo)
$lw = [int]($W * 0.72)
$lh = [int]($logoImg.Height * $lw / $logoImg.Width)
$g.DrawImage($logoImg, [int](($W - $lw) / 2), [int](($H - $lh) / 2), $lw, $lh)
$logoImg.Dispose()

$g.Dispose()
$dest = Join-Path $out "og-card.jpg"
$bmp.Save($dest, $jpegCodec, $jpegParams)
$bmp.Dispose()
$src.Dispose()
"og-card.jpg  {0}x{1}  {2:N1} KB" -f $W, $H, ((Get-Item $dest).Length / 1KB)

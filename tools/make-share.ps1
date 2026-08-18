Add-Type -AssemblyName System.Drawing

# Generates the favicon set and the social share card into assets/img/.
# Run after changing the source art:   npm run share
#
# The share card is built from real project art only — no drawn or generated
# text. Drop a purpose-made 1200x630 card at public/wiimerica/share.png (or
# .jpg) and it is used as-is. With no such file, the PFP is cover-cropped to
# card size, which carries no wordmark and so never disagrees with the
# project name.

$root     = Split-Path $PSScriptRoot -Parent
$out      = Join-Path $root "assets\img"
$pfp      = Join-Path $root "public\wiimerica\PFP.png"

# optional purpose-made share art, preferred when present
$shareArt = @("share.png", "share.jpg", "share.jpeg") |
            ForEach-Object { Join-Path $root "public\wiimerica\$_" } |
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

$g.Dispose()
$dest = Join-Path $out "og-card.jpg"
$bmp.Save($dest, $jpegCodec, $jpegParams)
$bmp.Dispose()
if ($shareArt) { $cardSrc.Dispose() }
$src.Dispose()

$usedLabel = if ($shareArt) { Split-Path $shareArt -Leaf } else { "PFP.png (no share.png found)" }
"og-card.jpg  {0}x{1}  {2:N1} KB  from {3}" -f $W, $H, ((Get-Item $dest).Length / 1KB), $usedLabel

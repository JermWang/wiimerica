Add-Type -AssemblyName System.Drawing

# Generates the favicon set and the social share card into assets/img/.
# Run after changing PFP.png:   npm run share
#
# The share-card wordmark is drawn in code (GraphicsPath + brushes), not
# copied from public/wiimerica/wiimerica logo.png — that file still says
# "Wiimerica" in its pixels (see the note in README.md), so the share card
# needed its own "Miimerica" art instead of reusing it.

$root     = Split-Path $PSScriptRoot -Parent
$out      = Join-Path $root "assets\img"
$pfp      = Join-Path $root "public\wiimerica\PFP.png"
$fontFile = Join-Path $root "tools\font-src\main.ttf"

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
             Where-Object { $_.MimeType -eq 'image/jpeg' }
$jpegParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$jpegParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [int64]86)

function New-Canvas([int]$w, [int]$h) {
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    return @($bmp, $g)
}

function New-Star([float]$cx, [float]$cy, [float]$r) {
    $pts = New-Object System.Collections.Generic.List[System.Drawing.PointF]
    for ($i = 0; $i -lt 10; $i++) {
        $ang = [Math]::PI / 2 + $i * [Math]::PI / 5
        $rad = if ($i % 2 -eq 0) { $r } else { $r * 0.42 }
        $pts.Add((New-Object System.Drawing.PointF(($cx + $rad * [Math]::Cos($ang)), ($cy - $rad * [Math]::Sin($ang)))))
    }
    return , $pts.ToArray()
}

# Draws "Miimerica" on a transparent canvas: "Mii" as a starred blue field,
# "merica" as red/white stripes, echoing a flag-canton wordmark without
# tracing the existing logo art. Returns a bitmap sized to (w, h).
function New-Wordmark([int]$w, [int]$h) {
    $pfc = New-Object System.Drawing.Text.PrivateFontCollection
    $pfc.AddFontFile($fontFile)
    $family = $pfc.Families[0]

    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))

    [single]$fontSize = 170.0
    $fmt = [System.Drawing.StringFormat]::GenericTypographic
    $path1 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path2 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $origin0 = New-Object System.Drawing.PointF(0, 0)
    $path1.AddString("Mii", $family, [int][System.Drawing.FontStyle]::Bold, $fontSize, $origin0, $fmt)
    $w1 = $path1.GetBounds().Width
    $origin1 = New-Object System.Drawing.PointF($w1, 0)
    $path2.AddString("merica", $family, [int][System.Drawing.FontStyle]::Bold, $fontSize, $origin1, $fmt)

    $b1 = $path1.GetBounds()
    $b2 = $path2.GetBounds()
    $totalW = $b2.X + $b2.Width - $b1.X
    $totalH = [Math]::Max($b1.Height, $b2.Height)

    $m = New-Object System.Drawing.Drawing2D.Matrix
    $scale = [Math]::Min(($w * 0.92) / $totalW, ($h * 0.62) / $totalH)
    $m.Translate((($w - $totalW * $scale) / 2) - $b1.X * $scale, (($h - $totalH * $scale) / 2) - $b1.Y * $scale)
    $m.Scale($scale, $scale)
    $path1.Transform($m)
    $path2.Transform($m)

    # drop shadow, offset down-right, so the mark separates from a busy photo
    $shadowOffset = [Math]::Max(3, [int]($h * 0.012))
    $shadow = New-Object System.Drawing.Drawing2D.Matrix
    $shadow.Translate($shadowOffset, $shadowOffset)
    $sp1 = $path1.Clone(); $sp1.Transform($shadow)
    $sp2 = $path2.Clone(); $sp2.Transform($shadow)
    $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(140, 0, 0, 0))
    $g.FillPath($shadowBrush, $sp1)
    $g.FillPath($shadowBrush, $sp2)

    # white halo under the fill, so the mark reads against any backdrop
    $outlinePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), ([Math]::Max(6, $h * 0.045))
    $outlinePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g.DrawPath($outlinePen, $path1)
    $g.DrawPath($outlinePen, $path2)

    # "Mii" — blue field, scattered stars, clipped to the glyph shapes
    $blue = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 20, 43, 89))
    $g.FillPath($blue, $path1)
    $g.SetClip($path1)
    $starBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $rows = 5; $cols = 4
    for ($r = 0; $r -lt $rows; $r++) {
        for ($c = 0; $c -lt $cols; $c++) {
            $sx = $b1.X * $scale + $m.OffsetX + ($c + 0.5) * ($b1.Width * $scale / $cols) + (($r % 2) * ($b1.Width * $scale / $cols / 2))
            $sy = $b1.Y * $scale + $m.OffsetY + ($r + 0.5) * ($b1.Height * $scale / $rows)
            $g.FillPolygon($starBrush, (New-Star $sx $sy ($b1.Height * $scale / $rows * 0.30)))
        }
    }
    $g.ResetClip()

    # "merica" — red/white stripes
    $stripeH = [Math]::Max(4, [int]($h * 0.02))
    $stripeBmp = New-Object System.Drawing.Bitmap 4, ($stripeH * 2)
    $sg = [System.Drawing.Graphics]::FromImage($stripeBmp)
    $sg.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 196, 30, 58))), 0, 0, 4, $stripeH)
    $sg.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)), 0, $stripeH, 4, $stripeH)
    $sg.Dispose()
    $stripeBrush = New-Object System.Drawing.TextureBrush($stripeBmp, [System.Drawing.Drawing2D.WrapMode]::Tile)
    $g.FillPath($stripeBrush, $path2)

    $g.Dispose()
    return $bmp
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

# ---- share card: 1200x630, PFP darkened behind a code-drawn wordmark -------
$W = 1200; $H = 630
$c = New-Canvas $W $H
$bmp = $c[0]; $g = $c[1]

$scale = [Math]::Max($W / $src.Width, $H / $src.Height)
$dw = [int]($src.Width * $scale); $dh = [int]($src.Height * $scale)
$g.DrawImage($src, [int](($W - $dw) / 2), [int](($H - $dh) / 2), $dw, $dh)

$shade = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(160, 0, 0, 0))
$g.FillRectangle($shade, 0, 0, $W, $H)
$shade.Dispose()

$wordmark = New-Wordmark $W ([int]($H * 0.66))
$g.DrawImage($wordmark, 0, [int](($H - $wordmark.Height) / 2))
$wordmark.Dispose()

$g.Dispose()
$dest = Join-Path $out "og-card.jpg"
$bmp.Save($dest, $jpegCodec, $jpegParams)
$bmp.Dispose()
$src.Dispose()
"og-card.jpg  {0}x{1}  {2:N1} KB" -f $W, $H, ((Get-Item $dest).Length / 1KB)

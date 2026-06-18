Add-Type -AssemblyName System.Drawing
function Create-Icon {
    param([int]$size, [string]$path)
    $bitmap = New-Object System.Drawing.Bitmap $size, $size
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#00C853'))
    $font = New-Object System.Drawing.Font('Arial', [float]($size * 0.4), [System.Drawing.FontStyle]::Bold)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
    $stringFormat = New-Object System.Drawing.StringFormat
    $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $graphics.DrawString('FV', $font, $brush, $rect, $stringFormat)
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
}
$iconsDir = 'c:\Users\A.visal\OneDrive\Desktop\ecom3\public\icons'
if (!(Test-Path $iconsDir)) { New-Item -ItemType Directory -Path $iconsDir | Out-Null }
Create-Icon -size 192 -path "$iconsDir\driver-192.png"
Create-Icon -size 512 -path "$iconsDir\driver-512.png"

Add-Type -AssemblyName System.IO.Compression.FileSystem

$docxPath = Join-Path (Get-Location) "Reporte_Tecnico_SyBorx_Messenger.docx"
$zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
$entry = $zip.GetEntry("word/document.xml")
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xmlContent = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()

[xml]$doc = $xmlContent
$ns = New-Object System.Xml.XmlNamespaceManager($doc.NameTable)
$ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

$paragraphs = $doc.SelectNodes("//w:p", $ns)
$lines = @()
foreach ($p in $paragraphs) {
    $texts = $p.SelectNodes(".//w:t", $ns)
    $line = ""
    foreach ($t in $texts) {
        $line += $t.InnerText
    }
    if ($line.Trim() -ne "") {
        $lines += $line
    }
}
$lines[0..60] | ForEach-Object { Write-Output $_ }

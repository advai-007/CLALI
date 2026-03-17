param(
    [string]$InputPath = "PROJECT_REPORT.md",
    [string]$OutputPath = "PROJECT_REPORT.docx"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-WorkspacePath {
    param([string]$PathValue)

    if ([System.IO.Path]::IsPathRooted($PathValue)) {
        return $PathValue
    }

    return Join-Path (Get-Location) $PathValue
}

function Add-FormattedText {
    param(
        [Parameter(Mandatory = $true)] $ParagraphRange,
        [Parameter(Mandatory = $true)] [string]$Text
    )

    $segments = [regex]::Split($Text, '(\*\*.*?\*\*)')

    foreach ($segment in $segments) {
        if ([string]::IsNullOrEmpty($segment)) {
            continue
        }

        $textRange = $ParagraphRange.Duplicate
        $textRange.Collapse(0)

        if ($segment.StartsWith('**') -and $segment.EndsWith('**')) {
            $value = $segment.Substring(2, $segment.Length - 4)
            $textRange.Text = $value
            $textRange.Font.Bold = 1
        } else {
            $textRange.Text = $segment
            $textRange.Font.Bold = 0
        }
    }
}

function Add-StyledParagraph {
    param(
        [Parameter(Mandatory = $true)] $Document,
        [Parameter(Mandatory = $true)] [string]$Text,
        [Parameter(Mandatory = $true)] [string]$StyleName
    )

    $paragraph = $Document.Paragraphs.Add()
    $paragraph.Range.Style = $StyleName
    Add-FormattedText -ParagraphRange $paragraph.Range -Text $Text
    $paragraph.Range.InsertParagraphAfter()
}

$inputFile = Resolve-WorkspacePath -PathValue $InputPath
$outputFile = Resolve-WorkspacePath -PathValue $OutputPath

if (-not (Test-Path $inputFile)) {
    throw "Input file not found: $inputFile"
}

$lines = Get-Content -Path $inputFile

$word = $null
$document = $null

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0

    $document = $word.Documents.Add()

    foreach ($line in $lines) {
        $trimmed = $line.Trim()

        if ($trimmed -eq "") {
            $document.Paragraphs.Add() | Out-Null
            continue
        }

        if ($trimmed.StartsWith("# ")) {
            Add-StyledParagraph -Document $document -Text $trimmed.Substring(2).Trim() -StyleName "Title"
            continue
        }

        if ($trimmed.StartsWith("## ")) {
            Add-StyledParagraph -Document $document -Text $trimmed.Substring(3).Trim() -StyleName "Heading 1"
            continue
        }

        if ($trimmed.StartsWith("### ")) {
            Add-StyledParagraph -Document $document -Text $trimmed.Substring(4).Trim() -StyleName "Heading 2"
            continue
        }

        if ($trimmed.StartsWith("- ")) {
            Add-StyledParagraph -Document $document -Text $trimmed.Substring(2).Trim() -StyleName "List Bullet"
            continue
        }

        Add-StyledParagraph -Document $document -Text $trimmed -StyleName "Normal"
    }

    $document.SaveAs([ref]$outputFile, [ref]16)
}
finally {
    if ($document -ne $null) {
        $document.Close()
    }

    if ($word -ne $null) {
        $word.Quit()
    }

    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}

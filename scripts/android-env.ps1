# Pencilmark: Android toolchain environment for the CURRENT PowerShell session.
#
# Dot-source it so the variables stay in your shell:
#   . .\scripts\android-env.ps1
#
# The same variables are also set at user level (new terminals pick them up), but shells that were
# opened before the toolchain was installed, and the machine-level PATH (which still lists
# JDK 11 and C:\platform-tools first), need this script.

$JdkHome     = 'D:\dev\jdk-17'
$AndroidHome = 'D:\dev\android-sdk'

foreach ($p in @($JdkHome, $AndroidHome)) {
    if (-not (Test-Path $p)) { Write-Warning "Missing: $p (see docs/ANDROID.md)" }
}

$env:JAVA_HOME        = $JdkHome
$env:ANDROID_HOME     = $AndroidHome
$env:ANDROID_SDK_ROOT = $AndroidHome   # legacy name, some tools still read it

# Newest CMake in the SDK (>= 3.31 ships long-path-aware ninja 1.12). plugins/withLocalCmake.js writes it to
# android/local.properties during prebuild. Install with: android sdk install "cmake/3.31.6"
$cmake = Get-ChildItem "$AndroidHome\cmake" -Directory -ErrorAction SilentlyContinue |
    Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
if ($cmake -and [version]$cmake.Name -ge [version]'3.31') { $env:PENCILMARK_CMAKE_DIR = $cmake.FullName }
else { Write-Warning 'CMake >= 3.31 not found; native builds may hit the 260-char path limit (see docs/ANDROID.md)' }

# Release signing values live OUTSIDE the repo. Only the path is set here, never the secrets.
if (-not $env:PENCILMARK_UPLOAD_PROPERTIES) {
    $env:PENCILMARK_UPLOAD_PROPERTIES = 'D:/dev/keys/pencilmark-upload.properties'
}

# Gradle runs `node --print ...` and `cmd /c npx ...` during settings evaluation. If a cmd.exe AutoRun
# script (HKCU\Software\Microsoft\Command Processor\AutoRun) prints anything, it corrupts what Gradle
# reads ("The filename, directory name, or volume label syntax is incorrect" / "Unexpected JSON token").
# On this machine the cause was a UTF-8 BOM before `@echo off` in ~/.cmd_prompt.bat (now removed; backup
# at ~/.cmd_prompt.bat.bak-pencilmark). Using the real node.exe also skips the Volta shim.
$realNodeDir = $null
if (Get-Command volta -ErrorAction SilentlyContinue) {
    $realNode = (& volta which node 2>$null | Select-Object -Last 1)
    if ($realNode -and (Test-Path $realNode)) { $realNodeDir = Split-Path $realNode }
}

# Prepend so these win over JDK 11 and the old C:\platform-tools adb on the machine PATH.
$prepend = @(
    $realNodeDir,
    "$JdkHome\bin",
    "$AndroidHome\platform-tools",
    "$AndroidHome\emulator",
    "$AndroidHome\cmdline-tools\latest\bin"
) | Where-Object { $_ }
$rest = ($env:Path -split ';') | Where-Object { $_ -and ($prepend -notcontains $_) }
$env:Path = (($prepend + $rest) -join ';')

Write-Host "JAVA_HOME    = $env:JAVA_HOME"
Write-Host "ANDROID_HOME = $env:ANDROID_HOME"
Write-Host ("java         = " + (Get-Command java -ErrorAction SilentlyContinue).Source)
Write-Host ("adb          = " + (Get-Command adb -ErrorAction SilentlyContinue).Source)

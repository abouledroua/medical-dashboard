Add-Type -AssemblyName System.windows.forms
$folderBrowser = New-Object System.Windows.Forms.FolderBrowserDialog
$folderBrowser.Description = "Select Workspace Folder"
$folderBrowser.ShowNewFolderButton = $true
if ($folderBrowser.ShowDialog() -eq "OK") {
    Write-Output $folderBrowser.SelectedPath
}

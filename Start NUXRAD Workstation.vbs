Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
folder = files.GetParentFolderName(WScript.ScriptFullName)
nodePath = ""
For Each entry In Split(shell.ExpandEnvironmentStrings("%PATH%"), ";")
  entry = Replace(entry, """", "")
  If Len(entry) > 0 Then
    candidate = files.BuildPath(entry, "node.exe")
    If files.FileExists(candidate) Then
      nodePath = candidate
      Exit For
    End If
  End If
Next
If nodePath = "" Then nodePath = files.BuildPath(shell.ExpandEnvironmentStrings("%ProgramFiles%"), "nodejs\node.exe")
If Not files.FileExists(nodePath) Then
  MsgBox "Install Node.js 24 or later before launching NUXRAD Workstation.", 48, "Node.js required"
  WScript.Quit 1
End If
command = Chr(34) & nodePath & Chr(34) & " " & Chr(34) & files.BuildPath(folder, "launcher.mjs") & Chr(34)
shell.Run command, 0, False

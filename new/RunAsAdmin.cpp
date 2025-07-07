#define RTN_OK 0
#define RTN_USAGE 1
#define RTN_ERROR 13

#include <windows.h>
#include <stdio.h>
#include <tlhelp32.h>


/*
 * Function forward declarations.
 *
 */
int UserIsAdmin();
BOOL SetCurrentPrivilege (LPCTSTR pszPrivilege, BOOL bEnablePrivilege);
BOOL GetProcnameByID(int pPID, char *pOutput, int pOutputLen);
int GetParentPIDByPID(int pPID);



/* 
 * Program entry point.
 *
 */
int main(int argc, char *argv[])
{
  BOOL lIsAdmin = FALSE;
  char lPrivileges[1024] = {0};
  char lParentExeFileName[1024] = {0};
  char lExeFileName[1024] = {0};
  DWORD lCurrPID = GetCurrentProcessId();
  int lParentPID = GetParentPIDByPID(lCurrPID);
  SHELLEXECUTEINFO lShExecInfo = {0};

  // Check privileges
  SetCurrentPrivilege(SE_DEBUG_NAME, TRUE);
  lIsAdmin = UserIsAdmin();
  strcpy(lPrivileges, lIsAdmin ? "Admin" : "!Admin");

  // Get process and parent process exe file name
  GetProcnameByID(lParentPID, lParentExeFileName, sizeof(lParentExeFileName));
  GetProcnameByID(lCurrPID, lExeFileName, sizeof(lExeFileName));

  // If not admin and parent is not self, relaunch Electron app as admin
  if (!lIsAdmin && strncmp(lExeFileName, lParentExeFileName, sizeof(lExeFileName)))
  {
    lShExecInfo.cbSize = sizeof(SHELLEXECUTEINFO);
    lShExecInfo.fMask = SEE_MASK_NOCLOSEPROCESS;
    lShExecInfo.hwnd = NULL;
    lShExecInfo.lpVerb = "runas";
    lShExecInfo.lpFile = "electron.exe"; // Adjust to path of Electron executable
    lShExecInfo.lpParameters = argv[1]; // Pass original Electron app path
    lShExecInfo.lpDirectory = NULL;
    lShExecInfo.nShow = SW_SHOWNORMAL;
    lShExecInfo.hInstApp = NULL;
    ShellExecuteEx(&lShExecInfo);
    WaitForSingleObject(lShExecInfo.hProcess, INFINITE);
    return 0; // Exit after launching
  }
  else if (lIsAdmin)
  {
    return 0; // Admin privileges confirmed
  }
  else
  {
    return 1; // Still not admin
  }
}

# Notes during initial video conference

## Tasks

Something about skipping over cases where you don't have write permissions
   - this would have to do with the username / login creds
   - we need to figure out how we would determine that a username has such permissions
      - one way would be to attempt creating an extension attribute
      - SOLUTION
         - under documentation -> accounts -> GET API call for /accounts/username/{name}
            - inside, verify the following exist:
               ```xml
               <privilege>Update Computers</privilege>
               <privilege>Create Computer Extension Attributes</privilege>
               ```
               - if both not present, skip the steps of creating extension attributes since we lack permissions. either way, output a CSV with the status of each computer
               - desired output (minus backdoor admin):
               ```csv
               ID, Serial Number, Computer Name, Non Backdoor Admin (aka local user) is FileVault Enabled, Local User Is Admin
               string, string, string, TRUE/FALSE/MULTIPLE, TRUE/FALSE/MULTIPLE
               ```


Test the failed cases that cropped up during call with Chris
   - a particular set of login creds failed to generate folders [Bethel School District - Health Check User in 1Pass]
      - basically need to make sure the port number appended to the end of the hostname works as expected

## Overall Gist

- num of backdoor admin accts
- name of backdoor admin accts
- see if accts are standard or admin
   - how many main accts are standard or admin

All the data is already there, he just needs it organized in a readable fashion

One CSV with:
   ```csv
   ID, Serial Number, Computer Name, Non Backdoor Admin (aka local user) is FileVault Enabled, Local User Is Admin
   string, string, string, TRUE/FALSE/MULTIPLE, TRUE/FALSE/MULTIPLE
   ```
   - Answers the question: how many users on this computer are standard vs admin?

CSV that shows how many computers a particular backdoor admin account exists on
   ```csv
   Backdoor Admin Account, Number of Computers
   admin, 100
   admin2, 500
   admin3, 20
   ```

# Organized Project Outline

## End result

Basically, we need 3 CSVs:
   1. **Local User Account Report**
   
      Ignoring all backdoor admin accounts, generate a list of all accounts across all computers (aka JamfIDs). Each account should be in its own row with the following information (columns):

      | ID (aka JamfID) | Serial Number | Computer Name | Account Name | Local User is FileVault Enabled | Local User is Admin |
      | --------------- | ------------- | ------------- | ------------ | ------------------------------- | ------------------- |
      | `string`        | `string`      |  `string`     |  `string`    | `boolean`                       | `boolean`           |

      - `Local User is FileVault Enabled` and `Local User is Admin` will be `true` if at least one account satisfies the condition, `false` otherwise.

   2. **Backdoor Admin Account Report**

      A list of all backdoor admin accounts and the number of computers they're found on:

      | Backdoor Admin Account | Number of Computers |
      | ---------------------- | ------------------- |
      | `admin`                | `100`               |

   3. **Computer Report**

      Ignoring all backdoor admin accounts, a list of all computers (aka JamfIDs). Each computer should be in its own row with the following information (columns):

      | ID  | Serial Number | Computer Name | Number of Admin Accts | Number of Standard Accts | Number of Backdoor Admin Accts | Total Accts |
      | --- | ------------- | ------------- | --------------------- | ------------------------ | ------------------------------ | ----------- |
      | `1` | `xxxx`        | `xxxx`        | `2`                   | `10`                     | `2`                            | `14`        |

## Brainstorm

Let's take a step back to determine what data are needed to generate all the CSVs:
   - Get all computer records by ID on the given server
   - Figure out who the backdoor admin accounts are

Looks like first step is to generate CSV #2 defined above in the `End result` section.

Next we'll tackle CSV #1: Local User Account Report
   - Pseudocode:
      - Create `rows` array to store each row as a string
      - Create your header row (a comma-separated string):
         ```
         rows.push('ID (aka JamfID),Serial Number,Computer Name,Account Name,Local User is FileVault Enabled,Local User is Admin')
         ```
      - For each computer (aka `jamfId`) in the provided JSON:
         - Get `serialNumber`, found at `computer.general.serial_number`
         - Get `computerName`, found at `computer.general.name`
         - Go to current computer's `local_accounts` array and for each account (local user)
            - Get `accountName`, this will be the current account we're looking at in the `local_accounts` array
            - Get `fileVaultIsEnabled`, found at `filevault_enabled`
            - Get `isAdmin`, found at `administrator`
            - Get `isBackdoorAdmin`, found by checking to see if `accountName` exists anywhere inside the provided array `backdoorAdminAccts`
            - Now you have all the data, so create this account's row:
               ```
               rows.push(`${jamfId},${serialNumber},${computerName},${accountName},${fileVaultIsEnabled},${isAdmin}`)
               ```
      - Finally, return the result of `rows.join('\n')`

And lastly, the Computer Report
   - Welp... didn't even get to the brainstorming part, since all this took was a minor modification to the function used to generate Local User Account Report
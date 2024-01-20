# Accounts Audit

## Description
- The tool gathers data on local account statuses across all computers on a given server.
- It generates informative CSV reports detailing user account types (standard, admin, "backdoor admin"), FileVault status, account distributions, and their associations with specific computers.
- Its behavior is read-only and makes no alterations to any data.

## Permissions Required
- Read local account data on all computers.

## Keep in Mind
- As of 2024-01-09, this tool is strictly read-only and does not modify any data; it only draws inferences.
- The script's execution time is influenced by the number of computers on the server. For instance, running it on a server with 3,500 computers may take over 9 minutes. Additionally, performance may vary depending on hardware specifications, operating system, and internet quality.

## How to Run

### Prerequisites:
- Ensure you have [Node.js](https://nodejs.org/en) installed.

### Installation:
- Open your terminal and navigate to the program's main directory (directory should contain the file called `package.json`).

   ```bash
   npm install
   ```

### Configuration:
- For **production** (manual login credentials prompted on each run):

   1. Ensure these variables found inside `./helpers/prompts.mjs` are all set to `null`:

      ```javascript
      // set these to `null` in prod
      const testHostname = null;
      const testUsername = null;
      const testPassword = null;
      ```

   2. Then run:

      ```bash
      node ./index.mjs
      ```

- For **testing** or **development** (automates login process using predefined credentials in plaintext):

   1. Edit `./helpers/prompts.mjs` with your desired login credentials. Example:

      ```javascript
      // set these to `null` in prod
      const testHostname = "rocketman.jamfcloud.com";
      const testUsername = "myUsername";
      const testPassword = "myPassword";
      ```

   2. Then run with the `--test` flag:

      ```bash
      node ./index.mjs --test
      ```

### Follow the prompts in the terminal.

## Output

### Location:
- The output is stored in the `/data` subdirectory under the current working directory.

### Structure:
- The tool creates `/data/1` the first time it's run under the current working directory, storing output files in `/1`.
- Subsequent runs create new directories (`/2`, `/3`, etc.) inside `/data` to store subsequent outputs.

### Content:
- All data gathered, modified, and created are placed into the `/data` directory.
- The "meat" of this tool are the three `.csv` files found inside `/data`:

   1. `backdoorAdminAccountReport.csv`:
      - A list of all "backdoor admin" accounts and the number of computers each is found on.

   2. `localUserAccountReport.csv`:
      - A list of all users across all computers, listing details for the computer each user belongs to (ID, serial number, computer name), user's account name, and their admin/backdoor-admin/FileVault status.

   3. `computerReport.csv`:
      - A list of all computers and their corresponding counts of different account types (e.g. standard, admin, backdoor admin).

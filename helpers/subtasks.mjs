import * as prompts from './prompts.mjs'; 
import * as apis from './apis.mjs'; 
import * as flags from './flags.mjs';
import pLimit from 'p-limit';

export async function getCredentials() {
   try {
      // Get flags provided upon function execution (e.g. `--test`)
      const flagsArray = flags.getFlags(process.argv);
      const isTestRun = 'test' in flagsArray;

      const credentials = {};

      const userInput = await prompts.getUserInput(isTestRun);
      Object.assign(credentials, userInput);

      credentials.token = await apis.generateAuthToken(credentials.hostname, credentials.username, credentials.password);
      
      const additonalUserInput = await prompts.getAdditionalUserInput(credentials, isTestRun);
      Object.assign(credentials, additonalUserInput);

      return credentials;
   } catch (error) {
      console.error('Error:', error.message);
   }
}

export function pullAllJamfIds (data) {
   return data.computers.map((computer) => computer.id);
}

// This will probably only be used for testing
export function pullNFirstJamfIds(data, maxNumOfItems) {
   return cutArray(pullAllJamfIds(data), maxNumOfItems);
}

export function cutArray(data, maxNumOfItems) {
   if (!Array.isArray(data) || !Number.isInteger(maxNumOfItems) || maxNumOfItems < 1) {
      console.error("Invalid input. Please provide an array and a positive integer.");
      return;
   }

   if (data.length > maxNumOfItems) {
      return data.slice(0, maxNumOfItems);
   } else {
      return data;
   }
}

export function keepOnlyTheseComputerRecords(computersById, propsToKeep) {
   // Create a deep copy of the computersById object to avoid modifying the original object
   let copiedComputersById = JSON.parse(JSON.stringify(computersById));

   for (const id in copiedComputersById) {
      for (const record in copiedComputersById[id].computer) {
         if (!propsToKeep.includes(record)) {
            delete copiedComputersById[id].computer[record];
         }
      }
   }

   return copiedComputersById;
}

// Bring together data of interest into a single, simple object for easy parsing.
export function createLdapUsernameTrackersObject(recordsById) {
   const obj = {}

   for (const record in recordsById) {
      const distilledResult = {
         username: recordsById[record].computer.location.username,
         email: recordsById[record].computer.location.email_address,
         validatedLdapUsername: null,
      }

      obj[record] = distilledResult;
   }

   return obj;
}

export async function testOriginalUsernamesAgainstLdap(ldapUsernamesById, creds) {
   const limit = pLimit(4); // above 4 causes false failures
   const {
      ldapServerDomainName,
      ldapServerId,
      token
   } = creds;

   let totalUsernamesToTest = Object.keys(ldapUsernamesById).length;
   let apiCallCount = 1;

   const lookupPromises = [];

   for (let key of Object.keys(ldapUsernamesById)) {
      let username = ldapUsernamesById[key].username;

      // If the username is not empty, call the lookup function with the parameters
      if (username) {

         // Use the limit function to wrap the lookup logic
         lookupPromises.push(limit(async () => {
            const result = await apis.lookupUsernameInLdapServer(ldapServerDomainName, ldapServerId, username, token);

            console.log(`Request ${apiCallCount++}/${totalUsernamesToTest}: lookup "${username}" on ldap for id ${key}`);

            // If the result is valid, update the validatedLdapUsername value of the current key with the username
            if (result && result.ldap_users && result.ldap_users.length > 0) {
               ldapUsernamesById[key].validatedLdapUsername = username;
               ldapUsernamesById[key].response_testOriginalUsernamesAgainstLdap = result;
            }
         }));
      } else {
         totalUsernamesToTest--;
      }
   }

   // Resolve all promises
   await Promise.all(lookupPromises);

   return ldapUsernamesById;
}

export async function testOriginalUsernamesWithClientDomainAppendedAgainstLdap(ldapUsernamesById, creds) {
   const limit = pLimit(4); // above 4 causes false failures
   const {
      ldapServerDomainName,
      ldapServerId,
      token
   } = creds;

   let totalUsernamesToTest = Object.keys(ldapUsernamesById).length;
   let apiCallCount = 1;

   const lookupPromises = [];

   for (let key of Object.keys(ldapUsernamesById)) {
      let username = `${ldapUsernamesById[key].username}${creds.domainToAppend}`;

      // If the username is not empty, call the lookup function with the parameters
      if (ldapUsernamesById[key].validatedLdapUsername === null) {

         // Use the limit function to wrap the lookup logic
         lookupPromises.push(limit(async () => {
            const result = await apis.lookupUsernameInLdapServer(ldapServerDomainName, ldapServerId, username, token);

            console.log(`Request ${apiCallCount++}/${totalUsernamesToTest}: lookup "${username}" on ldap for id ${key}`);

            // If the result is valid, update the validatedLdapUsername value of the current key with the username
            if (result && result.ldap_users && result.ldap_users.length > 0) {
               ldapUsernamesById[key].validatedLdapUsername = username;
               ldapUsernamesById[key].response_testOriginalUsernamesWithClientDomainAppendedAgainstLdap = result;
            }
         }));
      } else {
         totalUsernamesToTest--;
      }
   }

   // Resolve all promises
   await Promise.all(lookupPromises);

   return ldapUsernamesById;
}

export async function testOriginalEmailAddressesAgainstLdap(ldapUsernamesById, creds) {
   const limit = pLimit(4); // above 4 causes false failures
   const {
      ldapServerDomainName,
      ldapServerId,
      token
   } = creds;

   let totalUsernamesToTest = Object.keys(ldapUsernamesById).length;
   let apiCallCount = 1;

   const lookupPromises = [];

   for (let key of Object.keys(ldapUsernamesById)) {
      let email = ldapUsernamesById[key].email;

      // If the username is not empty, call the lookup function with the parameters
      if (ldapUsernamesById[key].validatedLdapUsername === null && email !== '') {

         // Use the limit function to wrap the lookup logic
         lookupPromises.push(limit(async () => {
            const result = await apis.lookupUsernameInLdapServer(ldapServerDomainName, ldapServerId, email, token);

            console.log(`Request ${apiCallCount++}/${totalUsernamesToTest}: lookup "${email}" on ldap for id ${key}`);

            // If the result is valid, update the validatedLdapUsername value of the current key with the username
            if (result && result.ldap_users && result.ldap_users.length > 0) {
               ldapUsernamesById[key].validatedLdapUsername = email;
               ldapUsernamesById[key].response_testOriginalEmailAddressesAgainstLdap = result;
            }
         }));
      } else {
         totalUsernamesToTest--;
      }
   }

   // Resolve all promises
   await Promise.all(lookupPromises);

   return ldapUsernamesById;
}

export function createBackdoorAdminAcctsList (obj) {
   const minReoccurences = 5;
   const minUid = 500;
   let localAcctReoccurencesTally = {};
   let adminAccounts = [];
   let allComputersById = Object.assign({}, obj); // Copy the object to keep changes strictly within local function scope

   // Filter based on UID, counting the number of reoccurences of accounts that pass through
   for (let key in allComputersById) {
      let localAccounts = allComputersById[key].computer.groups_accounts.local_accounts;

      for (let i = 0; i < localAccounts.length; i++) {
         if (localAccounts[i].uid <= minUid) {
            localAccounts.splice(i, 1);
            i--; // Adjust the index after deletion
         } else {
            let name = localAccounts[i].name;
            if (localAcctReoccurencesTally[name]) {
               localAcctReoccurencesTally[name]++;
            } else {
               localAcctReoccurencesTally[name] = 1;
            }
         }
      }
   }

   // Filter in only accounts greater than or equal to a pre-defined number of reoccurences
   for (let name in localAcctReoccurencesTally) {
      if (localAcctReoccurencesTally[name] >= minReoccurences && !adminAccounts.includes(name)) {
         adminAccounts.push(name);
      }
   }

   // Return the adminAccounts array
   return adminAccounts;

}

export function errorOutComputersWithMoreThanOneAccount(ldapUsernamesById, allComputersById, backdoorAdminAccts) {
   // Make and use a copy of these parameters so as to ensure we do not affect anything beyond this function's scope
   let ldapUsernamesByIdCopy = Object.assign({}, ldapUsernamesById);
   let allComputersByIdCopy = Object.assign({}, allComputersById);
   let backdoorAdminAcctsCopy = [...backdoorAdminAccts];

   // For each computer record (each key in allComputersByIdCopy)
   for (let key in allComputersByIdCopy) {

      // Only for `null` values (aka, computers still pending valid ldap username)
      if (ldapUsernamesByIdCopy[key].validatedLdapUsername === null) {
         let localAccounts = allComputersByIdCopy[key].computer.groups_accounts.local_accounts;

         // Remove all backdoor admin accounts
         for (let account of localAccounts) {
            if (backdoorAdminAcctsCopy.includes(account.name)) {
               const index = localAccounts.indexOf(account);
               localAccounts.splice(index, 1);
            }
         }

         if (localAccounts.length !== 1) {
            ldapUsernamesByIdCopy[key].validatedLdapUsername = "ERROR";
         }
      }
   }

   return {
      ldapUsernamesByIdCopy,
      allComputersByIdCopy
   };
}

export function addLocalAcctDataToLdapUsernameTrackersObject(allComputersById, ldapUsernamesById) {
   for (const record in allComputersById) {
      if (ldapUsernamesById[record].validatedLdapUsername === null) {
         let theLastRemainingLocalAccount = allComputersById[record].computer.groups_accounts.local_accounts[0];
         const distilledResult = {
            local_account_username: theLastRemainingLocalAccount.name,
            local_account_full_name: theLastRemainingLocalAccount.realname,
         }

         Object.assign(ldapUsernamesById[record], distilledResult);
      }
   }

   return ldapUsernamesById;
}

export function generateLdapUsernamesFromLocalAcctUsername(ldapUsernamesById, creds) {
   const {
      domainToAppend
   } = creds;

   for (let key in ldapUsernamesById) {
      if (ldapUsernamesById[key].validatedLdapUsername === null) {
         // create an empty array for possibleLdapUsernames if it doesn't exist
         if (!ldapUsernamesById[key].possibleLdapUsernames) {
            ldapUsernamesById[key].possibleLdapUsernames = [];
         }
         let localUsername = ldapUsernamesById[key].local_account_username;

         // create variations of strings using the local_account_username and push them to the possibleLdapUsernames array
         ldapUsernamesById[key].possibleLdapUsernames.push(localUsername, localUsername + domainToAppend);
      }
   }
   return ldapUsernamesById;
}

export function generateLdapUsernamesFromLocalAcctFullName(ldapUsernamesById, creds) {
   const {
      domainToAppend
   } = creds;

   for (let key in ldapUsernamesById) {
      if (ldapUsernamesById[key].validatedLdapUsername === null) {
         // create an empty array for possibleLdapUsernames if it doesn't exist
         if (!ldapUsernamesById[key].possibleLdapUsernames) {
            ldapUsernamesById[key].possibleLdapUsernames = [];
         }
         let fullName = ldapUsernamesById[key].local_account_full_name;

         // split the full name into first name and last name if it contains a space
         let firstName, lastName;
         if (fullName.includes(" ")) {
            [firstName, lastName] = fullName.split(" ");
         } else {
            // otherwise, assign the whole name to firstName and an empty string to lastName
            firstName = fullName;
            lastName = "";
         }

         // get the first initial and the last initial
         let firstInitial = firstName[0];
         let lastInitial = lastName[0];

         // create variations of strings using the local_account_full_name and push them to the possibleLdapUsernames array
         ldapUsernamesById[key].possibleLdapUsernames.push(
            `${firstName}`,
            `${firstName}${domainToAppend}`
         );
         if (lastName !== "") {
            ldapUsernamesById[key].possibleLdapUsernames.push(
               `${firstName}.${lastName}`,
               `${firstName}.${lastName}${domainToAppend}`,
               `${firstName}${lastName}`,
               `${firstName}${lastName}${domainToAppend}`,
               `${firstInitial}.${lastName}`,
               `${firstInitial}.${lastName}${domainToAppend}`,
               `${firstInitial}${lastName}`,
               `${firstInitial}${lastName}${domainToAppend}`,
               `${firstName}.${lastInitial}`,
               `${firstName}.${lastInitial}${domainToAppend}`,
               `${firstName}${lastInitial}`,
               `${firstName}${lastInitial}${domainToAppend}`,
               `${lastName}`,
               `${lastName}${domainToAppend}`
            );
         }
      }
   }
   return ldapUsernamesById;
}

export async function testAllGeneratedUsernamesAgainstLdap(ldapUsernamesById, creds) {
   const limit = pLimit(4); // above 4 causes false failures
   const {
      ldapServerDomainName,
      ldapServerId,
      token,
   } = creds;

   let totalUsernamesToTest = 0;
   let apiCallCount = 1;
   const lookupPromises = [];

   for (let key in ldapUsernamesById) {
      if (ldapUsernamesById[key].validatedLdapUsername === null) {
         totalUsernamesToTest += ldapUsernamesById[key].possibleLdapUsernames.length;
         
         for (let element of ldapUsernamesById[key].possibleLdapUsernames) {
            // push a limit(async () => {}) to the lookupPromises array
            lookupPromises.push(
               limit(async () => {
                  // call the apis.lookupUsernameInLdapServer api with the element and the token
                  const result = await apis.lookupUsernameInLdapServer(
                     ldapServerDomainName,
                     ldapServerId,
                     element,
                     token
                  );
                  // log the request details
                  console.log(
                     `Request ${apiCallCount++}/${totalUsernamesToTest}: lookup "${element}" on ldap for id ${key}`
                  );
                  // as soon as you encounter a valid result, update the validatedLdapUsername value of the current key with the username (the current element)
                  if (result && result.ldap_users && result.ldap_users.length > 0) {
                     ldapUsernamesById[key].validatedLdapUsername = element;
                     ldapUsernamesById[key].response_testAllGeneratedUsernamesAgainstLdap = result;
                  }
               })
            );
         }
      }
   }

   // resolve all promises
   await Promise.all(lookupPromises);

   // return ldapUsernamesById
   return ldapUsernamesById;
}

export function flipNullToError(ldapUsernamesById) {
   for (let key in ldapUsernamesById) {
      if (ldapUsernamesById[key].validatedLdapUsername === null) {
         ldapUsernamesById[key].validatedLdapUsername = "ERROR";
      }
   }

   return ldapUsernamesById
}

// Creates an array of strings, with each string being a row in the CSV file
export function generateOverallCsvReport(ldapUsernamesById) {
   let rows = [];

   // Add a header row with the column names
   rows.push('jamfId,validatedLdapUsername,originalUsername,originalEmail');

   for (let jamfId in ldapUsernamesById) {
      let validatedLdapUsername = ldapUsernamesById[jamfId].validatedLdapUsername;
      let username = ldapUsernamesById[jamfId].username;
      let email = ldapUsernamesById[jamfId].email;
      rows.push(jamfId + ',' + validatedLdapUsername + ',' + username + ',' + email);
   }

   let csvContent = rows.join('\n');

   return csvContent;
}

export function findPendingChangesInLdapUsernamesById(original_ldapUsernamesById, final_ldapUsernamesById) {
   const pendingChanges = {};

   for (let jamfId in final_ldapUsernamesById) {
      const final_validatedLdapUsername = final_ldapUsernamesById[jamfId].validatedLdapUsername;
      const original_validatedLdapUsername = original_ldapUsernamesById[jamfId].validatedLdapUsername;

      if (final_validatedLdapUsername === "ERROR" || final_validatedLdapUsername === original_validatedLdapUsername) {
         // skip it
      } else {
         pendingChanges[jamfId] = final_ldapUsernamesById[jamfId];
      }
   }

   return pendingChanges;
}

export function createPayloadToUpdateUsernames (preparedUsernames) {
   const payload = {};

   for (const key in preparedUsernames) {
      const username = preparedUsernames[key].validatedLdapUsername;

      payload[key] = {
         computer: {
            location: {
               username: username,
            }
         }
      }
   }

   return payload;
}

export function objectToXml (obj) {
   let xml = '';

   for (const prop in obj) {
      if (obj.hasOwnProperty(prop)) {
         xml += `<${prop}>`;

         if (typeof obj[prop] === 'object') {
            xml += objectToXml(obj[prop]);
         } else {
            xml += obj[prop];
         }

         xml += `</${prop}>`;
      }
   }

   return xml;
}

// Just like what we did with the `generateOverallCsvReport` function, we're creating
// each individual row in the CSV file (as a string). Each "row" (aka string) is
// pushed onto an array. We then take that array and join each element using the `\n`
// character to create a single, giant string, which is our CSV in its final form.
export function generateBackdoorAdminAccountReport(backdoorAdminAccts, allComputersById) {
   const rows = [];
   let numComputersWithThisAccount = 0;

   rows.push(`Backdoor Admin Account,Number of Computers`);

   backdoorAdminAccts.forEach(adminAccount => {

      numComputersWithThisAccount = 0;

      for (const computerId in allComputersById) {
         const computer = allComputersById[computerId];
         const localAccounts = computer.computer.groups_accounts.local_accounts;

         localAccounts.forEach(account => {
            if (account.name === adminAccount) {
               numComputersWithThisAccount++;
            }
         });
      }

      rows.push(`${adminAccount},${numComputersWithThisAccount}`);
   });

   let csvContent = rows.join('\n');

   return csvContent;
}

export function generateLocalUserAccountReport(backdoorAdminAccts, allComputersById) {
   let rows = [];

   // Create your header row (a comma-separated string)
   rows.push('ID (aka JamfID),Serial Number,Computer Name,Account Name,Local User is FileVault Enabled,Local User is Admin,Local User is Backdoor Admin');
   
   for (const jamfId in allComputersById) {
      const computer = allComputersById[jamfId].computer;

      let serialNumber = computer.general.serial_number;
      let computerName = computer.general.name;
      let localAccounts = computer.groups_accounts.local_accounts;

      for (let account of localAccounts) {
         let accountName = account.name;
         let fileVaultIsEnabled = account.filevault_enabled;
         let isAdmin = account.administrator;
         let isBackdoorAdmin = backdoorAdminAccts.includes(accountName);

         rows.push(`${jamfId},${serialNumber},${computerName},${accountName},${fileVaultIsEnabled},${isAdmin},${isBackdoorAdmin}`);
      }
   }

   let csvContent = rows.join('\n');

   return csvContent;
}

export function generateComputerReport(backdoorAdminAccts, allComputersById) {
   let rows = [];

   // Create your header row (a comma-separated string)
   rows.push('ID,Serial Number,Computer Name,Number of Admin Accts,Number of Standard Accts,Number of Backdoor Admin Accts,Total Accts');

   for (const jamfId in allComputersById) {
      const computer = allComputersById[jamfId].computer;

      let serialNumber = computer.general.serial_number;
      let computerName = computer.general.name;
      let localAccounts = computer.groups_accounts.local_accounts;
      let numAdminAccts = 0;
      let numStandardAccts = 0;
      let numBackdoorAdminAccts = 0;
      let numTotalAccts = 0;

      for (let account of localAccounts) {
         let accountName = account.name;
         let isAdmin = account.administrator;
         let isBackdoorAdmin = backdoorAdminAccts.includes(accountName);

         if (isBackdoorAdmin) {
            numBackdoorAdminAccts++;
         } else if (isAdmin) {
            numAdminAccts++;
         } else {
            numStandardAccts++;
         }
      }

      numTotalAccts =
         numAdminAccts +
         numStandardAccts +
         numBackdoorAdminAccts;

      rows.push(`${jamfId},${serialNumber},${computerName},${numAdminAccts},${numStandardAccts},${numBackdoorAdminAccts},${numTotalAccts}`);
   }

   let csvContent = rows.join('\n');

   return csvContent;
}
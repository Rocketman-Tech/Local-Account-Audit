import readlineSync from 'readline-sync';

const prompt = (question, hideEchoBack = false) => {
   return readlineSync.question(question, { hideEchoBack });
};

export async function getUserInput(isTestRun = false) {
   const userInput = {};

   // set these to `null` in prod
   const testHostname = null;
   const testUsername = null;
   const testPassword = null;

   // notify user if above variables not set to `null`, so as to not risk leaking credentials
   if (
      testHostname !== null ||
      testUsername !== null ||
      testPassword !== null
   ) {
      userInput.plainTextCredentialsWarning = true;
   }

   if (isTestRun) {
      userInput.hostname = testHostname;
      userInput.username = testUsername;
      userInput.password = testPassword;
   } else {
      try {
         userInput.hostname = prompt('Enter hostname (e.g. `rocketman.jamfcloud.com`): ');
         userInput.username = prompt('Enter username: ');
         userInput.password = prompt('Enter password: ', true);
      } catch (error) {
         console.error(error);
      }
   }

   return userInput;
};

export async function getAdditionalUserInput(creds, isTestRun = false) {
   const userInput = {};
   const defaultDomainToAppend = null;
   const defaultLdapServerDomainName = creds.hostname;
   const defaultLdapServerId = 1;

   if (isTestRun) {
      userInput.domainToAppend = defaultDomainToAppend;
      userInput.ldapServerDomainName = defaultLdapServerDomainName;
      userInput.ldapServerId = defaultLdapServerId;
   } else {
      try {
         // userInput.domainToAppend = prompt(`Enter domain to append to username for LDAP directory lookup testing: `);
         userInput.ldapServerDomainName = defaultLdapServerDomainName;
         // userInput.ldapServerId = prompt(`Enter LDAP server id for ${userInput.ldapServerDomainName} (ENTER for default: ${defaultLdapServerId}): `) || defaultLdapServerId;
      } catch (error) {
         console.error(error);
      }
   }

   return userInput;
}
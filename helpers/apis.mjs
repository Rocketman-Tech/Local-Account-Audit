import pLimit from 'p-limit';
import fetch from 'node-fetch';
import * as subtasks from './subtasks.mjs'; 
// import res from 'express/lib/response';

export async function generateAuthToken(hostname, username, password) {
   const url = `https://${hostname}/api/v1/auth/token`;

   const options = {
      method: 'POST',
      headers: {
         'Accept': 'application/json',
         'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      }
   };

   try {
      const response = await fetch(url, options);

      // Check if the response is OK (status code 200)
      if (response.ok) {
         const data = await response.json();
         console.log("Complete: `generateAuthToken` API call");
         return data.token;
      } else {
         throw new Error(`${response.status}: ${response.statusText}`);
      }
   } catch (error) {
      console.error(error);
   }
}

export async function findAllComputers(hostname, token) {
   const url = `https://${hostname}/JSSResource/computers`;

   const options = {
      method: 'GET',
      headers: {
         'Accept': 'application/json',
         'Authorization': `Bearer ${token}`,
      },
   };

   try {
      const response = await fetch(url, options);

      if (response.ok) {
         const data = await response.json();
         console.log("Complete: `findAllComputers` API call");
         return data;
      } else {
         throw new Error(`${response.status}: ${response.statusText}`);
      }
   } catch (error) {
      console.error(error);
   }
}

export async function findAllComputersById(hostname, token, ids) {
   const results = {};
   const limit = pLimit(5);

   let i = 1;

   await Promise.all(ids.map(async (id) => {
      const options = {
         method: 'GET',
         headers: {
            accept: 'application/json',
            'Authorization': `Bearer ${token}`,
         },
      };

      const url = `https://${hostname}/JSSResource/computers/id/${id}`;

      try {
         const startTime = Date.now();

         const response = await limit(() => fetch(url, options));
         const computerData = await response.json();

         results[id] = computerData;
         console.log(`Request ${i++}/${ids.length}: Total time ${Date.now() - startTime}ms: ID ${id} stored`);
      } catch (error) {
         console.error(`ERROR: 'findAllComputersById' failed for ID ${id}`);
         throw error;
      }
   }));

   console.log("Complete: `findAllComputersById` API calls");

   return results;
}

export async function lookupUsernameInLdapServer(ldapServerDomainName, ldapServerId, username, token) {
   const url = `https://${ldapServerDomainName}/JSSResource/ldapservers/id/${ldapServerId}/user/${encodeURIComponent(username)}`;

   const options = {
      method: 'GET',
      headers: {
         'Accept': 'application/json',
         'Authorization': `Bearer ${token}`,
      },
   };

   try {
      const response = await fetch(url, options);

      if (response.ok) {
         const computerData = await response.json();
         computerData.usernameUsedForLookup = username;
         computerData.urlUsedForLookup = url;
         return computerData;
      } else {
         throw new Error(`${response.status}: ${response.statusText}`);
      }
   } catch (error) {
      console.error(`Error fetching ldap data for "${username}":`, error);
   }
}

export async function updateComputerRecord (hostname, token, payload) {
   const limit = pLimit(4);
   const ids = Object.keys(payload).map(Number);

   let i = 1;

   const responseStatusCodes = {};

   await Promise.all(ids.map(async (id) => {
      const payloadItem = subtasks.objectToXml(payload[id.toString()]);

      const options = {
         method: 'PUT',
         headers: {
            'Content-Type': 'text/xml',
            'Authorization': `Bearer ${token}`,
         },
         body: payloadItem,
      };

      const url = `https://${hostname}/JSSResource/computers/id/${id}`;

      try {
         const startTime = Date.now();

         const response = await limit(() => fetch(url, options));
         const statusCode = await response.status;

         responseStatusCodes[id] = statusCode;

         console.log(`Request ${i++}/${ids.length}: Total time ${Date.now() - startTime}ms: Username record for ID ${id} updated with response status code ${statusCode}`);
      } catch (error) {
         console.error(`ERROR: 'updateComputerRecord' on ID ${id} failed`);
         throw error;
      }
   }));

   return responseStatusCodes;
}
import * as data from './data.mjs'; 
import * as apis from './apis.mjs'; 
import * as subtasks from './subtasks.mjs';

export async function runMainLogicFlow(creds) {

   // 
   // Gather all data
   // 

   const allComputers = await apis.findAllComputers(creds.hostname, creds.token);
   await data.saveData('allComputers.json', allComputers);

   const allJamfIds = subtasks.pullAllJamfIds(allComputers);
   await data.saveData('allJamfIds.json', allJamfIds);

   let allComputersById = await apis.findAllComputersById(creds.hostname, creds.token, allJamfIds);
   await data.saveData('allComputersById.json', allComputersById);

   const backdoorAdminAccts = subtasks.createBackdoorAdminAcctsList(allComputersById);
   await data.saveData('backdoorAdminAccts.json', backdoorAdminAccts);

   const allComputersByIdDebloated = subtasks.keepOnlyTheseComputerRecords(allComputersById, ["location", "groups_accounts"]);
   await data.saveData('allComputersByIdDebloated.json', allComputersByIdDebloated);

   // 
   // Generate reports
   // 

   const backdoorAdminAccountReport = subtasks.generateBackdoorAdminAccountReport(backdoorAdminAccts, allComputersById);
   await data.saveData('backdoorAdminAccountReport.csv', backdoorAdminAccountReport, false);

   const localUserAccountReport = subtasks.generateLocalUserAccountReport(backdoorAdminAccts, allComputersById);
   await data.saveData('localUserAccountReport.csv', localUserAccountReport, false);

   const computerReport = subtasks.generateComputerReport(backdoorAdminAccts, allComputersById);
   await data.saveData('computerReport.csv', computerReport, false);

   // 
   // Re-iterate any possible warnings
   // 

   if(creds.plainTextCredentialsWarning) {
      console.log("WARNING: creds stored as plain text inside file `prompts.mjs`. Remove before running in prod!");
      console.log("WARNING: creds stored as plain text inside file `prompts.mjs`. Remove before running in prod!");
      console.log("WARNING: creds stored as plain text inside file `prompts.mjs`. Remove before running in prod!");
   }
}
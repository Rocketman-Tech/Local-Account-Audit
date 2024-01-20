import * as subtasks from './helpers/subtasks.mjs'; 
import * as timer from './helpers/timer.mjs';
import * as main_logic_flow from './helpers/main_logic_flow.mjs';

(async function main() {
   const creds = await subtasks.getCredentials();
   const mainLogicTimer = new timer.Timer();

   mainLogicTimer.start();
   await main_logic_flow.runMainLogicFlow(creds);
   mainLogicTimer.stop();
})();
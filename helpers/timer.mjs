// timer.mjs
// A module that exports a Timer class for measuring time elapsed

// A helper function that converts milliseconds to a human-readable format
function formatTime(ms) {
   let seconds = Math.floor(ms / 1000);
   let minutes = Math.floor(seconds / 60);
   let hours = Math.floor(minutes / 60);
   let days = Math.floor(hours / 24);
   let result = "";
   if (days > 0) {
      result += `${days}d `;
   }
   if (hours > 0) {
      result += `${hours % 24}h `;
   }
   if (minutes > 0) {
      result += `${minutes % 60}m `;
   }
   if (seconds > 0) {
      result += `${seconds % 60}s `;
   }
   if (ms > 0) {
      result += `${ms % 1000}ms`;
   }
   return result;
}

// A class that represents a timer object
export class Timer {
   constructor() {
      this.startTime = null;
      this.endTime = null;
      this.elapsedTime = null;
   }

   // A method that starts the timer
   start() {
      this.startTime = Date.now();
      this.endTime = null;
      this.elapsedTime = null;
   }

   // A method that stops the timer and calculates the elapsed time
   stop() {
      this.endTime = Date.now();
      this.elapsedTime = this.endTime - this.startTime;
      console.log(`Time elapsed: ${formatTime(this.elapsedTime)}`);
   }
}

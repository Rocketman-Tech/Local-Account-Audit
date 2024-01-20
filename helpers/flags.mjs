export function getFlags(argv) {
   const flags = {};

   argv.forEach((arg, index) => {
      if (arg.startsWith("--")) {
         const [key, value] = arg.slice(2).split("=");
         flags[key] = value;
      }
   });

   return flags;
}
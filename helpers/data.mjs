import fs from 'fs';

const folder = './data/';
let folderNumber = 0; // initialize the folder number
let newFolder = folder; // initialize the new folder name
let fileCounter = 1; // initialize the file counter

// create the data folder if it does not exist
if (!fs.existsSync(folder)) {
   fs.mkdirSync(folder);
}

// check if the numbered folder already exists
while (fs.existsSync(newFolder)) {
   // increment the folder number
   folderNumber++;
   // append the folder number to the data folder name
   newFolder = folder + folderNumber + '/';
}

// create the numbered folder
fs.mkdirSync(newFolder);

function mergeObjects(obj1, obj2) {
   return Object.assign({}, obj1, obj2);
}

export async function saveData(filename, value, isJson = true) {
   let data = isJson ? JSON.stringify(value, null, 2) : value;

   // Construct the new filename with the file counter
   let newFilename = `${fileCounter}_${filename}`;
   fileCounter++;

   try {
      fs.accessSync(newFolder + newFilename); // check if the file exists
      console.error("The file " + newFolder + newFilename + " already exists");
   } catch (err) {
      // file does not exist, write the data
      try {
         fs.writeFileSync(newFolder + newFilename, data); // write the data synchronously
         console.log("Data saved to " + newFolder + newFilename);
      } catch (err) {
         console.error(err);
      }
   }
}

export async function updateData(filename, value) {
   let data = JSON.stringify(value, null, 2);

   // Check if the file exists
   if (fs.existsSync(newFolder + filename)) {
      try {
         let oldData = fs.readFileSync(newFolder + filename); // read the old data synchronously
         let newData = mergeObjects(JSON.parse(oldData), JSON.parse(data));
         fs.writeFileSync(newFolder + filename, JSON.stringify(newData, null, 2)); // write the new data synchronously
         console.log("Data updated in " + newFolder + filename);
      } catch (err) {
         console.error(err);
      }
   } else {
      console.error("The file " + newFolder + filename + " does not exist");
   }
}

export async function loadData(filename) {
   return new Promise((resolve, reject) => {
      const files = fs.readdirSync(newFolder);
      const matchingFile = files.find(file => file.endsWith(filename));

      if (matchingFile) {
         try {
            const data = fs.readFileSync(newFolder + matchingFile); // read the data synchronously
            resolve(JSON.parse(data));
         } catch (err) {
            reject(err);
         }
      } else {
         reject(new Error(`File ${filename} not found in ${newFolder}`));
      }
   });
}
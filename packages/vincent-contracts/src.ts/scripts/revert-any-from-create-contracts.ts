import * as fs from "fs";

// File path constants
const TARGET_FILE = 
  './packages/vincent-contracts/src.ts/networks/vDatil/shared/VincentChainClient/apis/utils/createVincentContracts.ts'


// Main function to modify the file
async function revertAnyFromCreateContracts() {
  try {
    // Read the file content
    const content = await fs.promises.readFile(TARGET_FILE, 'utf8');
    
    // Find the line with the ts-expect-error comment
    const lines = content.split('\n');
    const targetLineIndex = lines.findIndex(line => 
      line.includes('// ts-expect-error TS7056')
    );

    if (targetLineIndex === -1) {
      console.error('❌ Target line not found in file');
      process.exit(1);
    }

    // Replace the function declaration line with the new type casting
    lines[targetLineIndex] = ') => { // ts-expect-error TS7056';

    // Write the modified content back to the file
    await fs.promises.writeFile(TARGET_FILE, lines.join('\n'), 'utf8');
    
    // console.log('✅ Successfully modified createVincentContracts.ts');
  } catch (error) {
    // console.error('❌ Error modifying file:', error);
    // process.exit(1);
  }
}

// Execute the script
revertAnyFromCreateContracts();

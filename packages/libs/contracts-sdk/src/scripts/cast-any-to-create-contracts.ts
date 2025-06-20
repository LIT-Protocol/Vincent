import * as fs from 'fs';
// File path constants
const TARGET_FILE =
  './packages/lib/contracts-sdk/src/networks/vDatil/shared/VincentChainClient/ContractDataManager.ts';

// Main function to modify the file
async function castAnyToCreateContracts() {
  try {
    // Read the file content
    const content = await fs.promises.readFile(TARGET_FILE, 'utf8');

    // Find the line with the ts-expect-error comment
    const lines = content.split('\n');
    const targetLineIndex = lines.findIndex((line) => line.includes('// ts-expect-error TS7056'));

    if (targetLineIndex === -1) {
      console.error('❌ Target line not found in file');
      process.exit(1);
    }

    // Store the original line for backup
    const originalLine = lines[targetLineIndex];
    console.log('originalLine:', originalLine);

    // Replace the function declaration line with the new type casting
    lines[targetLineIndex] = ') : any => { // ts-expect-error TS7056 (post-build hacky fix)';

    // Write the modified content back to the file
    await fs.promises.writeFile(TARGET_FILE, lines.join('\n'), 'utf8');

    // console.log('✅ Successfully modified createVincentContracts.ts');
  } catch (error) {
    // console.error('❌ Error modifying file:', error);
    // process.exit(1);
  }
}

// Execute the script
castAnyToCreateContracts();

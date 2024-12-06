import { getInstalledLanguages, getDefaultLanguage } from 'applescript-node';

async function main() {
  // Get all installed OSA languages
  const languages = await getInstalledLanguages();

  console.log('Installed OSA Languages:');
  console.log('=======================');

  for (const lang of languages) {
    console.log(`\nName: ${lang.name}`);
    console.log(`Manufacturer: ${lang.manufacturer}`);
    console.log(`Description: ${lang.description}`);
    console.log('\nCapabilities:');
    console.log('  - Compiling:', lang.capabilities.compiling ? '✅' : '❌');
    console.log('  - Source Data:', lang.capabilities.sourceData ? '✅' : '❌');
    console.log('  - Coercion:', lang.capabilities.coercion ? '✅' : '❌');
    console.log('  - Event Handling:', lang.capabilities.eventHandling ? '✅' : '❌');
    console.log('  - Recording:', lang.capabilities.recording ? '✅' : '❌');
    console.log('  - Convenience APIs:', lang.capabilities.convenience ? '✅' : '❌');
    console.log('  - Dialects:', lang.capabilities.dialects ? '✅' : '❌');
    console.log('  - Apple Events:', lang.capabilities.appleEvents ? '✅' : '❌');
  }

  // Get default language
  const defaultLang = await getDefaultLanguage();
  console.log('\nDefault Language:', defaultLang.name);
  console.log('Description:', defaultLang.description);
}

main().catch(console.error);

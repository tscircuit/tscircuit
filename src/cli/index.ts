import kicadPlugin from './kicad-loader';
import type { Plugin } from 'bun';
import type { PlatformConfig } from '../props';

/**
 * CLI utilities for tscircuit including custom loaders
 */
export interface CliConfig {
  loaders?: Plugin[];
  platformConfig?: PlatformConfig;
}

/**
 * Get Bun configuration with KiCad support
 * Usage: bun --config $(node -e "console.log(JSON.stringify(require('./src/cli').getBunConfig()))") your-app.ts
 */
export function getBunConfig(config: CliConfig = {}) {
  const loaders = [
    kicadPlugin,
    ...(config.loaders || []),
  ];

  return {
    loader: {
      '.kicad_mod': 'file', // Handled by kicadPlugin
    },
    plugins: loaders,
    // Note: Requires Bun types: npm i --save-dev @types/bun
  };
}

/**
 * Main CLI entry point
 * Usage: bun src/cli/index.ts [command] [args...]
 */
export async function runCli(args: string[]) {
  const command = args[0];
  
  switch (command) {
    case 'build':
      console.log('Building tscircuit project with KiCad .kicad_mod support...');
      console.log('Configure Bun with:');
      console.log('bun --config "$(node -e \\"console.log(JSON.stringify(require(\'./src/cli\').getBunConfig()))\\")" build.js');
      break;
      
    case 'dev':
      console.log('Starting development server with KiCad import support...');
      console.log('Run with: bun --loader ./src/cli/kicad-loader.ts --hot src/index.ts');
      break;
      
    case 'help':
      console.log('tscircuit CLI with KiCad Module Support');
      console.log('\nUsage: bun src/cli/index.ts [command]');
      console.log('\nCommands:');
      console.log('  build     Configure build with KiCad support');
      console.log('  dev       Start dev server with loaders');
      console.log('  help      Show this help');
      console.log('\nExample usage in components:');
      console.log('import kicadMod from "./footprints/resistor-0805.kicad_mod"');
      console.log('export default () => (<chip footprint={kicadMod} />)');
      break;
      
    default:
      console.log('tscircuit CLI v1.0 with KiCad .kicad_mod import support');
      console.log('Run "bun src/cli/index.ts help" for usage');
      console.log('\nSetup requirements:');
      console.log('1. Install Bun types: npm i --save-dev @types/bun');
      console.log('2. Use loader: bun --loader ./src/cli/kicad-loader.ts your-app.ts');
      console.log('3. Import KiCad files: import footprint from "./myfootprint.kicad_mod"');
  }
}

/**
 * Export CLI config for programmatic use
 */
export const cliConfig = {
  kicadSupport: true,
  version: '1.0.0',
  requiresBunTypes: true,
  usage: {
    loader: 'bun --loader ./src/cli/kicad-loader.ts',
    importExample: 'import kicadMod from "./footprint.kicad_mod"',
    componentUsage: '<chip footprint={kicadMod} />'
  }
};

import type { FootprintCircuitJson } from '../core';
import { loadKicadMod } from '../eval';

/**
 * Platform configuration with filetype handlers
 * Allows custom import handling for different file types
 */
export interface PlatformConfig {
  filetypeHandlers?: Record<string, (path: string) => Promise<any>>;
  // Other platform config options
}

/**
 * Default filetype handlers including KiCad .kicad_mod support
 */
export const defaultFiletypeHandlers: PlatformConfig['filetypeHandlers'] = {
  '.kicad_mod': async (filePath: string): Promise<FootprintCircuitJson> => {
    return await loadKicadMod(filePath);
  },
  // Add other handlers as needed (e.g., .step for 3D models, .json for direct circuit json)
};

/**
 * Resolve a file import based on platform config
 * @param filePath - Path to the file
 * @param platformConfig - Platform configuration with handlers
 * @returns Resolved import value (e.g., FootprintCircuitJson for .kicad_mod)
 */
export async function resolveFileImport(
  filePath: string,
  platformConfig?: PlatformConfig
): Promise<any> {
  const handlers = {
    ...defaultFiletypeHandlers,
    ...(platformConfig?.filetypeHandlers || {}),
  };

  const extension = filePath.split('.').pop()?.toLowerCase();
  if (extension && handlers[`.${extension}`]) {
    return await handlers[`.${extension}`](filePath);
  }

  // Default handling for other file types
  if (extension === 'json') {
    const file = Bun.file(filePath);
    const content = await file.text();
    return JSON.parse(content);
  }

  throw new Error(`Unsupported file type: ${extension}`);
}

/**
 * Register custom filetype handler
 */
export function registerFiletypeHandler(
  extension: string,
  handler: (path: string) => Promise<any>
): void {
  if (!defaultFiletypeHandlers[extension]) {
    (defaultFiletypeHandlers as Record<string, (path: string) => Promise<any>>)[extension] = handler;
  }
}

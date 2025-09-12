import type { FootprintCircuitJson, Pad, SilkscreenElement } from '../core';

/**
 * Simple S-expression parser for KiCad .kicad_mod files
 * Converts to FootprintCircuitJson
 * Note: This adds ~2-3KB to bundle size
 */
export async function parseKicadMod(filePath: string): Promise<FootprintCircuitJson> {
  const file = Bun.file(filePath);
  const content = await file.text();
  const tokens = tokenize(content);
  const ast = parse(tokens);
  return convertToFootprintCircuitJson(ast);
}

function tokenize(content: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < content.length) {
    const char = content[i];
    if (char === '(' || char === ')') {
      tokens.push(char);
      i++;
    } else if (char === '"') {
      // Handle quoted strings
      let str = '';
      i++;
      while (i < content.length && content[i] !== '"') {
        if (content[i] === '\\') {
          i++;
          if (i < content.length) {
            str += content[i];
            i++;
          }
        } else {
          str += content[i];
          i++;
        }
      }
      i++; // Skip closing quote
      tokens.push(`"${str}"`);
    } else if (!/\s/.test(char)) {
      // Handle atoms/numbers
      let atom = '';
      while (i < content.length && !/\s()/.test(content[i])) {
        atom += content[i];
        i++;
      }
      tokens.push(atom);
    } else {
      i++;
    }
  }
  return tokens;
}

function parse(tokens: string[], pos = 0): any {
  const result: any[] = [];
  while (pos < tokens.length) {
    const token = tokens[pos];
    if (token === '(') {
      const [subResult, newPos] = parse(tokens, pos + 1);
      result.push(subResult);
      pos = newPos;
      if (tokens[pos] === ')') {
        pos++;
      }
    } else if (token === ')') {
      return [result, pos];
    } else {
      result.push(token);
      pos++;
    }
  }
  return [result, pos];
}

function convertToFootprintCircuitJson(ast: any): FootprintCircuitJson {
  // KiCad .kicad_mod structure: (module name (version ...) (layer ...) (descr ...) (tags ...) 
  // (fp_text ...) (pad ...) (model ...) etc.
  
  const moduleNode = ast[0];
  if (!Array.isArray(moduleNode) || moduleNode[0] !== 'module') {
    throw new Error('Invalid KiCad module file');
  }

  const name = moduleNode[1];
  const elements = moduleNode.slice(2);
  
  const pads: Pad[] = [];
  const silkscreen: SilkscreenElement[] = [];
  
  for (const element of elements) {
    if (Array.isArray(element)) {
      const type = element[0];
      if (type === 'pad') {
        const pad = parsePad(element);
        pads.push(pad);
      } else if (type === 'fp_text' && element[1] === 'reference') {
        // Handle reference text for silkscreen
      } else if (type === 'fp_line' || type === 'fp_circle' || type === 'fp_arc') {
        const silkscreenElement = parseSilkscreenElement(element);
        silkscreen.push(silkscreenElement);
      }
      // Add more element types as needed (model, zone, etc.)
    }
  }
  
  return {
    type: 'footprint',
    id: name,
    pads,
    silkscreen,
    // Map other properties: layer, description, tags, etc.
  } as FootprintCircuitJson;
}

function parsePad(padNode: any): Pad {
  // (pad 1 smd rect (at 1.27 0) (size 1.27 1.27) (layers F.Cu) (net 1))
  const number = padNode[1];
  const type = padNode[2]; // smd, thru-hole, etc.
  const shape = (padNode[3] as string).toLowerCase() as any;
  const position = parseAt(padNode[4]);
  const size = parseSize(padNode[5]);
  const netIndex = padNode.findIndex((el: any) => Array.isArray(el) && el[0] === 'net');
  const net = netIndex > -1 ? parseNet(padNode, netIndex) : undefined;
  
  return {
    id: number,
    shape,
    size,
    position,
    net,
  };
}

function parseSilkscreenElement(element: any): SilkscreenElement {
  // Handle fp_line, fp_circle, fp_arc
  const type = element[0].replace('fp_', '') as 'line' | 'circle' | 'arc';
  // Parse start/end points, layers, width, etc.
  return { type };
}

function parseAt(atNode: any): { x: number; y: number } {
  // (at x y)
  return { x: parseFloat(atNode[1]), y: parseFloat(atNode[2]) };
}

function parseSize(sizeNode: any): { x: number; y: number } {
  // (size x y)
  return { x: parseFloat(sizeNode[1]), y: parseFloat(sizeNode[2]) };
}

function parseNet(padNode: any[], netIndex: number): string | undefined {
  if (netIndex > -1) {
    const netNode = padNode[netIndex] as any[];
    return netNode.length > 2 ? netNode[2] : undefined; // net code or name
  }
  return undefined;
}

// Export for async import handling
export async function loadKicadMod(filePath: string): Promise<FootprintCircuitJson> {
  return parseKicadMod(filePath);
}

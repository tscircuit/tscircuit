# KiCad Import Feature

This feature allows you to directly import KiCad `.kicad_mod` files in your tscircuit projects.

## Setup

### 1. Basic Setup

The KiCad import functionality is automatically available when you import from `tscircuit`. No additional setup is required for basic usage.

### 2. Custom Configuration (Optional)

You can provide custom platform configuration for file type handlers:

```typescript
import { PlatformConfig } from "tscircuit"

const platformConfig: PlatformConfig = {
  filetypeHandlers: [
    // Add custom file type handlers here
    // Default KiCad handler is already included
  ]
}
```

## Usage

### Direct Import (Recommended)

```typescript
import kicadMod from "./footprint/myfootprint.kicad_mod"

export default () => (
  <board>
    <chip
      name="U1"
      footprint={kicadMod}
      schX={0}
      schY={0}
    />
  </board>
)
```

### Programmatic Import

```typescript
import { importFile, PlatformConfig } from "tscircuit"

const platformConfig: PlatformConfig = {
  // Custom configuration if needed
}

const footprintData = await importFile("./footprint/myfootprint.kicad_mod", platformConfig)

// Use footprintData as circuit JSON
```

### Bun Plugin Setup

For build-time support with Bun, register the plugin in your build configuration:

```typescript
import { createKicadImportPlugin } from "tscircuit"

const plugin = createKicadImportPlugin(platformConfig)
// Register with your Bun build system
```

## How It Works

1. **File Detection**: The system detects `.kicad_mod` file imports automatically
2. **Content Reading**: The file content is read as text
3. **Parsing**: The content is parsed using `kicad-component-converter`
4. **Circuit JSON**: The parsed data is converted to Circuit JSON format
5. **Module Export**: The result is exported as a module that can be used directly

## Supported File Types

- `.kicad_mod` - KiCad footprint files (automatically handled)

## Adding Custom File Type Handlers

You can extend the system with custom file type handlers:

```typescript
import { FileTypeHandler, PlatformConfig } from "tscircuit"

const customHandler: FileTypeHandler = {
  extensions: ["custom_format"],
  handler: async (content: string, filename: string) => {
    // Parse your custom format
    return circuitJson
  }
}

const platformConfig: PlatformConfig = {
  filetypeHandlers: [customHandler]
}
```

## Bundle Size Considerations

- The `kicad-component-converter` is imported dynamically to avoid adding it to the core bundle
- Only loaded when actually importing KiCad files
- Custom handlers are only included if specified in platformConfig

## Error Handling

The system provides clear error messages for common issues:

- File not found
- Invalid file format
- Parsing errors
- Missing handlers for file types

## TypeScript Support

Full TypeScript support is included:

```typescript
import kicadMod from "./footprint/myfootprint.kicad_mod"
// kicadMod is typed as CircuitJson | Promise<CircuitJson>
```

## Examples

See `example-kicad-import.tsx` for complete working examples.

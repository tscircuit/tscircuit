# KiCad Component Converter Documentation

The **KiCad Component Converter** is a powerful tool that bridges KiCad's extensive component libraries with the tscircuit ecosystem. Convert KiCad footprints (`.kicad_mod` files) and symbols into reusable TypeScript/React components that you can use in your tscircuit projects or publish to the tscircuit registry.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [CLI Usage](#cli-usage)
- [Web Interface Usage](#web-interface-usage)
- [Supported Formats](#supported-formats)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

---

## Overview

### What It Does

The KiCad Component Converter transforms KiCad component files into formats you can use in tscircuit:

- **`.kicad_mod` files** (KiCad footprints) → **Circuit JSON** → **TypeScript components**
- **`.kicad_sym` files** (KiCad symbols) → JSON representations
- **Entire KiCad directories** → Complete npm packages ready to publish

### Why Use It

KiCad has one of the largest open-source component libraries available. Instead of recreating components manually, the converter lets you:

- Instantly convert thousands of KiCad footprints to tscircuit format
- Create complete npm packages from KiCad libraries
- Publish converted libraries to the tscircuit registry for community use
- Batch convert entire footprint directories with one command
- Keep your KiCad components synchronized with tscircuit projects

### Key Features

- **Multiple Input Methods**: Web interface, CLI, programmatic API
- **Batch Processing**: Convert entire directories at once
- **Real-time Preview**: Visualize converted components instantly
- **Multiple Output Formats**: Circuit JSON, TypeScript code, npm packages
- **Automated Publishing**: Generate GitHub CI/CD for auto-publishing
- **Type-Safe**: Full TypeScript support with generated types

---

## Installation

### Quick Start (Web Interface)

The easiest way to get started is to use the web interface directly—no installation needed:

**→ Visit: [kicad-component-converter.vercel.app](https://kicad-component-converter.vercel.app)**

### Local Installation

To use the CLI tool locally, install it via npm:

```bash
npm install -g kicad-component-converter
```

Or use it without global installation:

```bash
npx kicad-component-converter
```

### Programmatic Usage

If you want to use the converter in your own code:

```bash
npm install kicad-component-converter
```

Then import it in your project:

```typescript
import { parseKicadModToCircuitJson } from "kicad-component-converter"
```

### Verify Installation

Test that the CLI is working:

```bash
kicad-mod-converter --help
```

You should see the help menu with available commands.

---

## CLI Usage

The CLI provides both interactive and scripted conversion modes.

### Interactive Mode

For a guided experience, run the converter without arguments:

```bash
kicad-mod-converter
```

This launches an interactive prompt that guides you through:

1. Selecting input file(s)
2. Choosing output format (Circuit JSON, TypeScript, or full package)
3. Confirming conversion settings
4. Saving the output

### Batch Directory Conversion

Convert an entire KiCad footprint directory into a complete npm package:

```bash
kicad-mod-converter convert-kicad-directory \
  --input-dir ./Battery.pretty \
  --output-dir ./my-battery-package
```

#### Required Options

- **`--input-dir <path>`**: Path to the directory containing `.kicad_mod` files
  - Typically named something like `ComponentType.pretty`
  - Must contain at least one `.kicad_mod` file
  - Scans recursively for all footprints

- **`--output-dir <path>`**: Where to generate the npm package
  - Creates the directory if it doesn't exist
  - Will contain complete project structure

#### What Gets Generated

The output directory contains a complete, ready-to-use npm package:

```
my-battery-package/
├── package.json              # npm package metadata
├── tsconfig.json             # TypeScript configuration
├── README.md                 # Project documentation
├── index.tsx                 # Main entry point (exports all components)
├── lib/                      # Converted component footprints
│   ├── BatteryAA.tsx         # Individual components
│   ├── BatteryCR1225.tsx
│   └── ...
├── examples/                 # Example usage files
│   └── index.tsx
└── .github/
    └── workflows/
        └── tsci-publish.yml  # (Optional) Auto-publishing workflow
```

#### Full Example: Converting Official KiCad Library

```bash
# 1. Clone the official KiCad footprints library
git clone https://gitlab.com/kicad/libraries/kicad-footprints.git
cd kicad-footprints

# 2. Convert the Battery components
kicad-mod-converter convert-kicad-directory \
  --input-dir ./Battery.pretty \
  --output-dir ../my-tscircuit-battery-lib

# 3. Set up and test locally
cd ../my-tscircuit-battery-lib
npm install
npm run dev

# 4. (Optional) Publish to tscircuit registry
npm run ship
```

### Single File Conversion

To convert a single `.kicad_mod` file:

```bash
# Enter interactive mode and select the file
kicad-mod-converter

# Or use it programmatically (see API Reference section)
```

### Viewing Generated Package

After batch conversion, test your generated package:

```bash
cd my-battery-package
npm install          # Install dependencies
npm run dev          # Start local dev server
# Open browser to http://localhost:3020 to preview all converted components
```

### Publishing to tscircuit Registry

Once converted and tested, publish your components:

```bash
cd my-battery-package
npm run ship
# Follow the authentication prompts
# Your components are now available at tscircuit.com/@username/my-battery-package
```

---

## Web Interface Usage

The web interface provides the easiest way to convert individual components or test conversions.

### Accessing the Web Interface

Open your browser to: **[kicad-component-converter.vercel.app](https://kicad-component-converter.vercel.app)**

The interface loads instantly—no installation required.

### Step-by-Step Guide

#### **Step 1: Add Your KiCad File**

You have three options to provide a KiCad file:

**Option A: Drag and Drop**
- Simply drag a `.kicad_mod` or `.kicad_sym` file onto the upload area
- The file is processed instantly

**Option B: Click to Browse**
- Click the "Browse" button in the upload area
- Select a `.kicad_mod` or `.kicad_sym` file from your computer

**Option C: Paste S-Expression Text**
- If you have KiCad S-expression text (raw format), copy and paste it directly into the text area
- Useful for testing or if you only have text snippets

### Supported File Types

- **`.kicad_mod`** - KiCad footprint files (primary format)
- **`.kicad_mod.txt`** - Text-encoded footprint files
- **`.kicad_sym`** - KiCad symbol files (limited support)
- **S-expression text** - Raw KiCad format

#### **Step 2: Process the File**

After adding a file, click the **"Process & View"** button.

The converter will:
1. Parse the KiCad file format
2. Extract component geometry and properties
3. Generate an interactive preview
4. Display any errors or warnings

**Processing takes 1-5 seconds** depending on file complexity.

#### **Step 3: Review the Preview**

Once processing completes, you'll see:

- **Interactive PCB Viewer** (left panel)
  - Visual representation of the footprint
  - Shows pads (connection points) in different colors
  - Displays traces and outlines
  - Pans and zooms with mouse/trackpad

- **Code Preview** (right panel)
  - Syntax-highlighted TypeScript code
  - Shows the generated tscircuit component
  - Ready to copy and use

- **Circuit JSON Tab**
  - Detailed JSON representation
  - Technical format for developers

#### **Step 4: Download or Use Results**

Once satisfied with the conversion, choose your action:

| Button | Purpose |
|--------|---------|
| **Download Circuit JSON** | Export the raw JSON data to a `.json` file |
| **Download tscircuit Code** | Export TypeScript/TSX component to a `.tsx` file |
| **Open on Snippets** | Opens the code in the [tscircuit online editor](https://tscircuit.com/editor) for live testing |
| **Restart** | Clear the current file and start over |

### Usage Examples

#### Example 1: Convert a Single Battery Footprint

```
1. Visit kicad-component-converter.vercel.app
2. Download Battery_CR1225.kicad_mod from the KiCad repository
3. Drag the file into the upload area
4. Click "Process & View"
5. Review the preview
6. Click "Download tscircuit Code" to get the TSX file
7. Use it in your project:

import { BatteryCR1225 } from "./BatteryCR1225"

export default () => (
  <board width="50mm" height="50mm">
    <component footprint={BatteryCR1225} x={0} y={0} />
  </board>
)
```

#### Example 2: Test a Converted Component

```
1. Visit kicad-component-converter.vercel.app
2. Upload your converted .kicad_mod file
3. Click "Process & View"
4. Click "Open on Snippets"
5. The tscircuit online editor opens with your component
6. Edit the code and see live preview
7. Export or save if needed
```

### Understanding the Preview

The interactive preview shows:

- **Pads** (connection points)
  - Color-coded by type (SMT, through-hole, etc.)
  - Red circles typically indicate connection pads
  - Green/blue elements show outlines

- **Silkscreen Elements**
  - Text labels and part names
  - Outline/dimension indicators

- **Scale and Orientation**
  - Coordinates shown in millimeters
  - Origin (0,0) marked
  - Component rotation preserved from KiCad file

### Common Web Interface Issues

**File doesn't upload?**
- Ensure the file is a valid `.kicad_mod` file
- Check file size (should be < 5MB)
- Try a different file if the first fails

**Preview is empty?**
- Some KiCad files may have unconventional structures
- The file might be corrupted
- Try downloading the footprint directly from the official KiCad library

**Download doesn't work?**
- Check your browser's download settings
- Ensure pop-ups aren't blocked
- Try a different browser if issues persist

---

## Supported Formats

### Input Formats

#### `.kicad_mod` Files (Footprints)

Standard KiCad footprint format. This is the primary format supported by the converter.

**Characteristics:**
- Extension: `.kicad_mod`
- Format: S-expression (Lisp-like text format)
- Contains: Pad definitions, copper traces, silkscreen, edge cuts
- Typically organized in `.pretty` directories

**Example KiCad directory structure:**
```
Battery.pretty/
├── Battery_AA.kicad_mod
├── Battery_CR1225.kicad_mod
├── Battery_AAA.kicad_mod
└── ...
```

#### `.kicad_sym` Files (Symbols)

KiCad schematic symbols. Support is **partial/limited**.

**Characteristics:**
- Extension: `.kicad_sym`
- Contains: Schematic symbol definitions, pins, labels
- Less commonly used than footprints in tscircuit

#### S-Expression Text (Raw Format)

If you have KiCad data in raw S-expression format, you can paste it directly.

**Example:**
```
(footprint "SOT236_SC59"
  (layer "F.Cu")
  (descr "SC59, 5-pin, pitch 0.5mm")
  (pad "1" smd rect (at 0 0) (size 0.3 0.15))
  (pad "2" smd rect (at 0.5 0) (size 0.3 0.15))
  ...)
```

### Output Formats

#### Circuit JSON

The standardized format for electronic components in tscircuit.

**Includes:**
- Pad definitions (position, size, shape, layer)
- Traces and polygons
- Text elements and labels
- Component metadata

**Use case:** Integration with other tscircuit tools, data analysis, or custom processing.

**Example Circuit JSON (excerpt):**
```json
{
  "type": "smtpad",
  "port_hints": ["1"],
  "x": 0,
  "y": 0,
  "width": 0.3,
  "height": 0.15,
  "layer": "top"
}
```

#### TypeScript/TSX Code

Ready-to-use React components for tscircuit.

**Characteristics:**
- Full TypeScript type definitions
- Reusable React component
- Can be used directly in tscircuit projects
- Can be published as an npm package

**Example TypeScript output:**
```typescript
import { footprinter } from "@tscircuit/footprinter"

export const BatteryCR1225 = footprinter(
  () => `
    (footprint "Battery_CR1225"
      (layer "F.Cu")
      (descr "CR1225 Battery, 12.5mm diameter")
      (pad "+" smd circle (at 0 -0.5) (size 1.5 1.5))
      (pad "-" smd circle (at 0 0.5) (size 1.5 1.5))
    )
  `,
  {
    pins: ["+", "-"],
  }
)

export default BatteryCR1225
```

#### Complete npm Package

A full project structure ready to publish.

**Includes:**
```
├── package.json           # npm metadata
├── README.md             # Documentation
├── index.tsx             # Main export file
├── lib/                  # Individual components
├── examples/             # Usage examples
└── .github/workflows/    # CI/CD for publishing
```

---

## Common Workflows

This section shows practical examples of converting KiCad components for real-world use cases.

### Workflow 1: Convert and Use a Single Footprint

**Scenario:** You want to use a specific KiCad footprint (like an SM0603 resistor pad) in your tscircuit project.

**Steps:**

1. **Find and download the footprint**
   ```bash
   # Visit https://gitlab.com/kicad/libraries/kicad-footprints/-/tree/master/Resistor_SMD
   # Download Resistor_SMD_0603_1.608x0.808mm_Pitch0mm.kicad_mod
   ```

2. **Convert via web interface**
   - Open [kicad-component-converter.vercel.app](https://kicad-component-converter.vercel.app)
   - Drag the `.kicad_mod` file
   - Click "Process & View"
   - Click "Download tscircuit Code"

3. **Create a new file in your project**
   ```bash
   # In your tscircuit project
   touch src/footprints/resistor-0603.tsx
   ```

4. **Paste the converted code**
   ```typescript
   // src/footprints/resistor-0603.tsx
   import { footprinter } from "@tscircuit/footprinter"

   export const Resistor0603 = footprinter(
     () => `
       (footprint "Resistor_SMD_0603"
         (layer "F.Cu")
         (pad "1" smd rect (at -0.85 0) (size 0.9 0.6))
         (pad "2" smd rect (at 0.85 0) (size 0.9 0.6))
       )
     `,
     { pins: ["1", "2"] }
   )
   ```

5. **Use in your circuit**
   ```typescript
   import { Resistor0603 } from "./footprints/resistor-0603"

   export default () => (
     <board width="50mm" height="50mm">
       <resistor 
         name="R1" 
         footprint={Resistor0603}
         resistance="10k"
         x={0}
         y={0}
       />
     </board>
   )
   ```

### Workflow 2: Batch Convert KiCad Library to npm Package

**Scenario:** You want to convert an entire KiCad footprint library (e.g., Battery components) into a publishable tscircuit npm package.

**Steps:**

1. **Clone the official KiCad library**
   ```bash
   git clone https://gitlab.com/kicad/libraries/kicad-footprints.git
   cd kicad-footprints
   ```

2. **Run batch conversion**
   ```bash
   kicad-mod-converter convert-kicad-directory \
     --input-dir ./Battery.pretty \
     --output-dir ../tscircuit-battery-footprints
   ```

3. **Follow the interactive prompts**
   - When asked for package name: enter `@your-github-username/battery-footprints`
   - When asked about GitHub workflow: choose `yes` to enable auto-publishing

4. **Set up the package**
   ```bash
   cd ../tscircuit-battery-footprints
   npm install
   ```

5. **Test locally**
   ```bash
   npm run dev
   # Visit http://localhost:3020 to see all converted components
   ```

6. **Preview generated files**
   ```bash
   ls lib/        # View all converted components
   cat index.tsx  # See main export file
   ```

7. **Publish to tscircuit registry**
   ```bash
   # First time only: authenticate
   npm run auth

   # Then publish
   npm run ship

   # Or use GitHub auto-publish (if you set it up):
   # Just push to your GitHub repo, and it publishes automatically
   ```

8. **Use in other projects**
   ```bash
   # In another tscircuit project
   npm install @your-github-username/battery-footprints

   # Import components
   import { BatteryCR1225, BatteryAA } from "@your-github-username/battery-footprints"

   export default () => (
     <board>
       <component footprint={BatteryCR1225} x={0} y={0} />
       <component footprint={BatteryAA} x={5} y={0} />
     </board>
   )
   ```

### Workflow 3: Convert USB Connector Library

**Scenario:** You frequently use USB connectors in projects and want to create a reusable, published component library.

**Steps:**

1. **Get the USB footprints**
   ```bash
   git clone https://gitlab.com/kicad/libraries/kicad-footprints.git
   cd kicad-footprints/Connector_USB.pretty
   ```

2. **Convert to tscircuit**
   ```bash
   kicad-mod-converter convert-kicad-directory \
     --input-dir ./Connector_USB.pretty \
     --output-dir ../tscircuit-usb-connectors
   ```

3. **Customize the generated package**
   ```bash
   cd ../tscircuit-usb-connectors
   
   # Edit package.json
   cat package.json
   # Update description, author, etc.
   
   # Edit README
   cat README.md
   # Add documentation about each connector
   ```

4. **Add examples**
   ```bash
   # examples/index.tsx - create examples using your USB connectors
   cat > examples/index.tsx << 'EOF'
   import { USBCB, USBA } from "../lib/index"

   export default () => (
     <group>
       <text text="USB-C Connector" x={0} y={0} />
       <component footprint={USBCB} x={0} y={2} />
       
       <text text="USB-A Connector" x={10} y={0} />
       <component footprint={USBA} x={10} y={2} />
     </group>
   )
   EOF
   ```

5. **Test and verify**
   ```bash
   npm run dev
   # Verify all USB connectors converted correctly
   ```

6. **Push to GitHub and enable auto-publishing**
   ```bash
   git init
   git add .
   git commit -m "Add USB connector footprints"
   git push origin main
   # The workflow automatically publishes to tscircuit registry
   ```

### Workflow 4: Convert and Programmatically Process Footprints

**Scenario:** You want to convert KiCad footprints as part of a build script or custom tool.

**Steps:**

1. **Install the package**
   ```bash
   npm install kicad-component-converter
   ```

2. **Create a conversion script**
   ```typescript
   // convert-footprints.ts
   import { parseKicadModToCircuitJson } from "kicad-component-converter"
   import { readFileSync, writeFileSync } from "fs"
   import { globSync } from "glob"

   // Find all .kicad_mod files
   const footprints = globSync("./kicad-footprints/**/*.kicad_mod")

   for (const footprintPath of footprints) {
     const content = readFileSync(footprintPath, "utf-8")
     const circuitJson = await parseKicadModToCircuitJson(content)
     
     // Save as JSON
     const outputPath = footprintPath.replace(".kicad_mod", ".json")
     writeFileSync(outputPath, JSON.stringify(circuitJson, null, 2))
     
     console.log(`Converted: ${footprintPath} → ${outputPath}`)
   }
   ```

3. **Run the script**
   ```bash
   bun run convert-footprints.ts
   # or
   ts-node convert-footprints.ts
   ```

4. **Process the Circuit JSON**
   ```typescript
   // Analyze, filter, or manipulate the converted data
   const smdPads = circuitJson.filter(el => el.type === "smtpad")
   const throughHolePads = circuitJson.filter(el => el.type === "via")
   
   console.log(`SMT Pads: ${smdPads.length}`)
   console.log(`Through-hole Pads: ${throughHolePads.length}`)
   ```

---

## Troubleshooting

This section covers common issues and how to resolve them.

### Issue: "File format not supported"

**Symptoms:**
- Error appears after trying to upload a `.kicad_mod` file
- Or when running CLI conversion

**Causes:**
- File is corrupted or not a valid KiCad file
- File extension doesn't match actual format
- File uses non-standard KiCad format version

**Solutions:**

1. **Verify the file is valid KiCad**
   ```bash
   # Check file header
   head -1 your-footprint.kicad_mod
   # Should start with: (kicad_mod or similar
   ```

2. **Download from official KiCad repository**
   ```bash
   git clone https://gitlab.com/kicad/libraries/kicad-footprints.git
   # Use official KiCad files instead
   ```

3. **Check file encoding**
   ```bash
   file your-footprint.kicad_mod
   # Should show: ASCII text or UTF-8 text
   ```

4. **Try in the web interface first**
   - If it fails in web interface, it's likely a file issue
   - Try a different, simpler footprint to confirm

### Issue: "Pads are missing or incorrect in preview"

**Symptoms:**
- Preview shows footprint but pads look wrong
- Some pads appear in wrong positions
- Pad sizes don't match KiCad view

**Causes:**
- Coordinate system differences
- Rotation not being applied
- Unsupported pad types

**Solutions:**

1. **Check pad types in KiCad**
   - Open the `.kicad_mod` file in KiCad
   - Verify pad shapes and sizes
   - Note any unusual pad configurations

2. **Review the Circuit JSON**
   - In web interface, click "Circuit JSON" tab
   - Check pad coordinates and sizes
   - Compare with KiCad measurements

3. **Report issues with specific footprints**
   - Include the footprint file
   - Describe what looks wrong
   - GitHub: [tscircuit/kicad-component-converter/issues](https://github.com/tscircuit/kicad-component-converter/issues)

### Issue: "npm install fails in generated package"

**Symptoms:**
```
npm ERR! 404 Not Found
npm ERR! package not found
```

**Causes:**
- Missing dependencies specified incorrectly
- @tscircuit packages not found (requires proper npm registry)
- Node version incompatibility

**Solutions:**

1. **Ensure you have the correct registry configured**
   ```bash
   # Check if @tscircuit registry is configured
   npm config get @tscircuit:registry
   # Should return: https://registry.tscircuit.com/npm
   
   # If not set it:
   npm config set @tscircuit:registry https://registry.tscircuit.com/npm
   ```

2. **Add `.npmrc` file to your project**
   ```bash
   # Create .npmrc in the generated package root
   echo "@tscircuit:registry=https://registry.tscircuit.com/npm" > .npmrc
   ```

3. **Use Bun instead of npm**
   ```bash
   bun install
   # Bun is faster and handles scoped packages better
   ```

4. **Check Node version**
   ```bash
   node --version
   # Should be 18.x or higher
   ```

### Issue: "Generated code won't compile (TypeScript errors)"

**Symptoms:**
```
error TS2307: Cannot find module '@tscircuit/footprinter'
```

**Causes:**
- Dependencies not installed
- TypeScript configuration incorrect
- Type definitions not found

**Solutions:**

1. **Install dependencies**
   ```bash
   npm install
   # Wait for all packages to install completely
   ```

2. **Verify tsconfig.json**
   ```bash
   cat tsconfig.json
   # Should include @tscircuit/footprinter and other deps
   ```

3. **Regenerate the package**
   ```bash
   cd ..
   kicad-mod-converter convert-kicad-directory \
     --input-dir ./Battery.pretty \
     --output-dir ./new-battery-package
   ```

### Issue: "Can't publish to tscircuit registry"

**Symptoms:**
```
Error: Authentication failed
Error: TSCI_TOKEN not found
```

**Causes:**
- Not logged in or authentication token expired
- Missing GitHub credentials
- Package name conflicts

**Solutions:**

1. **Authenticate with tscircuit**
   ```bash
   npm run auth
   # or
   npm run tsci login
   # Follow GitHub OAuth flow
   ```

2. **Check authentication token**
   ```bash
   # Verify token is set
   echo $TSCI_TOKEN
   # If empty, re-authenticate
   ```

3. **Verify package name is available**
   ```bash
   npm search @your-username/my-package
   # Check that name isn't already taken
   ```

4. **Check package.json name field**
   ```bash
   cat package.json | grep '"name"'
   # Should match format: @username/package-name
   ```

### Issue: "Web interface upload is slow or times out"

**Symptoms:**
- File uploads but processing takes >30 seconds
- "Request timeout" error appears

**Causes:**
- File is very large (>10MB)
- Complex footprint with many elements
- Browser or network issues
- Server is overloaded

**Solutions:**

1. **Use CLI for large files**
   ```bash
   # CLI handles large files better
   kicad-mod-converter
   ```

2. **Split large directories**
   ```bash
   # Don't convert 10,000+ footprints at once
   # Instead, split into smaller batches
   kicad-mod-converter convert-kicad-directory \
     --input-dir ./Battery.pretty \
     --output-dir ./battery-part-1
   
   kicad-mod-converter convert-kicad-directory \
     --input-dir ./Connector_USB.pretty \
     --output-dir ./connectors
   ```

3. **Try a different browser**
   - Clear browser cache
   - Try Chrome, Firefox, or Safari
   - Disable browser extensions

4. **Use incognito/private mode**
   ```
   Cmd+Shift+N (Chrome) or Cmd+Shift+P (Firefox)
   This ensures no cached files cause issues
   ```

### Issue: "Missing elements in converted footprint"

**Symptoms:**
- Preview shows some pads but not all
- Silkscreen text is missing
- Some traces not appearing

**Causes:**
- Non-F.Cu layers not converted (only front copper layer is processed)
- Unusual layer assignments
- Unsupported KiCad elements

**Solutions:**

1. **Understand layer limitations**
   - Only pads on F.Cu (front copper) layer are converted
   - Back layer pads and silkscreen from other layers may be skipped
   - This is by design to focus on essential pads

2. **Check source KiCad file**
   ```bash
   # Open in KiCad
   # Select missing elements
   # Note their layer assignments
   ```

3. **File issue with detailed information**
   - Share the `.kicad_mod` file
   - Describe which elements are missing
   - Include expected vs actual results

### Issue: "Component name contains special characters or is too long"

**Symptoms:**
```
Error: Invalid component name
Generated code uses unusual names
```

**Causes:**
- KiCad filenames with spaces, dashes, or special characters
- Very long footprint names
- Names that conflict with JavaScript keywords

**Solutions:**

1. **Rename the file before converting**
   ```bash
   # KiCad uses: "My-Component (Rev 2).kicad_mod"
   # Rename to: "MyComponentRev2.kicad_mod"
   mv "My-Component (Rev 2).kicad_mod" "MyComponentRev2.kicad_mod"
   ```

2. **Use the converter's name normalization**
   - The converter automatically converts names to valid JavaScript identifiers
   - Check generated `index.tsx` to see the final names

3. **Manually edit generated exports**
   ```typescript
   // lib/index.tsx
   // If a name is too long or unusual, manually rename:
   export { MyComponentRev2Rev2AAA as MyComponent } from "./MyComponentRev2"
   ```

---

## API Reference

For developers who want to use kicad-component-converter programmatically in their own code.

### Installation

```bash
npm install kicad-component-converter
```

### Main Exports

#### `parseKicadModToCircuitJson`

Converts KiCad footprint file content to Circuit JSON format.

```typescript
import { parseKicadModToCircuitJson } from "kicad-component-converter"

const fileContent = await fs.readFile("footprint.kicad_mod", "utf-8")
const circuitJson = await parseKicadModToCircuitJson(fileContent)

// circuitJson is an array of circuit elements:
// [
//   { type: "smtpad", x: 0, y: 0, ... },
//   { type: "via", x: 1, y: 1, ... },
//   { type: "trace", ... },
//   ...
// ]
```

**Parameters:**
- `fileContent` (string): Raw content of a `.kicad_mod` file

**Returns:**
- Promise<AnyCircuitElement[]>: Array of circuit elements in Circuit JSON format

**Throws:**
- Error if file format is invalid

#### `parseKicadModToKicadJson`

Converts `.kicad_mod` S-expression syntax to intermediate KiCad JSON format.

```typescript
import { parseKicadModToKicadJson } from "kicad-component-converter"

const fileContent = "(...)"  // S-expression text
const kicadJson = parseKicadModToKicadJson(fileContent)

// Useful for debugging or detailed inspection
console.log(kicadJson.footprint.name)
console.log(kicadJson.footprint.pads)
```

**Parameters:**
- `fileContent` (string): Raw S-expression content

**Returns:**
- KicadModJson: Intermediate format with all parsed elements

#### `convertKicadJsonToTsCircuitSoup`

Transforms KiCad JSON format to Circuit JSON (low-level conversion).

```typescript
import { 
  parseKicadModToKicadJson,
  convertKicadJsonToTsCircuitSoup 
} from "kicad-component-converter"

const kicadJson = parseKicadModToKicadJson(fileContent)
const circuitJson = await convertKicadJsonToTsCircuitSoup(kicadJson)
```

**Parameters:**
- `kicadJson` (KicadModJson): Intermediate KiCad format

**Returns:**
- Promise<AnyCircuitElement[]>: Circuit JSON format

### Example: Complete Conversion Pipeline

```typescript
import { parseKicadModToCircuitJson } from "kicad-component-converter"
import { readFileSync, writeFileSync } from "fs"

// 1. Read KiCad file
const fileContent = readFileSync("battery.kicad_mod", "utf-8")

// 2. Convert to Circuit JSON
const circuitJson = await parseKicadModToCircuitJson(fileContent)

// 3. Process Circuit JSON
const pads = circuitJson.filter((el) => el.type === "smtpad")
const traces = circuitJson.filter((el) => el.type === "trace")

console.log(`Total pads: ${pads.length}`)
console.log(`Total traces: ${traces.length}`)

// 4. Save to file
writeFileSync(
  "battery.json",
  JSON.stringify(circuitJson, null, 2)
)
```

### Example: Using Generated Components in Your Project

```typescript
// Import a converted footprint
import BatteryCR1225 from "./BatteryCR1225"

// Use in a circuit
export default () => (
  <board width="50mm" height="50mm">
    <component
      footprint={BatteryCR1225}
      x={0}
      y={0}
    />
  </board>
)
```

### Circuit JSON Element Types

The Circuit JSON format includes the following element types:

| Type | Purpose | Example |
|------|---------|---------|
| `smtpad` | Surface mount pad | `{ type: "smtpad", x: 0, y: 0, width: 0.3, height: 0.15 }` |
| `via` | Through-hole pad/via | `{ type: "via", x: 1, y: 1, radius: 0.25 }` |
| `trace` | Copper trace/line | `{ type: "trace", path: [[0,0], [1,1]] }` |
| `polygon` | Filled polygon | `{ type: "polygon", points: [[...]] }` |
| `text` | Text label | `{ type: "text", text: "U1", x: 0, y: 0 }` |

---

## Frequently Asked Questions

**Q: Can I convert `.kicad_sym` (symbol) files?**

A: Limited support. Footprints (`.kicad_mod`) are fully supported. Symbols are partially supported.

**Q: How do I publish my converted package to npm instead of tscircuit registry?**

A: The generated `package.json` can be published to npm. Just run `npm publish` instead of `npm run ship`.

**Q: Can I modify converted components after generation?**

A: Yes. The generated TypeScript code is fully editable. You can modify pad positions, add new pads, or customize the component however you need.

**Q: How long does batch conversion take?**

A: Converting 100 footprints typically takes 5-10 seconds. Very large batches (1000+) may take a minute or more.

**Q: Are there any file size limits?**

A: Individual files should be < 5MB. If converting large directories, the process may take longer but will work.

**Q: Can I use converted components in other projects besides tscircuit?**

A: The Circuit JSON output can be used in any project. The TypeScript output is specific to tscircuit.

---

## Additional Resources

- **Main Repository:** [github.com/tscircuit/kicad-component-converter](https://github.com/tscircuit/kicad-component-converter)
- **tscircuit Documentation:** [docs.tscircuit.com](https://docs.tscircuit.com)
- **tscircuit Registry:** [tscircuit.com](https://tscircuit.com)
- **KiCad Libraries:** [gitlab.com/kicad/libraries/kicad-footprints](https://gitlab.com/kicad/libraries/kicad-footprints)
- **tscircuit Discord:** [tscircuit.com/join](https://tscircuit.com/join)

---

**Last updated:** December 2024
**Version:** 0.1.30+

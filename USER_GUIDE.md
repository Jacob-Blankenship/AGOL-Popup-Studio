# AGOL Popup Studio — User Guide

## What is AGOL Popup Studio?

AGOL Popup Studio is a visual builder for designing custom ArcGIS Online (AGOL) map popups. Instead of manually writing HTML inside AGOL's clunky popup editor, you design your popup here and the tool generates a Python script that applies your design directly to your web map.

---

## Getting Started

### Step 1 — Configure Your AGOL Connection

Fill in the **AGOL Config** panel on the left sidebar:

| Field | What to enter |
|-------|---------------|
| **AGOL URL** | Your organization's AGOL URL (e.g. `https://myorg.maps.arcgis.com/`) |
| **Username** | Your AGOL username |
| **Web Map Item ID** | The 32-character ID from the URL of your web map (found in the browser address bar when viewing the map) |

> **Tip**: You can find the Item ID by opening your web map in AGOL. The URL will look like:
> `https://myorg.maps.arcgis.com/apps/mapviewer/index.html?webmap=abc123def456...`
> The part after `webmap=` is your Item ID.

### Step 2 — Choose an Execution Mode

- **Single Layer Update**: Target a specific layer by name. Existing popup elements (charts, images, Arcade expressions) are preserved — only the attribute table is replaced.
- **Bulk Map Update**: Apply styling rules across ALL layers in the web map at once. Uses substring matching to hide fields and detect URL fields globally.

When using Single Layer mode, you must type the **exact layer title** as it appears in your web map's table of contents.

### Step 3 — Import Your Fields

You have three options for getting your field list into the Studio:

#### Option A: Fetch from Service URL
1. Paste a Feature Service URL (e.g. `https://services.arcgis.com/.../FeatureServer/0`) into the **Import Schema** panel
2. Click **Fetch**
3. Fields are automatically imported with their aliases

> **Note**: If a field has a custom alias in the service, the Studio preserves it as-is. If the alias matches the field name, the Studio auto-cleans it (replaces underscores with spaces, capitalizes words).

#### Option B: Import from Previous Run (Paste HTML)
1. If you've previously run the Studio's Python script, you can paste the generated popup HTML into the **Import from Previous Run** panel
2. Click **Import**
3. All fields, colors, aliases, font, and alignment are instantly restored
4. Look for the `<!-- AGOL_POPUP_STUDIO -->` marker in your popup HTML

#### Option C: Manual Entry
- Type field names directly into the **Field Configuration** panel using the "Add" input
- Useful for testing or building a schema from scratch

---

## Configuring Your Popup

### Popup Settings

| Setting | Description |
|---------|-------------|
| **Header Title** | The popup header. Use `{field_name}` to insert a dynamic field value (e.g. `{project_name}`), or type plain text |
| **Header Alignment** | Left, Center, or Right alignment for the header text |
| **Font Architecture** | The font family used in the generated popup |

### Popup Theming (Colors)

Use the **Popup Theming** panel to customize every color in your popup:
- **Presets**: Click a preset button (Dark Teal, Clean Slate, Simple White) to instantly load a complete color scheme
- **Custom Override**: Click any color swatch to fine-tune individual colors after selecting a preset

### Field Configuration

The drag-and-drop field list controls what appears in your popup:

| Action | How |
|--------|-----|
| **Reorder fields** | Drag the grip handle (⠿) to rearrange |
| **Rename field alias** | Click the field name text to edit inline |
| **Hide a field** | Click the eye icon — hidden fields won't appear in the popup |
| **Mark as URL** | Click the link icon — the field will render as a clickable button instead of plain text |
| **Custom button text** | When a field is marked as URL, a text input appears to set the button label (e.g. "View Report") |

---

## Generating and Running the Script

### Download the Python Script

1. Click **Download Python** to save the `Update_Popups.py` file
2. Open a terminal with `arcgis` Python API available (e.g. ArcGIS Pro's Python environment)
3. Run: `python Update_Popups.py`
4. Enter your AGOL password when prompted (it uses a secure `getpass` prompt — your password is never stored)

### What the Script Does

- Logs into your AGOL organization
- Opens the specified web map
- Finds the target layer(s)
- Generates popup HTML with your configured colors, fields, and styling
- Writes the updated popup configuration back to AGOL
- Preserves existing popup elements (charts, images, Arcade) — only the attribute table section is replaced

> **Important**: The script tags its output with `<!-- AGOL_POPUP_STUDIO -->` so future runs can cleanly update just the Studio-generated portion without affecting other popup elements.

---

## Interface Features

### Dark / Light Mode

Click the **Sun/Moon icon** in the top-right corner to toggle between dark and light mode for the Studio interface. This only affects the Studio's appearance — it does NOT change your popup colors.

### Live Simulation

The right panel shows a real-time preview of what your popup will look like in AGOL. It updates instantly as you make changes to fields, colors, fonts, and alignment.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No fields found at this URL" | Make sure the URL points directly to a layer endpoint (e.g. `.../FeatureServer/0`), not the service root |
| Script fails with authentication error | Double-check your AGOL URL and username. Ensure your password is correct |
| Popup doesn't update in AGOL | Refresh the web map in AGOL. Sometimes AGOL caches the previous popup |
| Colors look different in AGOL | AGOL's popup viewer may apply its own CSS. The generated HTML uses inline styles to minimize this |
| Fields appear in wrong order | Make sure you've dragged the fields into your desired order before downloading the script |

---

## FAQ

**Q: Does this tool store my password?**
A: No. The generated Python script uses `getpass` which prompts for your password at runtime and never saves it to disk.

**Q: Can I use this with ArcGIS Enterprise (Portal)?**
A: Yes. Enter your Portal URL instead of the AGOL URL in the config panel.

**Q: What happens to existing popup elements like charts or images?**
A: They are preserved. The script only replaces the attribute table section (marked with `<!-- AGOL_POPUP_STUDIO -->`). All other popup elements remain untouched.

**Q: Can I undo changes made by the script?**
A: Yes — you can revert the web map to a previous version using AGOL's built-in version history. Go to the web map's item page → Settings → Version History.

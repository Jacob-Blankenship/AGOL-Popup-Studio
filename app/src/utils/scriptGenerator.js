export function generatePythonScript(state) {
  const { portalConfig, updateMode, targetLayerTitle, colors, hideFields, urlFieldHints, urlButtonTexts, bulkButtonText, fieldOrder, fieldAliases, popupHeader } = state;

  const hideFieldsSet = `{"${hideFields.join('","')}"}`;
  const urlHintsTuple = `("${urlFieldHints.join('","')}")`;
  const fieldOrderList = `["${fieldOrder.join('","')}"]`;
  const fieldAliasesDictStr = JSON.stringify(fieldAliases || {});
  const urlButtonTextsDictStr = JSON.stringify(urlButtonTexts || {});

  return `
# Custom AGOL Popup Studio Script
import getpass
from arcgis.gis import GIS
from arcgis.features import FeatureLayer
import json, re, html
from copy import deepcopy

# ===== CONFIG =====
PORTAL_URL = "${portalConfig.portalUrl}"
USERNAME   = "${portalConfig.username}"
PASSWORD   = getpass.getpass('Enter AGOL Password: ')
WEBMAP_ID  = "${portalConfig.webmapId}"

# ===== COLOR PALETTE =====
COLORS = {
    "header_bg":      "${colors.header_bg}",   
    "header_text":    "${colors.header_text}",       
    "header_border":  "${colors.header_border}",       
    "row_label_bg":   "${colors.row_label_bg}",  
    "row_label_text": "${colors.row_label_text}",       
    "row_value_bg":   "${colors.row_value_bg}",   
    "row_value_text": "${colors.row_value_text}",       
    "table_border":   "${colors.table_border}",       
    "table_outline":  "${colors.table_outline}",       
    "button_bg":      "${colors.button_bg}",
    "button_text":    "${colors.button_text}",
    "button_radius":  "${colors.button_radius}",
    "button_shadow":  "${colors.button_shadow}",
}

HIDE_FIELDS = ${hideFieldsSet}
SYSTEM_FIELD_PREFIXES = ("shape","geom")
URL_FIELD_HINTS = ${urlHintsTuple}
MASTER_FIELD_ORDER = ${fieldOrderList}
FIELD_ALIASES = ${fieldAliasesDictStr}
URL_BUTTON_TEXTS = ${urlButtonTextsDictStr}
BULK_BUTTON_TEXT = "${bulkButtonText}"
UPDATE_MODE = "${updateMode}"
TARGET_LAYER_TITLE = "${targetLayerTitle}"

# ===== HELPERS =====
def _iter_nested_layers(layer_obj, parent_url=None):
    yield (layer_obj, parent_url)
    if isinstance(layer_obj.get('layers'), list):
        for sub in layer_obj['layers']:
            yield from _iter_nested_layers(sub, parent_url)

def _iter_all_layer_like(op_layer):
    base_url = op_layer.get('url')
    fc = op_layer.get('featureCollection')
    if isinstance(fc, dict) and isinstance(fc.get('layers'), list):
        for fl in fc['layers']: yield (fl, None)
    if isinstance(op_layer.get('layers'), list):
        for sub in op_layer['layers']: yield from _iter_nested_layers(sub, base_url)
    yield (op_layer, base_url)

def _enable_popups(obj: dict):
    for k in ['disablePopup', 'showPopup']:
        if k in obj: obj[k] = (k == 'showPopup')
    ld = obj.get('layerDefinition')
    if isinstance(ld, dict):
        for k in ['disablePopup', 'showPopup']:
            if k in ld: ld[k] = (k == 'showPopup')

def _get_popup_container(layer_like: dict):
    if isinstance(layer_like.get('popupInfo'), dict): return layer_like, 'popupInfo'
    if isinstance(layer_like.get('layerDefinition'), dict):
        ld = layer_like['layerDefinition']
        if not isinstance(ld.get('popupInfo'), dict): ld['popupInfo'] = {}
        return ld, 'popupInfo'
    layer_like['popupInfo'] = {}
    return layer_like, 'popupInfo'

def _service_fields(layer_url: str):
    try:
        fl = FeatureLayer(layer_url)
        if hasattr(fl, "properties") and hasattr(fl.properties, "fields"):
            return [{"name": f["name"], "alias": f.get("alias", f["name"]), "type": f.get("type","")} for f in fl.properties.fields]
    except: pass
    return None

def _fields_from_layerdef(layer_like: dict):
    ld = layer_like.get('layerDefinition') or {}
    out = []
    for f in ld.get('fields', []):
        nm = f.get("name")
        if nm: out.append({"name": nm, "alias": f.get("alias", nm), "type": f.get("type","")})
    return out or None

def _choose_fields(layer_like: dict, lyr_url: str, existing_pi: dict):
    fields = _service_fields(lyr_url) if lyr_url else None
    if not fields: fields = _fields_from_layerdef(layer_like) or []
    
    hide_ci = {s.lower() for s in HIDE_FIELDS}
    filtered = [f for f in fields if f["name"].lower() not in hide_ci and not f["name"].lower().startswith(SYSTEM_FIELD_PREFIXES)]
    
    if UPDATE_MODE == "single":
        # Apply aliases
        for f in filtered:
            fname = f["name"].lower()
            if fname in FIELD_ALIASES and FIELD_ALIASES[fname]:
                f["alias"] = FIELD_ALIASES[fname]

        # Sort according to MASTER_FIELD_ORDER
        order_map = {n.lower(): i for i, n in enumerate(MASTER_FIELD_ORDER)}
        filtered.sort(key=lambda f: order_map.get(f["name"].lower(), 9999))
        
    return filtered

def _esc_html(s: str) -> str:
    return html.escape(s or "", quote=True)

def _looks_like_url_field(field_name: str, field_alias: str = "") -> bool:
    s, a = (field_name or "").lower(), (field_alias or "").lower()
    return any(h in s for h in URL_FIELD_HINTS) or any(h in a for h in URL_FIELD_HINTS)

# ---- ARCADE BUILDER ----
def _build_expression_infos(fields: list):
    expr_infos = []
    date_expr_map, url_expr_map, vis_expr_map = {}, {}, {}

    for f in fields:
        name, alias, ftype = f["name"], f.get("alias", f["name"]), (f.get("type") or "").lower()

        if "date" in ftype:
            expr_name = re.sub(r'\\W+', '_', f"fmt_{name.lower()}")[:60]
            expr_infos.append({"name": expr_name, "title": alias, "expression": f'return IIF($feature["{name}"] == null, "", Text($feature["{name}"], "MM/DD/YYYY"));', "returnType": "String"})
            date_expr_map[name] = expr_name

        if _looks_like_url_field(name, alias):
            url_expr_name = re.sub(r'\\W+', '_', f"url_{name.lower()}")[:60]
            vis_expr_name = re.sub(r'\\W+', '_', f"vis_{name.lower()}")[:60]
            
            expr_infos.append({"name": url_expr_name, "title": alias, "expression": f'return $feature["{name}"];', "returnType": "String"})
            expr_infos.append({"name": vis_expr_name, "title": alias, "expression": f'return IIF(IsEmpty($feature["{name}"]), "none", "inline-block");', "returnType": "String"})
            
            url_expr_map[name] = url_expr_name
            vis_expr_map[name] = vis_expr_name

    return expr_infos, date_expr_map, url_expr_map, vis_expr_map

# ---- HTML BUILDER ----
def _build_text_html(title_tpl: str, fields: list, date_exprs: dict, url_exprs: dict, vis_exprs: dict) -> str:
    header = (f"<div style=\\"background:{COLORS['header_bg']};color:{COLORS['header_text']};padding:6px 10px;font-size:18px;font-weight:700;"
              f"text-transform:uppercase;font-family:{POPUP_FONT};border-radius:8px 8px 0 0;border:2px solid {COLORS['header_border']};"
              f"border-bottom:2px solid {COLORS['header_border']};text-align:{POPUP_ALIGN}\\">{_esc_html(title_tpl)}</div>")

    table_start = (f"<table style=\\"width:100%;border-collapse:collapse;border:2px solid {COLORS['table_outline']};border-top:none;font-family:{POPUP_FONT};\\"><tbody>")
    
    rows = []
    for f in fields:
        name, alias, ftype = f["name"], f.get("alias", f["name"]), (f.get("type") or "").lower()
        left_td = f"<td style=\\"padding:6px 8px;width:40%;background:{COLORS['row_label_bg']};border-bottom:1px solid {COLORS['table_border']};font-weight:600;color:{COLORS['row_label_text']};\\">{_esc_html(alias)}</td>"

        if "date" in ftype:
            right_val = "{expression/" + date_exprs[name] + "}"
        elif name in url_exprs:
            u_exp = url_exprs[name]
            v_exp = vis_exprs[name]
            if UPDATE_MODE == "single":
                btn_text = _esc_html(URL_BUTTON_TEXTS.get(name, "View Link"))
            else:
                btn_text = _esc_html(BULK_BUTTON_TEXT)
                
            right_val = (f"<a href=\\"{{expression/{u_exp}}}\\" target=\\"_blank\\" "
                         f"style=\\"display:{{expression/{v_exp}}};padding:6px 12px;background:{COLORS['button_bg']};"
                         f"color:{COLORS['button_text']};text-decoration:none;border-radius:{COLORS['button_radius']};"
                         f"box-shadow:{COLORS['button_shadow']};\\">{btn_text}</a>")
        else:
            right_val = "{" + name + "}"

        right_td = f"<td style=\\"padding:6px 8px;background:{COLORS['row_value_bg']};border-bottom:1px solid {COLORS['table_border']};color:{COLORS['row_value_text']};\\">{right_val}</td>"
        rows.append(f"<tr>{left_td}{right_td}</tr>")

    return "<!-- AGOL_POPUP_STUDIO -->" + header + table_start + "".join(rows) + "</tbody></table>"

def main():
    print("Logging on...")
    gis = GIS(PORTAL_URL, USERNAME, PASSWORD)
    wm_item = gis.content.get(WEBMAP_ID)
    wm_json = wm_item.get_data()

    for op_layer in wm_json.get('operationalLayers', []):
        for layer_like, parent_url in _iter_all_layer_like(op_layer):
            lyr_title = layer_like.get('title', '')
            if UPDATE_MODE == "single" and TARGET_LAYER_TITLE and lyr_title != TARGET_LAYER_TITLE:
                continue

            lyr_url = layer_like.get('url')
            if not lyr_url and parent_url:
                sid = layer_like.get('id', layer_like.get('layerId'))
                if sid is not None: lyr_url = f"{parent_url.rstrip('/')}/{sid}"

            container, key = _get_popup_container(layer_like)
            existing_pi = container.get(key, {})
            
            title_tpl = "${popupHeader}"

            fields = _choose_fields(layer_like, lyr_url, existing_pi)
            if not fields: continue
            
            expr_infos, date_exprs, url_exprs, vis_exprs = _build_expression_infos(fields)
            html_text = _build_text_html(title_tpl, fields, date_exprs, url_exprs, vis_exprs)

            _enable_popups(layer_like)
            pi = deepcopy(existing_pi)
            
            pi['title'] = title_tpl
            
            existing_elements = pi.get('popupElements', [{"type": "fields"}])
            new_elements = []
            replaced = False
            my_element = {"type": "text", "text": html_text}

            for el in existing_elements:
                etype = el.get("type", "")
                if etype == "fields":
                    if not replaced:
                        new_elements.append(my_element)
                        replaced = True
                elif etype == "text" and "<!-- AGOL_POPUP_STUDIO -->" in el.get("text", ""):
                    if not replaced:
                        new_elements.append(my_element)
                        replaced = True
                else:
                    new_elements.append(el)

            if not replaced:
                new_elements.insert(0, my_element)

            pi['popupElements'] = new_elements

            # Preserve other existing expressionInfos
            existing_exprs = pi.get('expressionInfos', [])
            # Filter out any that we generated before (could check by name prefix, but for now just merge)
            # Actually, to prevent duplicates, let's filter out ones we know we build.
            # But expression list is small, we can just append ours or overwrite ours
            existing_dict = {e['name']: e for e in existing_exprs}
            for e in expr_infos:
                existing_dict[e['name']] = e
            pi['expressionInfos'] = list(existing_dict.values())
            
            container[key] = pi
            print(f"  • Updated popup for: {layer_like.get('title', 'Layer')}")

    wm_item.update(item_properties={"text": json.dumps(wm_json)})
    print("\\n✅ Success! Web map popups have been updated.")

if __name__ == "__main__":
    main()
`.trim();
}

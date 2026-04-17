# New Map Viewer ONLY — Text element with HTML + tokens
# (Clickable links; Arcade-safe; color-configurable; inline-CSS only per Esri)
# UPDATE: Button visibility is controlled via Arcade 'display' property to prevent raw HTML text rendering.

from arcgis.gis import GIS
from arcgis.features import FeatureLayer
import json, re, html
from copy import deepcopy

# ===== CONFIG =====
PORTAL_URL = "--------"
USERNAME   = "--------"
PASSWORD   = "--------"
WEBMAP_ID  = "--------"

# ===== COLOR PALETTE =====
dark_blue  = "#0A4757"
light_blue = "#00303C"
white      = "#ffffff"

COLORS = {
    "header_bg":      dark_blue,   
    "header_text":    white,       
    "header_border":  white,       
    "row_label_bg":   light_blue,  
    "row_label_text": white,       
    "row_value_bg":   dark_blue,   
    "row_value_text": white,       
    "table_border":   white,       
    "table_outline":  white,       
    "button_bg":      light_blue,
    "button_text":    white,
    "button_radius":  "6px",
    "button_shadow":  "0 2px 4px rgba(0,0,0,0.15)",
}

HIDE_FIELDS = {
    "objectid","globalid","shape__area","shape__length","Shape__Area","Shape__Length",
    "created_user","creator","last_edited_user","editor","creationdate","created_date",
    "editdate","last_edited_date","createdate","links","published","c_year","data_download","archive_path",
    "project_id","hillshade","intensity","project_name","source","horizacc","vertacc","nickname","contract"
}
SYSTEM_FIELD_PREFIXES = ("shape","geom")
URL_FIELD_HINTS = ("url", "website", "web", "source_url", "sourceurl", "href", "data_view","report","dem","dsm")

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

def _visible_field_order_from_popup(pi: dict):
    if not isinstance(pi, dict): return None
    for el in pi.get('popupElements', []):
        if el.get('type') == 'fields' and isinstance(el.get('fieldInfos'), list):
            vis = [fi for fi in el['fieldInfos'] if fi.get('visible', True)]
            if vis: return [fi.get('fieldName') for fi in vis]
    return None

def _choose_fields(layer_like: dict, lyr_url: str, existing_pi: dict):
    order = _visible_field_order_from_popup(existing_pi)
    fields = _service_fields(lyr_url) if lyr_url else None
    if not fields: fields = _fields_from_layerdef(layer_like) or []
    byname = {f["name"].lower(): f for f in fields}
    if order:
        fields = [byname.get(nm.lower(), {"name": nm, "alias": nm, "type": ""}) for nm in order if nm.lower() in byname]
    hide_ci = {s.lower() for s in HIDE_FIELDS}
    return [f for f in fields if f["name"].lower() not in hide_ci and not f["name"].lower().startswith(SYSTEM_FIELD_PREFIXES)]

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
            expr_name = re.sub(r'\W+', '_', f"fmt_{name.lower()}")[:60]
            expr_infos.append({"name": expr_name, "title": alias, "expression": f'return IIF($feature["{name}"] == null, "", Text($feature["{name}"], "MM/DD/YYYY"));', "returnType": "String"})
            date_expr_map[name] = expr_name

        if _looks_like_url_field(name, alias):
            url_expr_name = re.sub(r'\W+', '_', f"url_{name.lower()}")[:60]
            vis_expr_name = re.sub(r'\W+', '_', f"vis_{name.lower()}")[:60]
            
            # Expression 1: Returns the URL
            expr_infos.append({"name": url_expr_name, "title": alias, "expression": f'return $feature["{name}"];', "returnType": "String"})
            # Expression 2: Returns "inline-block" or "none" for the CSS display property
            expr_infos.append({"name": vis_expr_name, "title": alias, "expression": f'return IIF(IsEmpty($feature["{name}"]), "none", "inline-block");', "returnType": "String"})
            
            url_expr_map[name] = url_expr_name
            vis_expr_map[name] = vis_expr_name

    return expr_infos, date_expr_map, url_expr_map, vis_expr_map

# ---- HTML BUILDER ----
def _build_text_html(title_tpl: str, fields: list, date_exprs: dict, url_exprs: dict, vis_exprs: dict) -> str:
    header = (f"<div style=\"background:{COLORS['header_bg']};color:{COLORS['header_text']};padding:6px 10px;font-size:18px;font-weight:700;"
              f"text-transform:uppercase;font-family:Microsoft YaHei;border-radius:8px 8px 0 0;border:2px solid {COLORS['table_outline']};"
              f"border-bottom:2px solid {COLORS['header_border']};text-align:center\">{_esc_html(title_tpl)}</div>")

    table_start = (f"<table style=\"width:100%;border-collapse:collapse;border:2px solid {COLORS['table_outline']};border-top:none;font-family:Microsoft YaHei;\"><tbody>")
    
    rows = []
    for f in fields:
        name, alias, ftype = f["name"], f.get("alias", f["name"]), (f.get("type") or "").lower()
        left_td = f"<td style=\"padding:6px 8px;width:40%;background:{COLORS['row_label_bg']};border-bottom:1px solid {COLORS['table_border']};font-weight:600;color:{COLORS['row_label_text']};\">{_esc_html(alias)}</td>"

        if "date" in ftype:
            right_val = "{expression/" + date_exprs[name] + "}"
        elif name in url_exprs:
            # We embed the visibility expression into the 'display' style
            u_exp = url_exprs[name]
            v_exp = vis_exprs[name]
            right_val = (f"<a href=\"{{expression/{u_exp}}}\" target=\"_blank\" "
                         f"style=\"display:{{expression/{v_exp}}};padding:6px 12px;background:{COLORS['button_bg']};"
                         f"color:{COLORS['button_text']};text-decoration:none;border-radius:{COLORS['button_radius']};"
                         f"box-shadow:{COLORS['button_shadow']};\">View</a>")
        else:
            right_val = "{" + name + "}"

        right_td = f"<td style=\"padding:6px 8px;background:{COLORS['row_value_bg']};border-bottom:1px solid {COLORS['table_border']};color:{COLORS['row_value_text']};\">{right_val}</td>"
        rows.append(f"<tr>{left_td}{right_td}</tr>")

    return header + table_start + "".join(rows) + "</tbody></table>"

def main():
    print("Logging on...")
    gis = GIS(PORTAL_URL, USERNAME, PASSWORD)
    wm_item = gis.content.get(WEBMAP_ID)
    wm_json = wm_item.get_data()

    for op_layer in wm_json.get('operationalLayers', []):
        for layer_like, parent_url in _iter_all_layer_like(op_layer):
            lyr_url = layer_like.get('url')
            if not lyr_url and parent_url:
                sid = layer_like.get('id', layer_like.get('layerId'))
                if sid is not None: lyr_url = f"{parent_url.rstrip('/')}/{sid}"

            container, key = _get_popup_container(layer_like)
            existing_pi = container.get(key, {})
            
            # 1. Update the variable passed into the HTML builder to use the nickname token
            title_tpl = "{nickname}"

            fields = _choose_fields(layer_like, lyr_url, existing_pi)
            expr_infos, date_exprs, url_exprs, vis_exprs = _build_expression_infos(fields)
            html_text = _build_text_html(title_tpl, fields, date_exprs, url_exprs, vis_exprs)

            _enable_popups(layer_like)
            pi = deepcopy(existing_pi)
            
            # 2. Hardcode the main Popup header (Esri Window Title)
            pi['title'] = "ALASKA SKYHUB"
            
            pi['popupElements'] = [{"type": "text", "text": html_text}]
            pi['expressionInfos'] = expr_infos
            container[key] = pi
            print(f"  • Updated popup for: {layer_like.get('title', 'Layer')}")

    wm_item.update(item_properties={"text": json.dumps(wm_json)})
    print("\n✅ Success! Web map popups have been updated.")
6543
if __name__ == "__main__":
    main()
import re
import time
import random
from math import ceil
from .utils import get_icon_base64

def parse_dsl(code: str):
    def tokenize(s: str):
        tokens, buf = [], []
        for ch in s:
            if ch == '{' or ch == '}':
                chunk = "".join(buf).strip()
                if chunk:
                    tokens.append(chunk)
                tokens.append(ch)
                buf = []
            else:
                buf.append(ch)
        chunk = "".join(buf).strip()
        if chunk:
            tokens.append(chunk)
        flat = []
        for t in tokens:
            if t in ("{", "}"):
                flat.append(t)
            else:
                for ln in t.splitlines():
                    ln = ln.strip()
                    if ln:
                        flat.append(ln)
        return flat

    tokens = tokenize(code)
    idx = 0
    n = len(tokens)
    connections = []
    defined_nodes = {}

    node_line_re = re.compile(r'^(?P<name>[^\[\]{}]+?)\s*\[(?P<inside>.+?)\]\s*$')
    conn_line_re = re.compile(
        r'^(?P<a>[^\{\}]+?(?:\s*\[.*?\])?)\s*'
        r'(?P<op><|>|<>)\s*'
        r'(?P<b>[^\{\}]+?(?:\s*\[.*?\])?)'
        r'(?:\s*:\s*(?P<label>.+))?$'
    )
    inline_node_re = re.compile(r'^(?P<name>[^\[\]{}:]+?)\s*\[(?P<inside>.+?)\]$')

    def parse_props(s: str) -> dict:
        props = {}
        parts, buf, in_q = [], [], False
        for ch in (s or ""):
            if ch == '"' and (not buf or buf[-1] != "\\"):
                in_q = not in_q
                buf.append(ch)
            elif ch == "," and not in_q:
                parts.append("".join(buf).strip())
                buf = []
            else:
                buf.append(ch)
        if buf:
            parts.append("".join(buf).strip())
        for p in parts:
            if ":" in p:
                k, v = p.split(":", 1)
                k = k.strip()
                v = v.strip().strip('"')
                props[k] = v
        return props

    def add_node(name: str, props: dict, items: list):
        if name not in defined_nodes:
            node = {
                "type": "service",
                "name": name,
                "icon": props.get("icon"),
                "label": props.get("label", name),
            }
            items.append(node)
            defined_nodes[name] = node

    def parse_block():
        nonlocal idx
        items = []
        while idx < n:
            tok = tokens[idx]
            if tok == "}":
                idx += 1
                break
            if tok == "{":
                idx += 1
                continue

            m_node = node_line_re.match(tok)
            if m_node:
                name = m_node.group("name").strip()
                props = parse_props(m_node.group("inside"))
                if idx + 1 < n and tokens[idx + 1] == "{":
                    idx += 2
                    children = parse_block()
                    node = {
                        "type": "container",
                        "name": name,
                        "icon": props.get("icon"),
                        "label": props.get("label", name),
                        "children": children,
                    }
                else:
                    idx += 1
                    node = {
                        "type": "service",
                        "name": name,
                        "icon": props.get("icon"),
                        "label": props.get("label", name),
                    }
                items.append(node)
                defined_nodes[name] = node
                continue

            if ">" not in tok and "<" not in tok and "<>" not in tok and "[" not in tok and tok not in ("{", "}"):
                name = tok.strip()
                node = {
                    "type": "service",
                    "name": name,
                    "icon": None,
                    "label": name,
                }
                idx += 1
                items.append(node)
                defined_nodes[name] = node
                continue

            m_conn = conn_line_re.match(tok)
            if m_conn:
                a_raw = m_conn.group("a").strip()
                b_raw = m_conn.group("b").strip()
                op = m_conn.group("op")
                label = (m_conn.group("label") or "").strip() or None

                def ensure_node(raw, name):
                    m_inline = inline_node_re.match(raw)
                    if m_inline:
                        props = parse_props(m_inline.group("inside"))
                        add_node(name, props, items)
                    else:
                        add_node(name, {}, items)

                def normalize(raw):
                    m_inline = inline_node_re.match(raw)
                    if m_inline:
                        return m_inline.group("name").strip()
                    return raw.strip()

                a = normalize(a_raw)
                b = normalize(b_raw)

                ensure_node(a_raw, a)
                ensure_node(b_raw, b)

                if op == ">":
                    connections.append({"from": a, "to": b, "label": label, "dir": "fwd"})
                elif op == "<":
                    connections.append({"from": b, "to": a, "label": label, "dir": "fwd"})
                else:
                    connections.append({"from": a, "to": b, "label": label, "dir": "both"})
                idx += 1
                continue


            idx += 1
        return items

    top_nodes = parse_block()
    return {"nodes": top_nodes, "connections": connections}



def generate_excalidraw(nodes, connections):
    elements, files, positions = [], {}, {}

    ICON_W, ICON_H = 64, 64
    LABEL_FONT_SIZE = 14
    LINE_HEIGHT = 1.35
    LABEL_LINE_PX = LABEL_FONT_SIZE * LINE_HEIGHT
    CHAR_W = 8
    LABEL_MARGIN = 8

    RECT_PAD = 24
    RECT_HEADER_H = 28
    RECT_TINY_ICON = 16
    GRID_COLS_MAX = 3
    CELL_HGAP = 80
    CELL_VGAP = 60
    TOP_ROW_GAP = 120

    PALETTE_FILL = [
        "#FFE8D5",
        "#E6F0FF",
        "#FFE6E6",
        "#E8F5E9",
        "#FFF9C4",
        "#F1E6FF",
    ]
    PALETTE_STROKE = [
        "#FFF0E4",
        "#EFF5FF",
        "#FFEFEF",
        "#F0F8F1",
        "#FFFBD9",
        "#F6EFFF",
    ]

    def unique_id(prefix="id"):
        return f"{prefix}-{int(time.time() * 1000)}-{random.randint(0, 1_000_000)}"

    def default_meta():
        return {
            "angle": 0,
            "strokeColor": "#ffffff",
            "backgroundColor": "transparent",
            "fillStyle": "solid",
            "strokeWidth": 2,
            "strokeStyle": "solid",
            "roughness": 0,
            "opacity": 100,
            "frameId": None,
            "index": None,
            "roundness": None,
            "seed": random.randint(0, 2**31 - 1),
            "version": 1,
            "versionNonce": random.randint(0, 2**31 - 1),
            "isDeleted": False,
            "link": None,
            "locked": False,
        }

    def wrap_text(text: str, max_chars: int = 16) -> str:
        words = (text or "").split()
        if not words:
            return ""
        lines, cur = [], words[0]
        for w in words[1:]:
            if len(cur) + 1 + len(w) <= max_chars:
                cur += " " + w
            else:
                lines.append(cur)
                cur = w
        lines.append(cur)
        return "\n".join(lines)

    def measure_wrapped(text_wrapped: str):
        lines = text_wrapped.split("\n") if text_wrapped else [""]
        longest = max((len(l) for l in lines), default=0)
        width = max(longest * CHAR_W, 80)
        height = max(1, len(lines)) * LABEL_LINE_PX
        return width, height, len(lines), longest

    def est_label_width(text: str) -> int:
        return max(len(text) * CHAR_W, 80)

    def measure(node):
        if node["type"] == "service":
            raw = (node.get("label") or node["name"]).strip()
            wrapped = wrap_text(raw, 16)
            lw, lh, line_count, _ = measure_wrapped(wrapped)
            w = max(ICON_W, lw)
            h = ICON_H + LABEL_MARGIN + lh
            node["_wrapped_label"] = wrapped
            node["_wrapped_label_size"] = (lw, lh)
            node["size"] = (w, h)
            return node["size"]

        total_children = len(node.get("children", []))
        if total_children == 0:
            lw = est_label_width(node.get("label") or node["name"])
            content_w = max(ICON_W, lw)
            w = content_w + 2 * RECT_PAD
            h = RECT_HEADER_H + 2 * RECT_PAD + ICON_H
            node["size"] = (w, h)
            return node["size"]

        child_sizes = [measure(ch) for ch in node["children"]]

        cols = min(GRID_COLS_MAX, max(1, total_children))
        rows = int(ceil(total_children / cols))

        max_child_w = max(w for w, _ in child_sizes) if child_sizes else ICON_W
        max_child_h = max(h for _, h in child_sizes) if child_sizes else (ICON_H + LABEL_MARGIN + LABEL_LINE_PX)

        cell_w = max_child_w + CELL_HGAP
        cell_h = max_child_h + CELL_VGAP

        content_w = cols * cell_w - CELL_HGAP
        content_h = rows * cell_h - CELL_VGAP

        lw = est_label_width(node.get("label") or node["name"])
        min_w_for_header = RECT_TINY_ICON + 8 + lw + 16

        w = max(min_w_for_header, content_w + 2 * RECT_PAD)
        h = RECT_HEADER_H + content_h + 2 * RECT_PAD

        node["grid"] = {
            "cols": cols,
            "rows": rows,
            "cell_w": cell_w,
            "cell_h": cell_h,
            "max_w": max_child_w,
            "max_h": max_child_h,
        }
        node["size"] = (w, h)
        return node["size"]

    for n in nodes:
        measure(n)

    edge_usage = {}
    EDGE_STEP_PX = 12
    GAP_PX = 8

    def next_edge_offset(element_id: str, edge_name: str) -> int:
        n = edge_usage.get((element_id, edge_name), 0)
        edge_usage[(element_id, edge_name)] = n + 1
        if n == 0:
            return 0
        m = (n + 1) // 2
        return (EDGE_STEP_PX * m) * (1 if n % 2 else -1)

    def right_binding(pos):
        left = pos["cx"] - pos["w"] / 2.0
        top  = pos["cy"] - pos["h"] / 2.0
        edge = "right"
        off_px = next_edge_offset(pos["id"], edge)
        ny = max(0.1, min(0.9, 0.5 + off_px / float(pos["h"])))
        sx = left + pos["w"] + GAP_PX
        sy = top + ny * pos["h"]
        bind = {"elementId": pos["id"], "focus": 0, "gap": GAP_PX, "fixedPoint": [1.0, ny]}
        return (sx, sy), bind, edge

    def left_binding(pos):
        left = pos["cx"] - pos["w"] / 2.0
        top  = pos["cy"] - pos["h"] / 2.0
        edge = "left"
        off_px = next_edge_offset(pos["id"], edge)
        ny = max(0.1, min(0.9, 0.5 + off_px / float(pos["h"])))
        sx = left - GAP_PX
        sy = top + ny * pos["h"]
        bind = {"elementId": pos["id"], "focus": 0, "gap": GAP_PX, "fixedPoint": [0.0, ny]}
        return (sx, sy), bind, edge

    def orthogonal_points(sx, sy, ex, ey, start_edge: str, end_edge: str):
        dx = ex - sx
        dy = ey - sy

        def axis(edge):
            return "h" if edge in ("left", "right") else "v"

        a_start = axis(start_edge)
        a_end = axis(end_edge)

        if a_start == "h" and a_end == "h":
            mid_x = sx + dx / 2.0
            return [[0, 0], [mid_x - sx, 0], [mid_x - sx, dy], [dx, dy]]
        if a_start == "v" and a_end == "v":
            mid_y = sy + dy / 2.0
            return [[0, 0], [0, mid_y - sy], [dx, mid_y - sy], [dx, dy]]
        if a_start == "h" and a_end == "v":
            return [[0, 0], [dx, 0], [dx, dy]]
        if a_start == "v" and a_end == "h":
            return [[0, 0], [0, dy], [dx, dy]]
        return [[0, 0], [dx, dy]]

    def add_file(icon_name: str):
        file_id = unique_id(icon_name or "icon")
        files[file_id] = {
            "id": file_id,
            "dataURL": f"data:image/png;base64,{get_icon_base64(icon_name)}",
            "mimeType": "image/png",
            "created": int(time.time() * 1000),
        }
        return file_id

    def render_service(node, abs_cx, abs_cy, parent_groups):
        svc_group = unique_id(f"svcgrp-{node['name']}")
        group_ids = list(parent_groups) + [svc_group]

        image_id = unique_id(f"{node['name']}-img")
        file_id = add_file(node.get("icon"))

        elements.append({
            "id": image_id,
            "type": "image",
            "fileId": file_id,
            "x": abs_cx - ICON_W / 2,
            "y": abs_cy - ICON_H / 2,
            "width": ICON_W,
            "height": ICON_H,
            "groupIds": group_ids,
            "boundElements": [],
            "status": "pending",
            "scale": [1, 1],
            "crop": None,
            **default_meta(),
        })

        label_wrapped = node.get("_wrapped_label") or wrap_text((node.get("label") or node["name"]).strip(), 16)
        lw, lh, _, _ = measure_wrapped(label_wrapped)

        elements.append({
            "id": unique_id(f"{node['name']}-label"),
            "type": "text",
            "x": abs_cx - lw / 2,
            "y": abs_cx * 0,
            "width": lw,
            "height": lh,
            "text": label_wrapped,
            "fontSize": LABEL_FONT_SIZE,
            "fontFamily": 6,
            "textAlign": "center",
            "verticalAlign": "top",
            "containerId": None,
            "originalText": label_wrapped,
            "autoResize": True,
            "lineHeight": LINE_HEIGHT,
            "groupIds": group_ids,
            **default_meta(),
        })
        elements[-1]["y"] = abs_cy + ICON_H / 2 + LABEL_MARGIN

        positions[node["name"]] = {
            "cx": abs_cx,
            "cy": abs_cy,
            "w": ICON_W,
            "h": ICON_H,
            "id": image_id,
        }

    def render_container(node, abs_left, abs_top, parent_groups, depth):
        w, h = node["size"]
        rect_id = unique_id(f"{node['name']}-rect")
        this_group = unique_id(f"group-{node['name']}")
        group_ids = list(parent_groups) + [this_group]

        idx = depth % len(PALETTE_FILL)
        fill_color = PALETTE_FILL[idx]
        stroke_color = PALETTE_STROKE[idx]

        rect_meta = default_meta()
        rect_meta["strokeColor"] = stroke_color
        rect_meta["backgroundColor"] = fill_color
        rect_meta["fillStyle"] = "solid"
        rect_meta["strokeWidth"] = 2

        elements.append({
            "id": rect_id,
            "type": "rectangle",
            "x": abs_left,
            "y": abs_top,
            "width": w,
            "height": h,
            "groupIds": group_ids,
            **rect_meta,
        })

        positions[node["name"]] = {
            "cx": abs_left + w / 2.0,
            "cy": abs_top + h / 2.0,
            "w": w,
            "h": h,
            "id": rect_id,
        }

        tiny_file_id = add_file(node.get("icon"))
        elements.append({
            "id": unique_id(f"{node['name']}-tiny-icon"),
            "type": "image",
            "fileId": tiny_file_id,
            "x": abs_left + 8,
            "y": abs_top + (RECT_HEADER_H - RECT_TINY_ICON) / 2.0,
            "width": RECT_TINY_ICON,
            "height": RECT_TINY_ICON,
            "groupIds": group_ids,
            "boundElements": [],
            "status": "pending",
            "scale": [1, 1],
            "crop": None,
            **default_meta(),
        })

        title = node.get("label") or node["name"]
        tlw = est_label_width(title)
        elements.append({
            "id": unique_id(f"{node['name']}-title"),
            "type": "text",
            "x": abs_left + 8 + RECT_TINY_ICON + 6,
            "y": abs_top + (RECT_HEADER_H - LABEL_LINE_PX) / 2.0,
            "width": tlw,
            "height": LABEL_LINE_PX,
            "text": title,
            "fontSize": LABEL_FONT_SIZE,
            "fontFamily": 6,
            "textAlign": "left",
            "verticalAlign": "top",
            "originalText": title,
            "autoResize": True,
            "lineHeight": LINE_HEIGHT,
            "groupIds": group_ids,
            **default_meta(),
        })

        children = node.get("children", [])
        if not children:
            return

        cols = node["grid"]["cols"]
        rows = node["grid"]["rows"]
        cell_w = node["grid"]["cell_w"]
        cell_h = node["grid"]["cell_h"]
        max_w = node["grid"]["max_w"]
        max_h = node["grid"]["max_h"]

        content_left = abs_left + RECT_PAD
        content_top = abs_top + RECT_HEADER_H + RECT_PAD

        grid_w = cols * cell_w - CELL_HGAP
        grid_h = rows * cell_h - CELL_VGAP
        offset_x = (w - 2 * RECT_PAD - grid_w) / 2.0
        offset_y = (h - RECT_HEADER_H - 2 * RECT_PAD - grid_h) / 2.0

        for i, ch in enumerate(children):
            r = i // cols
            c = i % cols

            col_x_start = content_left + offset_x + c * cell_w
            row_y_start = content_top + offset_y + r * cell_h

            child_cx = col_x_start + max_w / 2.0
            child_cy = row_y_start + max_h / 2.0

            cw, chh = ch["size"]

            if ch["type"] == "service":
                render_service(ch, child_cx, child_cy, group_ids)
            else:
                nested_left = child_cx - cw / 2.0
                nested_top = child_cy - chh / 2.0
                render_container(ch, nested_left, nested_top, group_ids, depth + 1)

    cursor_x, cursor_y = 100, 100
    row_h = 0
    canvas_max_w = 1200

    for node in nodes:
        w, h = node["size"]
        if cursor_x + w > canvas_max_w:
            cursor_x = 100
            cursor_y += row_h + 120
            row_h = 0

        if node["type"] == "service":
            render_service(node, cursor_x + w / 2.0, cursor_y + h / 2.0, [])
        else:
            render_container(node, cursor_x, cursor_y, [], depth=0)

        cursor_x += w + TOP_ROW_GAP
        row_h = max(row_h, h)

    def find_el(el_id):
        for e in elements:
            if e.get("id") == el_id:
                return e
        return None

    for conn in connections:
        f, t, label = conn["from"], conn["to"], conn.get("label")
        if f not in positions or t not in positions:
            continue

        from_pos, to_pos = positions[f], positions[t]

        (sx, sy), start_bind, start_edge = right_binding(from_pos)
        (ex, ey), end_bind,   end_edge   = left_binding(to_pos)

        points = orthogonal_points(sx, sy, ex, ey, start_edge, end_edge)
        both = (conn.get("dir") == "both")

        arrow_id = unique_id("arrow")
        arrow_el = {
            "id": arrow_id,
            "type": "arrow",
            "x": sx,
            "y": sy,
            "width": ex - sx,
            "height": ey - sy,
            "points": points,
            "startBinding": start_bind,
            "endBinding": end_bind,
            "startArrowhead": "arrow" if both else None,
            "endArrowhead": "arrow",
            "elbowed": True,
            "fixedSegments": [],
            "startIsSpecial": False,
            "endIsSpecial": False,
            "boundElements": [],
            "groupIds": [],
            **default_meta(),
        }
        elements.append(arrow_el)

        for pos in (from_pos, to_pos):
            node_el = find_el(pos["id"])
            if node_el:
                node_el.setdefault("boundElements", []).append({"id": arrow_id, "type": "arrow"})

        if label:
            label_wrapped = wrap_text(label, 16)
            lw, lh, _, _ = measure_wrapped(label_wrapped)
            min_x = min(sx, ex)
            max_x = max(sx, ex)
            min_y = min(sy, ey)
            max_y = max(sy, ey)
            mid_x = (min_x + max_x) / 2.0
            mid_y = (min_y + max_y) / 2.0

            label_el = {
                "id": unique_id(f"{arrow_id}-label"),
                "type": "text",
                "x": mid_x - lw / 2.0,
                "y": mid_y - lh / 2.0,
                "width": lw,
                "height": lh,
                "text": label_wrapped,
                "fontSize": LABEL_FONT_SIZE,
                "fontFamily": 6,
                "textAlign": "center",
                "verticalAlign": "middle",
                "containerId": arrow_id,
                "originalText": label_wrapped,
                "autoResize": True,
                "lineHeight": LINE_HEIGHT,
                "groupIds": [],
                **default_meta(),
            }
            elements.append(label_el)
            arrow_el["boundElements"].append({"id": label_el["id"], "type": "text"})

    return {
        "type": "excalidraw",
        "version": 2,
        "source": "eido-backend",
        "elements": elements,
        "appState": {"viewBackgroundColor": "#1C1C1C", "gridSize": 20},
        "files": files,
    }

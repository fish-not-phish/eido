import base64
from pathlib import Path
from django.conf import settings

def get_icon_base64(icon_name: str) -> str:
    """Load icon from backend/static/icons and return base64 string."""
    path = Path(settings.BASE_DIR) / "static" / "icons" / f"{icon_name}.png"
    if not path.exists():
        return ""
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

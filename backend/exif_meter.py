"""EXIF metering helpers. Pillow is optional so stripped images still receive fallback EV."""
from __future__ import annotations

import io
import math
from typing import Any


def calculate_ev100(f_number: float, exposure_time: float, iso: int) -> float:
    if f_number <= 0 or exposure_time <= 0 or iso <= 0:
        raise ValueError("Exposure values must be positive")
    return math.log2((f_number**2) / exposure_time) - math.log2(iso / 100)


def read_exif_bytes(payload: bytes) -> dict[str, Any]:
    try:
        from PIL import Image, ExifTags

        image = Image.open(io.BytesIO(payload))
        raw = image.getexif()
        tags = {ExifTags.TAGS.get(key, str(key)): value for key, value in raw.items()}
        f_number = float(tags.get("FNumber", 1.8))
        exposure = float(tags.get("ExposureTime", 1 / 125))
        iso = int(tags.get("ISOSpeedRatings", tags.get("PhotographicSensitivity", 320)))
        focal_length = float(tags.get("FocalLength", 26))
        white_balance = str(tags.get("WhiteBalance", "Auto"))
        return {
            "fNumber": f_number,
            "exposureTime": exposure,
            "iso": iso,
            "focalLength": focal_length,
            "whiteBalance": white_balance,
            "sceneEv": round(calculate_ev100(f_number, exposure, iso), 1),
            "source": "EXIF",
        }
    except Exception:
        return {
            "fNumber": None,
            "exposureTime": None,
            "iso": None,
            "focalLength": None,
            "whiteBalance": None,
            "sceneEv": None,
            "source": "fallback",
            "fallbackPresets": {
                "brightSun": 15,
                "overcast": 12,
                "indoorBright": 8,
                "dimNight": 4,
            },
        }

from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass
class CameraSpec:
    crop_factor: float
    min_native_iso: int
    max_native_iso: int
    max_shutter_speed: str
    ibis_stops: float


@dataclass
class LensSpec:
    focal_length: float
    max_aperture: float
    min_aperture: float


def _nearest_iso(value: float, minimum: int, maximum: int) -> int:
    standard = [100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6400, 8000, 10000, 12800, 16000, 20000, 25600, 32000, 40000, 51200]
    available = [iso for iso in standard if minimum <= iso <= maximum]
    return min(available, key=lambda iso: abs(iso - value))


def _parse_shutter(value: str) -> float:
    try:
        return 1 / float(value.split("/")[-1])
    except (ValueError, ZeroDivisionError):
        return 1 / 8000


def solve_recipe(*, scene_ev: float, exposure_shift_ev: float, target_bokeh_level: str, subject_motion_speed: str, target_kelvin: int, camera: CameraSpec, lens: LensSpec) -> dict[str, object]:
    aperture = min(lens.min_aperture, max(lens.max_aperture, 2.0 if target_bokeh_level == "shallow" else 4.0))
    reciprocal = 1 / (lens.focal_length * camera.crop_factor)
    ibis_adjusted = reciprocal * (2 ** camera.ibis_stops)
    motion_floor = {"static": 1 / 60, "slow": 1 / 125, "fast": 1 / 500}.get(subject_motion_speed, 1 / 125)
    seconds = min(motion_floor, max(_parse_shutter(camera.max_shutter_speed), ibis_adjusted))
    target_ev = scene_ev + exposure_shift_ev
    raw_iso = 100 * (aperture**2) / (seconds * 2**target_ev)
    iso = max(camera.min_native_iso, min(camera.max_native_iso, _nearest_iso(raw_iso, camera.min_native_iso, camera.max_native_iso)))
    return {
        "mode": "M",
        "aperture": f"f/{aperture:.1f}",
        "shutter": f"1/{round(1 / seconds)}s",
        "iso": f"ISO {iso}",
        "kelvin": target_kelvin,
        "targetEv": round(target_ev, 1),
        "rawIso": round(raw_iso),
        "alert": "Add an ND filter or stop down if the target ISO falls below native base ISO." if raw_iso < camera.min_native_iso else None,
    }

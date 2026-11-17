from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel

from .exif_meter import read_exif_bytes
from .exposure_solver import CameraSpec, LensSpec, solve_recipe

app = FastAPI(title="OpticMatch API", version="0.1.0")
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class SolveRequest(BaseModel):
    scene_ev: float
    exposure_shift_ev: float = -0.7
    target_bokeh_level: str = "shallow"
    subject_motion_speed: str = "slow"
    target_kelvin: int = 5600
    focal_length: float = 50
    crop_factor: float = 1.0
    max_aperture: float = 1.8
    min_aperture: float = 22
    min_iso: int = 100
    max_iso: int = 51200
    max_shutter_speed: str = "1/8000"
    ibis_stops: float = 5.5


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/api/meter")
async def meter(file: UploadFile = File(...)) -> dict[str, Any]:
    payload = await file.read()
    safe_name = Path(file.filename or "reference-image").name
    (UPLOAD_DIR / safe_name).write_bytes(payload)
    return read_exif_bytes(payload)


@app.post("/api/solve")
def solve(request: SolveRequest) -> dict[str, Any]:
    camera = CameraSpec(
        crop_factor=request.crop_factor,
        min_native_iso=request.min_iso,
        max_native_iso=request.max_iso,
        max_shutter_speed=request.max_shutter_speed,
        ibis_stops=request.ibis_stops,
    )
    lens = LensSpec(
        focal_length=request.focal_length,
        max_aperture=request.max_aperture,
        min_aperture=request.min_aperture,
    )
    return solve_recipe(
        scene_ev=request.scene_ev,
        exposure_shift_ev=request.exposure_shift_ev,
        target_bokeh_level=request.target_bokeh_level,
        subject_motion_speed=request.subject_motion_speed,
        target_kelvin=request.target_kelvin,
        camera=camera,
        lens=lens,
    )

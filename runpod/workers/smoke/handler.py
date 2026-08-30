import os
import platform
import subprocess

import runpod


def _gpu_info():
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,memory.total,driver_version", "--format=csv,noheader"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
        if result.returncode == 0:
            return [line.strip() for line in result.stdout.splitlines() if line.strip()]
        return []
    except Exception:
        return []


def handler(job):
    job_input = job.get("input") or {}
    return {
        "ok": True,
        "message": "CreatorPilot RunPod worker is reachable.",
        "echo": job_input,
        "runtime": {
            "python": platform.python_version(),
            "platform": platform.platform(),
            "gpu": _gpu_info(),
            "worker_id": os.getenv("RUNPOD_POD_ID") or os.getenv("RUNPOD_WORKER_ID"),
        },
    }


runpod.serverless.start({"handler": handler})

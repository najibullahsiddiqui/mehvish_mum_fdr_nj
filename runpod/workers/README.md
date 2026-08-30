# CreatorPilot RunPod workers

This directory contains deployment assets for CreatorPilot / Random Rooms RunPod Serverless workers.

## Deployment order

1. Deploy `smoke/` first and verify the GitHub -> RunPod build, endpoint health, `/run`, and `/status/{jobId}` flow.
2. Deploy the image worker for Random Rooms keyframes.
3. Deploy the video worker for Random Rooms I2V/T2V generation.
4. Configure the resulting endpoint IDs only in the local CreatorPilot `.env` file.

Do not commit RunPod API keys or other credentials.

## Smoke worker

RunPod GitHub deployment settings:

- Repository: `najibullahsiddiqui/mehvish_mum_fdr_nj`
- Branch: `runpod-deployment-workers` while testing; switch to `main` after merge
- Context path: `runpod/workers/smoke`
- Dockerfile path: `Dockerfile`
- Active workers: `0`
- Max workers: `1` for the smoke test

The worker accepts any JSON under `input` and returns a small runtime diagnostic payload. It does not load an AI model and is intended only to prove the deployment path before GPU model work begins.

Example job input:

```json
{
  "input": {
    "ping": "creatorpilot"
  }
}
```

Expected output includes:

```json
{
  "ok": true,
  "message": "CreatorPilot RunPod worker is reachable."
}
```

## CreatorPilot application configuration

After the real image/video endpoints exist, set these values locally only:

```env
RUNPOD_ENABLED=true
RUNPOD_API_KEY=<keep-local-only>
RUNPOD_IMAGE_ENDPOINT_ID=<image-endpoint-id>
RUNPOD_VIDEO_ENDPOINT_ID=<video-endpoint-id>
RUNPOD_IMAGE_MODEL=<deployed-image-model>
RUNPOD_VIDEO_MODEL=<deployed-video-model>
```

Keep `ALLOW_CLOUD_AI=true` and `ALLOW_PAID_AI=true` intentional and explicit when running billable generation.

## Worker contract expected by CreatorPilot

Image jobs receive an `input` object with `task=text_to_image`, prompt, framing/style/room metadata, aspect ratio, and internal metadata IDs.

Video jobs receive an `input` object with `task=image_to_video` or `task=text_to_video`, prompt, duration, framing/movement, continuity data, room data, and internal metadata IDs.

A completed worker must return a downloadable HTTPS media URL somewhere in its `output` JSON. CreatorPilot recursively looks for common fields including `image_url`, `video_url`, `output_url`, `file_url`, or `url` and then downloads the media into `MEDIA_ROOT`.

Local filesystem paths from the CreatorPilot PC are not reachable from RunPod. The production video worker therefore must receive the keyframe through a remotely reachable URL or an explicit upload/base64 transport; this is handled as a required integration step before the real I2V endpoint is enabled.

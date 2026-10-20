# CreatorPilot ComfyUI workflows

CreatorPilot expects **API-format ComfyUI workflow JSON**, not the normal browser workflow export.

The exact node IDs stay inside the exported JSON. CreatorPilot only replaces explicit placeholders, so the application does not hardcode a specific ComfyUI graph.

## Keyframe workflow

Set `COMFYUI_IMAGE_WORKFLOW_PATH` to the JSON file path.

Supported placeholders currently sent by CreatorPilot:

- `{{PROMPT}}`
- `{{NEGATIVE_PROMPT}}`
- `{{VISUAL_DESCRIPTION}}`
- `{{ASPECT_RATIO}}`
- `{{CAMERA_FRAMING}}`
- `{{CONTINUITY_NOTES}}`
- `{{SEED}}`

The workflow should finish with a normal downloadable ComfyUI output such as a Save Image node.

## Wan image-to-video workflow

Set `COMFYUI_VIDEO_WORKFLOW_PATH` to the JSON file path.

CreatorPilot uploads the approved/local keyframe through `POST /upload/image` first. The workflow can then use:

- `{{INPUT_IMAGE_NAME}}`
- `{{INPUT_IMAGE_SUBFOLDER}}`
- `{{INPUT_IMAGE_TYPE}}`
- `{{PROMPT}}` or `{{VIDEO_PROMPT}}`
- `{{ACTION_DESCRIPTION}}`
- `{{DURATION_SEC}}`
- `{{ASPECT_RATIO}}`
- `{{CAMERA_FRAMING}}`
- `{{CAMERA_MOVEMENT}}`
- `{{CONTINUITY_NOTES}}`
- `{{SEED}}`

The workflow must expose a downloadable output in ComfyUI history. MP4/WebM/MOV/MKV/GIF outputs are preferred for video.

## RunPod Pod

Keep the Pod URL in environment configuration only:

`COMFYUI_BASE_URL=https://<pod-id>-3000.proxy.runpod.net`

Do not commit a Pod ID, proxy URL, credentials, or workflow secrets to Git.

Keep `COMFYUI_ENABLED=false` while the Pod is stopped. CreatorPilot will not intentionally call ComfyUI in safe-off mode.

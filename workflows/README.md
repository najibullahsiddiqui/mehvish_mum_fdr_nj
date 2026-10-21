# CreatorPilot ComfyUI workflows

CreatorPilot expects **API-format ComfyUI workflow JSON**, not the normal browser workflow export.

The exact node IDs stay inside the exported JSON. CreatorPilot only replaces explicit placeholders, so the application does not hardcode a specific ComfyUI graph.

## Keyframe workflow

The checked-in baseline is `workflows/creatorpilot_qwen_keyframe_v1.api.json`, adapted from the verified Qwen Image 2.1 Image Edit API export. Set `COMFYUI_IMAGE_WORKFLOW_PATH` to that file (or to a compatible replacement). It treats image 1 as the room/base canvas and image 2 as the primary character reference.

Supported placeholders currently sent by CreatorPilot:

- `{{PROMPT}}`
- `{{NEGATIVE_PROMPT}}`
- `{{VISUAL_DESCRIPTION}}`
- `{{ASPECT_RATIO}}`
- `{{CAMERA_FRAMING}}`
- `{{CONTINUITY_NOTES}}`
- `{{SEED}}`
- `{{CHARACTER_REFERENCE_COUNT}}`
- `{{CHARACTER_REFERENCE_1_NAME}}`, `{{CHARACTER_REFERENCE_1_SUBFOLDER}}`, `{{CHARACTER_REFERENCE_1_TYPE}}` (and 2, 3, ... when multiple characters are present)
- `{{HAS_ROOM_REFERENCE}}`
- `{{ROOM_REFERENCE_NAME}}`, `{{ROOM_REFERENCE_SUBFOLDER}}`, `{{ROOM_REFERENCE_TYPE}}`

Reference placeholders are populated from the primary character/room reference assets selected in CreatorPilot. Only placeholders actually present in your exported workflow need to be used.

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


### Verified Qwen baseline

The baseline workflow uses Qwen Image 2.1 INT8 with prompt enhancer bypassed, 25 Euler/simple steps, and 1024×1024 output. CreatorPilot replaces the room image, primary character image, prompt, negative prompt, and seed at runtime. Keep the prompt enhancer disabled for the initial production path; it can be evaluated later as an optional quality/cost trade-off.

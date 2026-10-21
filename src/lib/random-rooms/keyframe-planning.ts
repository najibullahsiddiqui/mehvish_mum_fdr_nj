export type KeyframePromptInput = {
  shotPrompt: string;
  visualDescription?: string | null;
  cameraFraming?: string | null;
  continuityNotes?: string | null;
};

function clean(value?: string | null) {
  return value?.trim() || "";
}

export function composeQwenKeyframePrompt(input: KeyframePromptInput) {
  const shotPrompt = clean(input.shotPrompt);
  const visual = clean(input.visualDescription);
  const framing = clean(input.cameraFraming);
  const continuity = clean(input.continuityNotes);

  const details = [
    shotPrompt ? `Scene instruction: ${shotPrompt}` : "",
    visual ? `Visual direction: ${visual}` : "",
    framing ? `Camera framing: ${framing}` : "",
    continuity ? `Continuity requirements: ${continuity}` : "",
  ].filter(Boolean);

  return [
    "Use image_1 as the room/background canvas and image_2 as the character identity reference.",
    "Place the character from image_2 naturally inside the room from image_1.",
    "Preserve the room layout, environment, lighting intent, and perspective from image_1.",
    "Preserve the character identity, face, body proportions, clothing identity, and distinctive visual traits from image_2.",
    ...details,
    "Create one clean cinematic keyframe. Keep all untargeted visual details stable and do not introduce extra characters unless the scene instruction explicitly requires them.",
  ].join(" ");
}

export function validateQwenKeyframeReferences(input: {
  roomReferencePath?: string | null;
  characterReferencePath?: string | null;
}) {
  const missing: string[] = [];
  if (!clean(input.roomReferencePath)) missing.push("primary room reference");
  if (!clean(input.characterReferencePath)) missing.push("primary character reference");
  return missing;
}

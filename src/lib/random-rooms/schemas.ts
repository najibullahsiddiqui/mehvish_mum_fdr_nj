import { z } from "zod";
import { RANDOM_ROOMS_SCENE_PURPOSES } from "@/lib/types";

const text = z.string().trim().min(1);
const optionalText = z.string().trim().optional().default("");

export const randomRoomsEpisodePlanOutputSchema = z.object({
  title: text.max(180),
  hook: text.max(1200),
  comedyAngle: text.max(1200),
  scenes: z
    .array(
      z.object({
        purpose: z.enum(RANDOM_ROOMS_SCENE_PURPOSES),
        title: text.max(180),
        summary: text.max(2400),
        beat: text.max(2400),
        durationSec: z.coerce.number().int().min(1).max(300),
        roomCode: z.string().trim().optional().default(""),
        shots: z
          .array(
            z.object({
              shotType: text.max(180),
              cameraFraming: text.max(180),
              cameraMovement: text.max(180),
              actionDescription: text.max(2400),
              visualDescription: text.max(2400),
              imagePrompt: optionalText,
              videoPrompt: optionalText,
              durationSec: z.coerce.number().int().min(1).max(300),
              emotion: text.max(180),
              continuityNotes: optionalText,
            }),
          )
          .min(1)
          .max(12),
        dialogue: z
          .array(
            z.object({
              characterCode: text.max(24),
              text: text.max(1400),
              emotion: optionalText,
              deliveryStyle: optionalText,
              captionText: optionalText,
              durationEstimateMs: z.coerce.number().int().min(0).max(3_600_000).optional(),
            }),
          )
          .max(24),
      }),
    )
    .min(1)
    .max(8),
});

export type RandomRoomsEpisodePlanOutput = z.infer<typeof randomRoomsEpisodePlanOutputSchema>;

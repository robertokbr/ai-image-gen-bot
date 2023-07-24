import { promises } from 'node:fs';
import { resolve } from 'node:path';

interface GenerationResponse {
    artifacts: Array<{
      base64: string;
      seed: number;
      finishReason: string;
    }>;
  }

export class StabilityAIImageGeneratorProvider {
  public async generate(prompt: string) {
    console.info('Generating image with prompt:', prompt)

    const engineId = 'stable-diffusion-xl-1024-v0-9';
    const apiHost = 'https://api.stability.ai';
    const apiKey = process.env.STABILITY_API_KEY;

    if (!apiKey) throw new Error('Missing Stability API key.');

    const response = await fetch(
      `${apiHost}/v1/generation/${engineId}/text-to-image`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
            },
          ],
          height: 1024,
          width: 1024,
          samples: 1,
          seed: 270347,
          steps: 30,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Non-200 response: ${await response.text()}`);
    }

    const responseJSON = (await response.json()) as GenerationResponse;

    const image = responseJSON.artifacts[0];
    const imageName = `${Date.now()}.png`;
    const filename = resolve(__dirname, '..', 'static', imageName);
    await promises.writeFile(filename, Buffer.from(image.base64, 'base64'));

    return imageName;
  }
}


export const imageGenerator = new StabilityAIImageGeneratorProvider();

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// OpenRouter API integration for Gemini model

// Helper function to convert a File object to data URL for OpenRouter
const fileToDataUrl = async (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

interface OpenRouterResponse {
    choices: Array<{
        message: {
            content: string;
        };
        finish_reason: string;
    }>;
    error?: {
        message: string;
    };
}

const handleOpenRouterResponse = (
    response: OpenRouterResponse,
    context: string
): string => {
    if (response.error) {
        const errorMessage = `OpenRouter API error for ${context}: ${response.error.message}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    const choice = response.choices?.[0];
    if (!choice) {
        const errorMessage = `No response choices returned for ${context}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    const content = choice.message?.content;
    if (!content) {
        const errorMessage = `No content in response for ${context}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // For image generation, the content should be a data URL
    if (!content.startsWith('data:image/')) {
        const errorMessage = `Response for ${context} does not contain valid image data. Content: ${content.substring(0, 100)}...`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    console.log(`Received image data for ${context}`);
    return content;
};

const callOpenRouter = async (messages: any[]): Promise<OpenRouterResponse> => {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY or API_KEY environment variable is required');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://pixshop.app',
            'X-Title': 'Pixshop - AI Photo Editor',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview:free',
            messages
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
};

/**
 * Generates an edited image using generative AI based on a text prompt and a specific point.
 * @param originalImage The original image file.
 * @param userPrompt The text prompt describing the desired edit.
 * @param hotspot The {x, y} coordinates on the image to focus the edit.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateEditedImage = async (
    originalImage: File,
    userPrompt: string,
    hotspot: { x: number, y: number }
): Promise<string> => {
    console.log('Starting generative edit at:', hotspot);
    
    const imageDataUrl = await fileToDataUrl(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perform a natural, localized edit on the provided image based on the user's request.
User Request: "${userPrompt}"
Edit Location: Focus on the area around pixel coordinates (x: ${hotspot.x}, y: ${hotspot.y}).

Editing Guidelines:
- The edit must be realistic and blend seamlessly with the surrounding area.
- The rest of the image (outside the immediate edit area) must remain identical to the original.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final edited image. Do not return text.`;

    console.log('Sending image and prompt to OpenRouter...');
    const messages = [
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: prompt
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: imageDataUrl
                    }
                }
            ]
        }
    ];

    const response = await callOpenRouter(messages);
    console.log('Received response from OpenRouter for edit.');

    return handleOpenRouterResponse(response, 'edit');
};

/**
 * Generates an image with a filter applied using generative AI.
 * @param originalImage The original image file.
 * @param filterPrompt The text prompt describing the desired filter.
 * @returns A promise that resolves to the data URL of the filtered image.
 */
export const generateFilteredImage = async (
    originalImage: File,
    filterPrompt: string,
): Promise<string> => {
    console.log(`Starting filter generation: ${filterPrompt}`);
    
    const imageDataUrl = await fileToDataUrl(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to apply a stylistic filter to the entire image based on the user's request. Do not change the composition or content, only apply the style.
Filter Request: "${filterPrompt}"

Safety & Ethics Policy:
- Filters may subtly shift colors, but you MUST ensure they do not alter a person's fundamental race or ethnicity.
- You MUST REFUSE any request that explicitly asks to change a person's race (e.g., 'apply a filter to make me look Chinese').

Output: Return ONLY the final filtered image. Do not return text.`;

    console.log('Sending image and filter prompt to OpenRouter...');
    const messages = [
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: prompt
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: imageDataUrl
                    }
                }
            ]
        }
    ];

    const response = await callOpenRouter(messages);
    console.log('Received response from OpenRouter for filter.');
    
    return handleOpenRouterResponse(response, 'filter');
};

/**
 * Generates an image with a global adjustment applied using generative AI.
 * @param originalImage The original image file.
 * @param adjustmentPrompt The text prompt describing the desired adjustment.
 * @returns A promise that resolves to the data URL of the adjusted image.
 */
export const generateAdjustedImage = async (
    originalImage: File,
    adjustmentPrompt: string,
): Promise<string> => {
    console.log(`Starting global adjustment generation: ${adjustmentPrompt}`);
    
    const imageDataUrl = await fileToDataUrl(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to perform a natural, global adjustment to the entire image based on the user's request.
User Request: "${adjustmentPrompt}"

Editing Guidelines:
- The adjustment must be applied across the entire image.
- The result must be photorealistic.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final adjusted image. Do not return text.`;

    console.log('Sending image and adjustment prompt to OpenRouter...');
    const messages = [
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: prompt
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: imageDataUrl
                    }
                }
            ]
        }
    ];

    const response = await callOpenRouter(messages);
    console.log('Received response from OpenRouter for adjustment.');
    
    return handleOpenRouterResponse(response, 'adjustment');
};
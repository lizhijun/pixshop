/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Multi-provider AI image generation service (OpenRouter + Replicate)

// Helper function to convert a File object to data URL for OpenRouter
const fileToDataUrl = async (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// Helper function to convert image URL to data URL
const convertUrlToDataUrl = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    } catch (error) {
        console.error('Error converting URL to data URL:', error);
        throw new Error(`Failed to convert image URL to data URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

// Replicate API integration using direct HTTP calls to avoid CORS
const callReplicate = async (prompt: string, imageUrl: string): Promise<string> => {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
        throw new Error('REPLICATE_API_TOKEN environment variable is required');
    }

    try {
        // Create prediction
        const predictionResponse = await fetch('/api/replicate/v1/models/google/nano-banana/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'wait'
            },
            body: JSON.stringify({
                input: {
                    prompt: prompt,
                    image_input: [imageUrl],
                    output_format: "jpg"
                }
            })
        });

        if (!predictionResponse.ok) {
            const errorText = await predictionResponse.text();
            throw new Error(`Replicate API request failed: ${predictionResponse.status} ${predictionResponse.statusText} - ${errorText}`);
        }

        const prediction = await predictionResponse.json();
        
        if (prediction.error) {
            throw new Error(`Replicate model error: ${prediction.error}`);
        }

        // If we get output immediately (with Prefer: wait header) and it's completed
        if (prediction.status === 'succeeded' && prediction.output) {
            // Output can be a string URL directly or an array
            let imageUrl: string;
            if (typeof prediction.output === 'string') {
                imageUrl = prediction.output;
            } else if (Array.isArray(prediction.output) && prediction.output[0]) {
                imageUrl = prediction.output[0];
            } else {
                throw new Error('No valid output URL found in completed prediction');
            }
            
            // Convert image URL to data URL
            return await convertUrlToDataUrl(imageUrl);
        }

        // If status is processing or starting, poll for completion
        if (prediction.status === 'processing' || prediction.status === 'starting') {
            if (!prediction.urls || !prediction.urls.get) {
                throw new Error('No polling URL provided by Replicate');
            }

            let attempts = 0;
            const maxAttempts = 60; // 60 seconds max for processing
            
            while (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
                
                const statusResponse = await fetch(`/api/replicate${prediction.urls.get.replace('https://api.replicate.com', '')}`, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                });
                
                if (!statusResponse.ok) {
                    throw new Error(`Failed to check prediction status: ${statusResponse.status}`);
                }
                
                const status = await statusResponse.json();
                console.log(`Replicate status check ${attempts + 1}: ${status.status}`);
                
                if (status.status === 'succeeded' && status.output) {
                    // Output can be a string URL directly or an array
                    let imageUrl: string;
                    if (typeof status.output === 'string') {
                        imageUrl = status.output;
                    } else if (Array.isArray(status.output) && status.output[0]) {
                        imageUrl = status.output[0];
                    } else {
                        throw new Error('No valid output URL found in completed prediction');
                    }
                    
                    // Convert image URL to data URL
                    return await convertUrlToDataUrl(imageUrl);
                }
                
                if (status.status === 'failed') {
                    throw new Error(`Replicate prediction failed: ${status.error || 'Unknown error'}`);
                }
                
                if (status.status === 'canceled') {
                    throw new Error('Replicate prediction was canceled');
                }
                
                attempts++;
            }
            
            throw new Error('Replicate prediction timed out after 60 seconds');
        }

        // Handle other statuses
        if (prediction.status === 'failed') {
            throw new Error(`Replicate prediction failed: ${prediction.error || 'Unknown error'}`);
        }

        throw new Error('Unexpected response format from Replicate API');
    } catch (error) {
        console.error('Replicate API error:', error);
        throw new Error(`Replicate API failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// Multi-provider image generation with fallback
const generateImageWithFallback = async (prompt: string, imageUrl: string, context: string): Promise<string> => {
    // Try Replicate first (primary)
    try {
        console.log(`Attempting ${context} with Replicate...`);
        return await callReplicate(prompt, imageUrl);
    } catch (replicateError) {
        console.warn(`Replicate failed for ${context}:`, replicateError);
        
        // Fallback to OpenRouter
        try {
            console.log(`Falling back to OpenRouter for ${context}...`);
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
                                url: imageUrl
                            }
                        }
                    ]
                }
            ];

            const response = await callOpenRouter(messages);
            return handleOpenRouterResponse(response, context);
        } catch (openRouterError) {
            console.error(`Both providers failed for ${context}:`, { replicateError, openRouterError });
            throw new Error(`All image generation providers failed. Replicate: ${replicateError instanceof Error ? replicateError.message : 'Unknown error'}. OpenRouter: ${openRouterError instanceof Error ? openRouterError.message : 'Unknown error'}`);
        }
    }
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

    return await generateImageWithFallback(prompt, imageDataUrl, 'edit');
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

    return await generateImageWithFallback(prompt, imageDataUrl, 'filter');
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

    return await generateImageWithFallback(prompt, imageDataUrl, 'adjustment');
};
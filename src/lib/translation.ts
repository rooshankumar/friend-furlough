/**
 * Translation Service using LibreTranslate
 * 
 * LibreTranslate is a free, open-source translation API that can be self-hosted.
 * 
 * Setup Options:
 * 1. Use public instance (free but rate-limited): https://libretranslate.com
 * 2. Self-host with Docker:
 *    docker run -ti --rm -p 5000:5000 libretranslate/libretranslate
 * 3. Deploy to your server for production
 * 
 * Configure in .env:
 * VITE_LIBRETRANSLATE_URL=https://libretranslate.com (or your self-hosted URL)
 * VITE_LIBRETRANSLATE_API_KEY=your_key_here (optional, for self-hosted with auth)
 */

// Get LibreTranslate URL from environment or use public instance
const LIBRETRANSLATE_URL = import.meta.env.VITE_LIBRETRANSLATE_URL || 'https://libretranslate.com';
const LIBRETRANSLATE_API_KEY = import.meta.env.VITE_LIBRETRANSLATE_API_KEY || '';

/**
 * Translate text to target language using LibreTranslate
 * @param text - Text to translate
 * @param targetLang - Target language code (e.g., 'en', 'es', 'fr')
 * @param sourceLang - Source language code (optional, will auto-detect if not provided)
 * @returns Translated text
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<string> {
  try {
    const requestBody: any = {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text'
    };

    // Add API key if configured
    if (LIBRETRANSLATE_API_KEY) {
      requestBody.api_key = LIBRETRANSLATE_API_KEY;
    }

    const response = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Translation failed. Please try again.');
  }
}

/**
 * Detect language of text using LibreTranslate
 * @param text - Text to detect language for
 * @returns Language code (e.g., 'en', 'es', 'fr')
 */
export async function detectLanguage(text: string): Promise<string> {
  try {
    const requestBody: any = {
      q: text
    };

    if (LIBRETRANSLATE_API_KEY) {
      requestBody.api_key = LIBRETRANSLATE_API_KEY;
    }

    const response = await fetch(`${LIBRETRANSLATE_URL}/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Language detection failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // LibreTranslate returns array of detections, get the most confident one
    if (data && data.length > 0) {
      return data[0].language;
    }
    
    return 'en'; // Default to English
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en'; // Default to English
  }
}

/**
 * Get supported languages from LibreTranslate
 * @returns Array of supported language codes and names
 */
export async function getSupportedLanguages(): Promise<Array<{ code: string; name: string }>> {
  try {
    const url = LIBRETRANSLATE_API_KEY 
      ? `${LIBRETRANSLATE_URL}/languages?api_key=${LIBRETRANSLATE_API_KEY}`
      : `${LIBRETRANSLATE_URL}/languages`;
      
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch languages');
    }
    
    const data = await response.json();
    return data.map((lang: any) => ({
      code: lang.code,
      name: lang.name
    }));
  } catch (error) {
    console.error('Error fetching supported languages:', error);
    // Return common languages as fallback
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
    ];
  }
}

/**
 * Cache for translations to avoid redundant API calls
 */
const translationCache = new Map<string, string>();

/**
 * Get cached translation or translate and cache
 * @param text - Text to translate
 * @param targetLang - Target language code
 * @returns Translated text
 */
export async function getCachedTranslation(
  text: string,
  targetLang: string
): Promise<string> {
  const cacheKey = `${text}:${targetLang}`;
  
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }
  
  const translation = await translateText(text, targetLang);
  translationCache.set(cacheKey, translation);
  
  return translation;
}

/**
 * Clear translation cache
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Translate multiple texts in batch
 * @param texts - Array of texts to translate
 * @param targetLang - Target language code
 * @param sourceLang - Source language code (optional)
 * @returns Array of translated texts
 */
export async function translateBatch(
  texts: string[],
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<string[]> {
  try {
    // LibreTranslate doesn't have native batch support, so we do concurrent requests
    const promises = texts.map(text => getCachedTranslation(text, targetLang));
    return await Promise.all(promises);
  } catch (error) {
    console.error('Batch translation error:', error);
    throw error;
  }
}

/**
 * Auto-translate text to user's preferred language
 * Detects source language and translates to target
 * @param text - Text to translate
 * @param userPreferredLang - User's preferred language
 * @returns Object with original text, detected language, and translation
 */
export async function autoTranslate(
  text: string,
  userPreferredLang: string
): Promise<{
  original: string;
  detected: string;
  translated: string;
  isTranslated: boolean;
}> {
  try {
    const detectedLang = await detectLanguage(text);
    
    // If already in user's language, no need to translate
    if (detectedLang === userPreferredLang) {
      return {
        original: text,
        detected: detectedLang,
        translated: text,
        isTranslated: false
      };
    }
    
    const translated = await getCachedTranslation(text, userPreferredLang);
    
    return {
      original: text,
      detected: detectedLang,
      translated,
      isTranslated: true
    };
  } catch (error) {
    console.error('Auto-translate error:', error);
    // Return original text if translation fails
    return {
      original: text,
      detected: 'unknown',
      translated: text,
      isTranslated: false
    };
  }
}

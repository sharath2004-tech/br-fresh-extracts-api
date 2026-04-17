const DEFAULT_GOOGLE_URL = 'https://translation.googleapis.com/language/translate/v2';

function extractTranslatedText(payload) {
  if (!payload) return '';
  // Azure — returns array: [{ translations: [{ text, to }] }]
  if (Array.isArray(payload) && payload[0]?.translations?.[0]?.text) return payload[0].translations[0].text;
  // Google
  if (payload.data?.translations?.[0]?.translatedText) return payload.data.translations[0].translatedText;
  // MyMemory
  if (payload.responseData?.translatedText) return payload.responseData.translatedText;
  // DeepL
  if (payload.translations?.[0]?.text) return payload.translations[0].text;
  // LibreTranslate
  if (typeof payload.translatedText === 'string') return payload.translatedText;
  if (payload.translation) return payload.translation;
  return '';
}

export async function translateText(req, res, next) {
  try {
    const { text, target, source = 'en' } = req.body || {};
    if (!text || !target) {
      return res.status(400).json({ error: 'text and target are required' });
    }

    const provider = (process.env.TRANSLATE_PROVIDER || 'mymemory').toLowerCase();
    const apiKey = process.env.TRANSLATE_API_KEY || '';

    let response;

    if (provider === 'mymemory') {
      // Free, no API key required. 1000 words/day.
      // Optional: set TRANSLATE_API_KEY to a MyMemory email for higher limits.
      const params = new URLSearchParams({
        q: text,
        langpair: `${source}|${target}`,
        ...(apiKey ? { de: apiKey } : {}),
      });
      response = await fetch(`https://api.mymemory.translated.net/get?${params}`, { method: 'GET' });

    } else if (provider === 'azure') {
      if (!apiKey) return res.status(500).json({ error: 'Missing TRANSLATE_API_KEY for Azure Translator' });
      const region = process.env.TRANSLATE_AZURE_REGION || 'eastus';
      const params = new URLSearchParams({ 'api-version': '3.0', to: target, from: source });
      response = await fetch(`https://api.cognitive.microsofttranslator.com/translate?${params}`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Ocp-Apim-Subscription-Region': region,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ text }]),
      });

    } else if (provider === 'deepl') {
      if (!apiKey) return res.status(500).json({ error: 'Missing TRANSLATE_API_KEY for DeepL' });
      // Free tier key ends with ":fx"
      const base = apiKey.endsWith(':fx')
        ? 'https://api-free.deepl.com/v2/translate'
        : 'https://api.deepl.com/v2/translate';
      response = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `DeepL-Auth-Key ${apiKey}` },
        body: JSON.stringify({ text: [text], target_lang: target.toUpperCase(), source_lang: source.toUpperCase() }),
      });

    } else if (provider === 'google') {
      if (!apiKey) return res.status(500).json({ error: 'Missing TRANSLATE_API_KEY for Google Translate' });
      const endpoint = `${DEFAULT_GOOGLE_URL}?key=${encodeURIComponent(apiKey)}`;
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, target, format: 'text', source }),
      });

    } else {
      // LibreTranslate fallback
      const apiUrl = process.env.TRANSLATE_API_URL || 'https://libretranslate.com/translate';
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source, target, format: 'text', api_key: apiKey || undefined }),
      });
    }

    if (!response.ok) {
      const msg = await response.text();
      return res.status(502).json({ error: 'Translation API error', details: msg });
    }

    const data = await response.json();
    const translatedText = extractTranslatedText(data) || text;
    return res.json({ translatedText });
  } catch (err) {
    return next(err);
  }
}

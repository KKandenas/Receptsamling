// Supabase Edge Function: parse-recipe-image
//
// Takes a photo of a recipe (cookbook page, printed recipe, handwriting) and
// asks Gemini to read it and return structured recipe data. Keeps the
// GEMINI_API_KEY secret server-side — it must never be shipped in index.html.
//
// Deploy: supabase functions deploy parse-recipe-image
// Requires the GEMINI_API_KEY secret to already be set on the project.

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const MODEL = 'gemini-2.0-flash';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RECIPE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING', nullable: true },
    ingredients: { type: 'ARRAY', items: { type: 'STRING' } },
    instructions: { type: 'ARRAY', items: { type: 'STRING' } },
    time_minutes: { type: 'INTEGER', nullable: true },
    servings: { type: 'INTEGER', nullable: true },
  },
  required: ['ingredients', 'instructions'],
};

const PROMPT = `Du tittar på ett foto av ett recept (kan vara en kokbokssida, ett utskrivet recept eller handskrivet). Läs av texten så noggrant du kan och returnera receptet strukturerat enligt schemat.

- "ingredients": en lista med en ingrediens per rad, t.ex. "2 dl mjölk". Om inga ingredienser syns, returnera en tom lista.
- "instructions": en lista med ett tillagningssteg per rad. Om inga instruktioner syns, returnera en tom lista.
- "title", "time_minutes" och "servings": fyll i om det syns i bilden, annars null.
- Skriv på samma språk som receptet i bilden. Gissa inte på information som inte syns i bilden.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY är inte konfigurerad på servern');
    const { image, mimeType } = await req.json();
    if (!image || typeof image !== 'string') throw new Error('Ingen bild skickades med');

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mimeType || 'image/jpeg', data: image } },
            ],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: RECIPE_SCHEMA,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini svarade med fel (${geminiRes.status}): ${errText.slice(0, 300)}`);
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Fick inget tolkningsbart svar från Gemini');

    const recipe = JSON.parse(text);
    return new Response(JSON.stringify(recipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

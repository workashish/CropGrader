// @ts-nocheck — This file runs in Supabase Edge Functions (Deno runtime), not Node.js
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CropAnalysisRequest {
  imageBase64: string;
  cropType: string;
}

interface QualityScores {
  colorQuality: number;
  sizeShape: number;
  surfaceQuality: number;
  diseasePest: number;
  ripeness: number;
  overallAppeal: number;
}

const GRADE_THRESHOLDS = {
  A: 90,
  B: 75,
  C: 55,
  D: 0,
};

const getGradeFromScore = (score: number): string => {
  if (score >= GRADE_THRESHOLDS.A) return 'A';
  if (score >= GRADE_THRESHOLDS.B) return 'B';
  if (score >= GRADE_THRESHOLDS.C) return 'C';
  return 'D';
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AI_API_KEY = Deno.env.get("AI_API_KEY") || Deno.env.get("GEMINI_API_KEY");
    if (!AI_API_KEY) {
      throw new Error("AI_API_KEY is not configured");
    }

    const { imageBase64, cropType }: CropAnalysisRequest = await req.json();

    if (!imageBase64 || !cropType) {
      return new Response(
        JSON.stringify({ error: "Missing imageBase64 or cropType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert agricultural quality inspector specializing in crop grading. Analyze the provided image of a ${cropType} and provide detailed quality assessment.

You MUST respond with a valid JSON object containing these exact fields:
{
  "scores": {
    "colorQuality": <number 0-100>,
    "sizeShape": <number 0-100>,
    "surfaceQuality": <number 0-100>,
    "diseasePest": <number 0-100>,
    "ripeness": <number 0-100>,
    "overallAppeal": <number 0-100>
  },
  "explanations": {
    "colorQuality": "<detailed explanation>",
    "sizeShape": "<detailed explanation>",
    "surfaceQuality": "<detailed explanation>",
    "diseasePest": "<detailed explanation>",
    "ripeness": "<detailed explanation>",
    "overallAppeal": "<detailed explanation>"
  },
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...],
  "observations": ["<observation 1>", "<observation 2>", ...],
  "confidence": <number 75-98>
}

Scoring guidelines:
- colorQuality: Assess color uniformity, vibrancy, and characteristic coloring for the crop type
- sizeShape: Evaluate size consistency and shape regularity
- surfaceQuality: Check for blemishes, cuts, bruises, or surface damage
- diseasePest: Look for signs of disease, pest damage, or fungal infection
- ripeness: Determine optimal ripeness level for market
- overallAppeal: Overall visual marketability

Be accurate and consistent - the same image should always produce similar scores.`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please analyze this ${cropType} image and provide the quality assessment in the exact JSON format specified.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI model");
    }

    // Parse the JSON response from the AI
    let analysisResult;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      analysisResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI analysis result");
    }

    const scores: QualityScores = analysisResult.scores;
    const overallScore = Math.round(
      Object.values(scores).reduce((a, b) => a + b, 0) / 6
    );
    const grade = getGradeFromScore(overallScore);

    const result = {
      id: crypto.randomUUID(),
      cropType,
      grade,
      confidence: analysisResult.confidence || 85,
      scores,
      explanation: {
        ...analysisResult.explanations,
        recommendations: analysisResult.recommendations || [],
        observations: analysisResult.observations || [],
      },
      overallScore,
      timestamp: new Date().toISOString(),
      requiresHumanVerification: (analysisResult.confidence || 85) < 80,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-crop error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

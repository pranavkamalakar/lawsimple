import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Use Lovable AI Gateway instead of calling providers directly
// LOVABLE_API_KEY is auto-provisioned by Lovable AI
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AnalysisResult = {
  summary: string;
  documentType?: string;
  keyPoints: Array<{
    text: string;
    type: "important" | "critical" | "favorable";
    explanation: string;
  }>;
  clauses: Array<{
    title: string;
    original: string;
    simplified: string;
    risk: "low" | "medium" | "high";
  }>;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { content, fileName, language = "en" } = await req.json();
    if (!content || typeof content !== "string" || content.trim().length < 20) {
      return new Response(
        JSON.stringify({
          error: "No or insufficient document content provided.",
          summary: "Provide a longer document to analyze.",
          keyPoints: [],
          clauses: [],
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("Analyzing document via Lovable AI:", fileName ?? "(untitled)", "Length:", content.length);

    const languageNames: Record<string, string> = {
      en: "English",
      hi: "Hindi",
      mr: "Marathi",
      te: "Telugu",
      kn: "Kannada",
      ml: "Malayalam"
    };

    const languageInstruction = language !== "en" 
      ? `IMPORTANT: Provide ALL explanations, summaries, and simplified text in ${languageNames[language] || "English"}. Only keep original quoted text in its original language.` 
      : "";

    const systemPrompt = `You are a legal document analysis expert. Analyze contracts precisely, explain clearly for non-lawyers, and avoid hallucinations. ${languageInstruction}`;

    // Define tool for structured output
    const analyzeTool = {
      type: "function",
      function: {
        name: "analyze_document",
        description: "Return structured analysis of a legal document",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string", description: "2-3 sentence summary" },
            documentType: { type: "string", description: "Type of document" },
            keyPoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  type: { type: "string", enum: ["important", "critical", "favorable"] },
                  explanation: { type: "string" },
                },
                required: ["text", "type", "explanation"],
                additionalProperties: false,
              },
              minItems: 3,
              maxItems: 6,
            },
            clauses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  original: { type: "string" },
                  simplified: { type: "string" },
                  risk: { type: "string", enum: ["low", "medium", "high"] },
                },
                required: ["title", "original", "simplified", "risk"],
                additionalProperties: false,
              },
              minItems: 4,
              maxItems: 8,
            },
          },
          required: ["summary", "documentType", "keyPoints", "clauses"],
          additionalProperties: false,
        },
      },
    } as const;

    const userPrompt = `Analyze the following legal document and return structured results via the analyze_document tool.\n\nFilename: ${
      fileName ?? "(untitled)"
    }\n\nFocus on: payment terms, liability/risk, termination, deadlines, rights/responsibilities, and red flags. Keep quotes to first 200 chars for each clause.\n\nDocument Content:\n${content}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [analyzeTool],
        tool_choice: { type: "function", function: { name: "analyze_document" } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again shortly.", summary: "", keyPoints: [], clauses: [] }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required for AI usage. Please add credits to your workspace.", summary: "", keyPoints: [], clauses: [] }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "AI gateway error", details: text, summary: "", keyPoints: [], clauses: [] }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    console.log("AI gateway response received");

    // OpenAI-compatible tool call parsing
    let result: AnalysisResult | null = null;
    try {
      const choice = data?.choices?.[0];
      const toolCalls = choice?.message?.tool_calls ?? choice?.message?.toolCalls ?? [];
      if (toolCalls.length > 0) {
        const call = toolCalls[0];
        const argsStr: string = call?.function?.arguments ?? call?.function?.argumentsText ?? "{}";
        result = JSON.parse(argsStr);
      } else {
        // Fallback: try to parse content as JSON (in case tool calling failed)
        const contentText: string | undefined = choice?.message?.content;
        if (contentText) {
          // Strip code fences if present
          let t = contentText.trim();
          if (t.startsWith("```")) {
            t = t.replace(/^```json?/i, "").replace(/```$/i, "").trim();
          }
          result = JSON.parse(t);
        }
      }
    } catch (e) {
      console.error("Parse error:", e);
    }

    if (!result) {
      // Minimal safe fallback
      result = {
        summary: "Document analysis completed. Some fields may be simplified due to parsing fallback.",
        documentType: "legal document",
        keyPoints: [
          { text: "Contains legal obligations and terms", type: "important", explanation: "The document sets binding responsibilities." },
        ],
        clauses: [
          {
            title: "General Provisions",
            original: content.slice(0, 200) + "...",
            simplified: "Overview of primary terms and conditions.",
            risk: "medium",
          },
        ],
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-document function:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg, summary: "Analysis failed due to technical issues. Please try again.", keyPoints: [], clauses: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
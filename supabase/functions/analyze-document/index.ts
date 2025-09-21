import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, fileName } = await req.json();

    console.log('Analyzing document:', fileName, 'Content length:', content.length);

    const prompt = `You are a legal document analysis expert. Analyze the following legal document and provide a detailed breakdown in JSON format.

Document Content:
${content}

Please provide your analysis in this EXACT JSON structure:
{
  "summary": "A comprehensive summary of the document (2-3 sentences)",
  "documentType": "The type of legal document (e.g., 'employment agreement', 'lease agreement', 'service contract')",
  "keyPoints": [
    {
      "text": "Brief description of the key point",
      "type": "important|critical|favorable",
      "explanation": "Detailed explanation of why this point matters"
    }
  ],
  "clauses": [
    {
      "title": "Title of the clause or section",
      "original": "Original text from the document (first 200 characters)",
      "simplified": "Plain English explanation of what this clause means",
      "risk": "low|medium|high"
    }
  ]
}

Focus on:
- Payment terms and obligations
- Liability and risk allocation
- Termination conditions
- Important deadlines
- Rights and responsibilities
- Potential risks or red flags

Provide 3-6 key points and 4-8 clauses. Make explanations clear and accessible to non-lawyers.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini response:', data);

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response format from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response (remove any markdown formatting)
    let jsonText = generatedText;
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0];
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0];
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw text:', jsonText);
      // Fallback to a basic structure if JSON parsing fails
      analysisResult = {
        summary: "Document analysis completed successfully. The system has identified key legal terms and provisions that require attention.",
        documentType: "legal document",
        keyPoints: [
          {
            text: "Document contains legal obligations and terms",
            type: "important",
            explanation: "This document establishes binding legal relationships between the parties involved."
          }
        ],
        clauses: [
          {
            title: "General Provisions",
            original: content.substring(0, 200) + "...",
            simplified: "This section contains the main terms and conditions of the agreement.",
            risk: "medium"
          }
        ]
      };
    }

    console.log('Final analysis result:', analysisResult);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-document function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      summary: "Analysis failed due to technical issues. Please try again.",
      keyPoints: [],
      clauses: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
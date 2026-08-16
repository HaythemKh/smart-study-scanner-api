import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type GenerationType = 'summary' | 'quiz' | 'flashcards';

interface GenerateOptions {
  buffer: Buffer;
  mimeType: string;
  filename: string;
  type: GenerationType;
}

export interface SummaryResult {
  title: string;
  summary: string;
  keyPoints: string[];
  wordCount: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizResult {
  title: string;
  questions: QuizQuestion[];
}

export interface Flashcard {
  id: number;
  front: string;
  back: string;
  hint?: string;
}

export interface FlashcardsResult {
  title: string;
  flashcards: Flashcard[];
}

const PROMPTS: Record<GenerationType, string> = {
  summary: `You are an expert academic summarizer. Analyze the provided document and return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "title": "Document title or inferred title",
  "summary": "A comprehensive 3-5 paragraph summary of the document",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "...up to 8 key points"],
  "wordCount": <estimated word count of original document as integer>
}

IMPORTANT RULES:
1. Detect the language of the document and respond in THE SAME LANGUAGE. If the document is in French, respond in French. If in Arabic, respond in Arabic. If in English, respond in English, etc.
2. Only process documents with educational text content. If the image contains no readable text or educational content (e.g., photos of people, objects, landscapes), respond with an error explaining this is not suitable for summarization.`,

  quiz: `You are an expert quiz creator for students. Analyze the provided document and return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "title": "Quiz title based on document",
  "questions": [
    {
      "id": 1,
      "question": "Question text?",
      "options": ["A. Option A", "B. Option B", "C. Option C", "D. Option D"],
      "correctAnswer": "A",
      "explanation": "Why this answer is correct"
    }
  ]
}
Generate 5 to 10 multiple-choice questions. Cover different parts of the document. Make distractors plausible.

CRITICAL JSON FORMATTING RULES:
1. ALWAYS escape special characters in strings: quotes ("), backslashes (\\), newlines
2. Replace any quote (") inside text with single quote (')
3. Remove any line breaks inside string values
4. Ensure all strings are properly closed with quotes
5. DO NOT include any text outside the JSON structure

IMPORTANT RULES:
1. Detect the language of the document and create the quiz in THE SAME LANGUAGE. If the document is in French, write questions in French. If in Arabic, write in Arabic. If in English, write in English, etc.
2. Only process documents with educational text content. If the image contains no readable text or educational content (e.g., photos of people, objects, landscapes), respond with an error.
3. Keep questions and options concise to avoid JSON parsing issues.`,

  flashcards: `You are an expert at creating study flashcards. Analyze the provided document and return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "title": "Flashcard deck title",
  "flashcards": [
    {
      "id": 1,
      "front": "Term, concept, or question",
      "back": "Definition, explanation, or answer",
      "hint": "Optional memory hint (can be null)"
    }
  ]
}
Generate 8 to 15 flashcards covering the most important concepts, terms, and ideas from the document.

IMPORTANT RULES:
1. Detect the language of the document and create flashcards in THE SAME LANGUAGE. If the document is in French, write in French. If in Arabic, write in Arabic. If in English, write in English, etc.
2. Only process documents with educational text content. If the image contains no readable text or educational content (e.g., photos of people, objects, landscapes), respond with an error.`,
};

const SUPPORTED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'text/plain',
  'text/html',
  'text/csv',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

@Injectable()
export class AiGenerationService {
  private readonly logger = new Logger(AiGenerationService.name);
  private readonly apiKey: string;
  private readonly model = 'gemini-2.5-flash';
  private readonly apiBase = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(private readonly config: ConfigService) {
    this.apiKey =
      process.env['GEMINI_API_KEY'] ||
      this.config.getOrThrow<string>('GEMINI_API_KEY');

    console.log(
      '🔑 [AI Service] Gemini API Key loaded:',
      this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT FOUND',
    );
    console.log('🔑 [AI Service] API Key length:', this.apiKey?.length || 0);

    if (!this.apiKey) {
      console.error('❌ [AI Service] INVALID GEMINI API KEY!');
      console.error(
        '❌ [AI Service] Get your key from: https://aistudio.google.com/app/apikey',
      );
    }
  }

  async generate(
    opts: GenerateOptions,
  ): Promise<SummaryResult | QuizResult | FlashcardsResult> {
    const { buffer, mimeType, filename, type } = opts;

    console.log('🚀 [AI Service] Starting generation...');
    console.log('📋 [AI Service] Options:', {
      filename,
      mimeType,
      bufferSize: buffer.length,
      type,
    });

    this.logger.log(`Generating [${type}] for file: ${filename} (${mimeType})`);

    console.log('🔍 [AI Service] Resolving MIME type...');
    const resolvedMime = this.resolveMimeType(mimeType, filename);
    console.log('✅ [AI Service] Resolved MIME type:', resolvedMime);

    console.log('📦 [AI Service] Converting buffer to base64...');
    const base64Data = buffer.toString('base64');
    console.log(
      '✅ [AI Service] Base64 conversion complete (length:',
      base64Data.length,
      ')',
    );

    console.log('📝 [AI Service] Building request body...');
    const requestBody = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: resolvedMime,
                data: base64Data,
              },
            },
            {
              text: PROMPTS[type],
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        // Stop sequences to ensure complete JSON
        stopSequences: [],
      },
    };
    console.log('✅ [AI Service] Request body built');

    const url = `${this.apiBase}/models/${this.model}:generateContent?key=${this.apiKey}`;
    console.log(
      '🌐 [AI Service] Gemini API URL (without key):',
      `${this.apiBase}/models/${this.model}:generateContent?key=***`,
    );
    console.log(
      '🔑 [AI Service] Using API key:',
      this.apiKey.substring(0, 15) + '...',
    );
    console.log('📡 [AI Service] Making request to Gemini API...');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    console.log('📬 [AI Service] Response received from Gemini');
    console.log(
      '📊 [AI Service] Status:',
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [AI Service] Gemini API error!');
      console.error('❌ [AI Service] Status:', response.status);
      console.error('❌ [AI Service] Error text:', errorText);

      this.logger.error(`Gemini API error ${response.status}: ${errorText}`);

      // User-friendly error messages based on status
      if (response.status === 429) {
        throw new Error(
          '⏳ Too many requests. Please try again in a few moments.',
        );
      } else if (response.status === 503) {
        throw new Error(
          '🔧 AI service is temporarily unavailable. Please try again later.',
        );
      } else if (response.status >= 500) {
        throw new Error(
          '⚠️ AI service error. Our team has been notified. Please try again later.',
        );
      } else {
        throw new Error(`❌ Unable to process your request. Please try again.`);
      }
    }
    console.log('✅ [AI Service] Response OK');

    console.log('📥 [AI Service] Parsing JSON response...');
    const geminiResponse = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
        finishReason?: string;
      }>;
      promptFeedback?: {
        blockReason?: string;
      };
    };
    console.log('✅ [AI Service] JSON parsed successfully');
    console.log('📦 [AI Service] Response structure:', {
      hasCandidates: !!geminiResponse.candidates,
      candidatesLength: geminiResponse.candidates?.length,
      hasPromptFeedback: !!geminiResponse.promptFeedback,
    });

    // Check if request was blocked
    if (geminiResponse.promptFeedback?.blockReason) {
      console.error('❌ [AI Service] Content blocked!');
      console.error(
        '❌ [AI Service] Block reason:',
        geminiResponse.promptFeedback.blockReason,
      );

      this.logger.error(
        `Gemini blocked request: ${geminiResponse.promptFeedback.blockReason}`,
      );
      throw new Error(
        '🚫 This content cannot be processed. Please upload a document or image with educational text content.',
      );
    }

    // Check finish reason
    const finishReason = geminiResponse.candidates?.[0]?.finishReason;
    console.log('🏁 [AI Service] Finish reason:', finishReason);

    if (finishReason && finishReason !== 'STOP') {
      console.warn('⚠️ [AI Service] Unexpected finish reason:', finishReason);
      this.logger.warn(`Gemini finish reason: ${finishReason}`);
      if (finishReason === 'SAFETY') {
        throw new Error(
          '🚫 This content was flagged by our safety filters. Please upload educational content only.',
        );
      }
      if (finishReason === 'RECITATION') {
        throw new Error(
          '©️ This content appears to be copyrighted material. Please upload original educational content.',
        );
      }
    }

    const rawText: string =
      geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    console.log(
      '📝 [AI Service] Extracted raw text (length:',
      rawText.length,
      ')',
    );

    if (!rawText) {
      console.error('❌ [AI Service] Empty response from Gemini');
      this.logger.error('Gemini returned empty response');
      throw new Error(
        '📄 No readable content found. Please ensure your file contains:\n\n• Clear, readable text\n• Educational content (notes, documents, textbooks)\n• Not just images of people or objects\n\nSupported: PDF, Word docs, PowerPoint, images with text.',
      );
    }
    console.log('✅ [AI Service] Raw text extracted successfully');

    console.log('🧹 [AI Service] Cleaning JSON response...');
    let cleaned = rawText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Additional cleaning for malformed JSON
    // Replace problematic characters that might break JSON
    cleaned = cleaned
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\r/g, '') // Remove carriage returns
      .replace(/\t/g, ' '); // Replace tabs with spaces

    console.log('✅ [AI Service] JSON cleaned (length:', cleaned.length, ')');
    console.log(
      '📋 [AI Service] Cleaned JSON preview:',
      cleaned.substring(0, 200) + '...',
    );

    try {
      console.log('🔍 [AI Service] Parsing JSON...');
      const result = JSON.parse(cleaned) as
        | SummaryResult
        | QuizResult
        | FlashcardsResult;

      console.log('✅ [AI Service] JSON parsed successfully!');
      console.log('📦 [AI Service] Result keys:', Object.keys(result));
      console.log('🎉 [AI Service] Generation complete!');

      return result;
    } catch (parseError) {
      console.error('❌ [AI Service] JSON parse error!');
      console.error('❌ [AI Service] Parse error:', parseError);
      console.error(
        '❌ [AI Service] Failed JSON (first 500 chars):',
        cleaned.slice(0, 500),
      );
      console.error(
        '❌ [AI Service] Failed JSON (last 200 chars):',
        cleaned.slice(-200),
      );

      this.logger.error(
        `Failed to parse Gemini JSON: ${cleaned.slice(0, 300)}`,
      );
      throw new Error(
        '⚠️ AI response format error. Please try uploading your document again.',
      );
    }
  }

  private resolveMimeType(mimeType: string, filename: string): string {
    if (SUPPORTED_MIME_TYPES.has(mimeType)) return mimeType;

    const ext = filename.split('.').pop()?.toLowerCase();
    const extMap: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      txt: 'text/plain',
      md: 'text/markdown',
      csv: 'text/csv',
      html: 'text/html',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };

    const resolved = extMap[ext ?? ''];
    if (resolved) {
      this.logger.warn(
        `Unknown MIME "${mimeType}", resolved to "${resolved}" via extension`,
      );
      return resolved;
    }

    this.logger.warn(
      `Cannot resolve MIME for "${filename}", using application/octet-stream`,
    );
    return 'application/octet-stream';
  }
}

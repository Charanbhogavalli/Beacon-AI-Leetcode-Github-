import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { generateWithFallback, isConfigured, SUPPORTED_MODELS } from './gemini.js';
import { buildPrompt } from './prompts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const PREFERRED_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// CORS Configuration (Allow Chrome extensions, localhost, and host domains)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing with payload size limits
app.use(express.json({ limit: '2mb' }));

// Rate limiting to protect against abuse
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down and try again in a moment.'
  }
});
app.use('/api/', apiLimiter);

// ----------------------------------------------------------------------------
// Health & Diagnostic Routes
// ----------------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  const configured = isConfigured();
  res.json({
    status: 'ok',
    service: 'Beacon AI Server',
    configured,
    activeModel: PREFERRED_MODEL,
    supportedModels: SUPPORTED_MODELS,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/models', (req, res) => {
  res.json({
    models: SUPPORTED_MODELS,
    default: PREFERRED_MODEL
  });
});

// ----------------------------------------------------------------------------
// AI Action Execution Route
// ----------------------------------------------------------------------------

app.post('/api/action', async (req, res) => {
  try {
    const { action, context, options } = req.body;

    if (!action || typeof action !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: action'
      });
    }

    if (!context || typeof context !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: context'
      });
    }

    // Sanitize and bound payload sizes to prevent runaway prompts
    const sanitizedContext = {
      ...context,
      body: typeof context.body === 'string' ? context.body.slice(0, 15000) : '',
      description: typeof context.description === 'string' ? context.description.slice(0, 15000) : '',
      diffSummary: typeof context.diffSummary === 'string' ? context.diffSummary.slice(0, 15000) : '',
      userCode: typeof context.userCode === 'string' ? context.userCode.slice(0, 10000) : ''
    };

    const { prompt, systemInstruction } = buildPrompt(action, {
      context: sanitizedContext,
      options: options || {}
    });

    const preferredModel = options?.model || PREFERRED_MODEL;
    const result = await generateWithFallback({
      prompt,
      systemInstruction,
      preferredModel,
      temperature: options?.temperature ?? 0.4
    });

    return res.json({
      success: true,
      text: result.text,
      modelUsed: result.modelUsed,
      finishReason: result.finishReason
    });
  } catch (error) {
    console.error('[Beacon Server] Action execution failed:', error.message);
    const statusCode = error.message.includes('not configured') ? 503 : 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// ----------------------------------------------------------------------------
// Contextual Chat Route
// ----------------------------------------------------------------------------

app.post('/api/chat', async (req, res) => {
  try {
    const { message, context, options, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and cannot be empty.'
      });
    }

    const sanitizedContext = context ? {
      ...context,
      body: typeof context.body === 'string' ? context.body.slice(0, 8000) : '',
      description: typeof context.description === 'string' ? context.description.slice(0, 8000) : '',
      userCode: typeof context.userCode === 'string' ? context.userCode.slice(0, 5000) : ''
    } : {};

    const safeHistory = Array.isArray(history)
      ? history.slice(-10).map(item => ({
          role: item.role === 'user' ? 'user' : 'model',
          content: String(item.content || '').slice(0, 2000)
        }))
      : [];

    const { prompt, systemInstruction } = buildPrompt('chat', {
      context: sanitizedContext,
      options: options || {},
      userMessage: message.trim().slice(0, 3000),
      history: safeHistory
    });

    const preferredModel = options?.model || PREFERRED_MODEL;
    const result = await generateWithFallback({
      prompt,
      systemInstruction,
      preferredModel,
      temperature: options?.temperature ?? 0.6
    });

    return res.json({
      success: true,
      text: result.text,
      modelUsed: result.modelUsed,
      finishReason: result.finishReason
    });
  } catch (error) {
    console.error('[Beacon Server] Chat execution failed:', error.message);
    const statusCode = error.message.includes('not configured') ? 503 : 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Beacon Server] Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'An internal server error occurred.'
  });
});

const isMainModule = process.argv[1] && (
  process.argv[1] === fileURLToPath(import.meta.url) ||
  process.argv[1].endsWith('server.js')
);

if (isMainModule && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🟢 Beacon AI Server running on http://localhost:${PORT}`);
    console.log(`🔑 Gemini Configured: ${isConfigured() ? 'YES' : 'NO (Add GEMINI_API_KEY to server/.env)'}`);
    console.log(`🤖 Active Model: ${PREFERRED_MODEL}`);
    console.log(`=================================================\n`);
  });
}

export { app, PORT };

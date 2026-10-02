import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processGeminiIntakeTurn, processStructuredConversion } from './src/server/geminiIntake.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startDocGenieServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '5mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    const isGeminiReady = Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
      process.env.GEMINI_API_KEY.trim().length > 0
    );

    res.json({
      status: 'ok',
      service: 'DocGenie AI OPD Engine',
      geminiActive: isGeminiReady,
      timestamp: new Date().toISOString(),
    });
  });

  // Configured history sections
  app.get('/api/intake/config', (_req, res) => {
    res.json({
      sections: [
        { id: 'chief_complaint', title: 'Chief Complaint', stepNumber: 1 },
        { id: 'present_illness', title: 'History of Present Illness', stepNumber: 2 },
        { id: 'associated_symptoms', title: 'Associated Symptoms', stepNumber: 3 },
        { id: 'medical_history', title: 'Past Medical History', stepNumber: 4 },
        { id: 'medications_allergies', title: 'Medications & Allergies', stepNumber: 5 },
        { id: 'family_social_history', title: 'Family & Social History', stepNumber: 6 },
      ],
      model: 'gemini-3.8-flash',
    });
  });

  // Server-side Gemini Clinical Intake Turn
  app.post('/api/intake/turn', async (req, res) => {
    try {
      const payload = req.body;
      if (!payload || !payload.patient || !payload.currentSectionId) {
        return res.status(400).json({ error: 'Missing required fields in intake turn payload' });
      }

      const intakeResponse = await processGeminiIntakeTurn(payload);
      return res.json(intakeResponse);
    } catch (err: any) {
      console.error('Error in /api/intake/turn:', err);
      return res.status(500).json({
        error: 'Clinical intake processing encountered an unexpected issue',
        details: err?.message,
      });
    }
  });

  // Server-side Conversion to Validated Structured JSON
  app.post('/api/intake/convert', async (req, res) => {
    try {
      const payload = req.body;
      if (!payload || !payload.patient) {
        return res.status(400).json({ error: 'Missing required patient data in conversion payload' });
      }

      const structuredRecord = await processStructuredConversion(payload);
      return res.json(structuredRecord);
    } catch (err: any) {
      console.error('Error in /api/intake/convert:', err);
      return res.status(500).json({
        error: 'Conversion to structured clinical JSON failed',
        details: err?.message,
      });
    }
  });

  // Vite integration: middleware mode in dev, static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DocGenie Server with Gemini Intake API running on http://0.0.0.0:${PORT}`);
  });
}

startDocGenieServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

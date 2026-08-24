const express = require('express');
const { z } = require('zod');
const { GoogleGenAI } = require('@google/genai');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Initialize Gemini client if GEMINI_API_KEY is configured in .env
const apiKey = process.env.GEMINI_API_KEY;
let ai = null;
if (apiKey && apiKey.trim().length > 5) {
  try {
    ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI client:', err.message);
  }
}

// -------------------------------------------------------------
// 1. AI Natural Language Expense Parser (/api/ai/parse-prompt)
// -------------------------------------------------------------
router.post('/parse-prompt', async (req, res) => {
  try {
    const schema = z.object({
      prompt: z.string().min(2, 'Prompt is too short'),
      members: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { prompt, members = [] } = parsed.data;

    // Smart Local NLP Extraction
    let parsedDescription = prompt;
    let parsedAmount = 0;
    let parsedCategory = 'general';
    let parsedPaidBy = null;

    // Extract numerical amount
    const amountMatch = prompt.match(/(?:₹|\$|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)/i);
    if (amountMatch) {
      parsedAmount = parseFloat(amountMatch[1]);
    }

    // Extract category keywords
    const lower = prompt.toLowerCase();
    if (lower.includes('dinner') || lower.includes('lunch') || lower.includes('food') || lower.includes('cafe') || lower.includes('restaurant') || lower.includes('pizza') || lower.includes('burger')) {
      parsedCategory = 'food';
    } else if (lower.includes('taxi') || lower.includes('cab') || lower.includes('flight') || lower.includes('uber') || lower.includes('ola') || lower.includes('travel') || lower.includes('bus') || lower.includes('train')) {
      parsedCategory = 'travel';
    } else if (lower.includes('hotel') || lower.includes('stay') || lower.includes('airbnb') || lower.includes('resort') || lower.includes('room')) {
      parsedCategory = 'stay';
    } else if (lower.includes('shopping') || lower.includes('mall') || lower.includes('clothes') || lower.includes('amazon')) {
      parsedCategory = 'shopping';
    } else if (lower.includes('electricity') || lower.includes('wifi') || lower.includes('internet') || lower.includes('bill') || lower.includes('rent')) {
      parsedCategory = 'utilities';
    }

    // Match paid_by member name
    if (members.length > 0) {
      for (const m of members) {
        if (m.name && lower.includes(m.name.toLowerCase())) {
          parsedPaidBy = m.id;
          break;
        }
      }
    }

    // Clean description
    parsedDescription = prompt.replace(/(paid|for|rs\.?|inr|₹|\d+(\.\d{1,2})?)/gi, '').trim();
    if (!parsedDescription || parsedDescription.length < 2) {
      parsedDescription = prompt;
    }

    // Gemini API if key is present
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Parse this natural language expense prompt into JSON:
Prompt: "${prompt}"
Members: ${JSON.stringify(members)}

Return JSON object:
{
  "description": string,
  "amount": number,
  "category": "general" | "food" | "travel" | "stay" | "shopping" | "utilities",
  "paidById": number or null
}`,
        });

        const responseText = response.text || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const aiData = JSON.parse(jsonMatch[0]);
          return res.json({
            description: aiData.description || parsedDescription,
            amount: aiData.amount || parsedAmount,
            category: aiData.category || parsedCategory,
            paidBy: aiData.paidById || parsedPaidBy,
            aiProcessed: true,
          });
        }
      } catch (aiErr) {
        console.warn('Gemini AI prompt parse fallback:', aiErr.message);
      }
    }

    res.json({
      description: parsedDescription,
      amount: parsedAmount,
      category: parsedCategory,
      paidBy: parsedPaidBy,
      aiProcessed: false,
    });
  } catch (err) {
    console.error('Parse prompt error:', err);
    res.status(500).json({ error: 'Failed to parse prompt' });
  }
});

// -------------------------------------------------------------
// 2. AI Receipt Parser (/api/ai/parse-receipt)
// -------------------------------------------------------------
router.post('/parse-receipt', async (req, res) => {
  try {
    const { receiptText } = req.body;
    if (!receiptText || typeof receiptText !== 'string') {
      return res.status(400).json({ error: 'Receipt text is required' });
    }

    const lines = receiptText.split('\n').map((l) => l.trim()).filter(Boolean);
    const merchant = lines[0] || 'Store Expense';
    const numbers = [...receiptText.matchAll(/(\d+\.\d{2})/g)].map((m) => parseFloat(m[1]));
    const totalAmount = numbers.length > 0 ? Math.max(...numbers) : 0;

    let category = 'general';
    const lowerText = receiptText.toLowerCase();
    if (lowerText.includes('total') || lowerText.includes('tax') || lowerText.includes('food') || lowerText.includes('restaurant')) {
      category = 'food';
    }

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Parse this receipt text into JSON:
"${receiptText}"

Return JSON:
{
  "merchant": string,
  "amount": number,
  "category": "general" | "food" | "travel" | "stay" | "shopping" | "utilities"
}`,
        });

        const jsonMatch = (response.text || '').match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          return res.json({
            merchant: data.merchant || merchant,
            amount: data.amount || totalAmount,
            category: data.category || category,
            summary: 'Receipt parsed via Gemini AI',
          });
        }
      } catch (err) {
        console.warn('Gemini receipt parse fallback:', err.message);
      }
    }

    res.json({
      merchant,
      amount: totalAmount,
      category,
      summary: 'Receipt parsed successfully',
    });
  } catch (err) {
    console.error('Parse receipt error:', err);
    res.status(500).json({ error: 'Failed to parse receipt' });
  }
});

// -------------------------------------------------------------
// 3. AI Group Insights & Financial Assistant (/api/ai/insights/:groupId)
// -------------------------------------------------------------
router.get('/insights/:groupId', async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    if (!groupId) {
      return res.status(400).json({ error: 'Invalid group ID' });
    }

    const expenses = db
      .prepare('SELECT description, amount, category, paid_by FROM expenses WHERE group_id = ?')
      .all(groupId);

    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const categoryCounts = {};
    expenses.forEach((e) => {
      const cat = e.category || 'general';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + Number(e.amount);
    });

    let topCategory = 'general';
    let maxCatAmount = 0;
    Object.entries(categoryCounts).forEach(([cat, amt]) => {
      if (amt > maxCatAmount) {
        maxCatAmount = amt;
        topCategory = cat;
      }
    });

    const insights = [
      `Total group expenditure is ₹${totalSpent.toLocaleString('en-IN')}.`,
      `Top spending category is ${topCategory.toUpperCase()} with ₹${maxCatAmount.toLocaleString('en-IN')} recorded.`,
      `Debt settlement paths have been simplified to minimize overall transaction counts.`,
    ];

    if (ai && expenses.length > 0) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Provide 3 short, professional financial insights for this expense group:
Total Spent: ₹${totalSpent}
Expenses Count: ${expenses.length}
Categories: ${JSON.stringify(categoryCounts)}

Return JSON object:
{ "insights": ["Insight 1", "Insight 2", "Insight 3"] }`,
        });

        const text = response.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          if (data.insights && Array.isArray(data.insights)) {
            return res.json({ insights: data.insights, totalSpent, categoryCounts });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API call fallback to local insights:', geminiErr.message);
      }
    }

    res.json({ insights, totalSpent, categoryCounts });
  } catch (err) {
    console.error('AI Insights Error:', err);
    res.status(500).json({ error: 'Could not generate insights', details: err.message });
  }
});

module.exports = router;

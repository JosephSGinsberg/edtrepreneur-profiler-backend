const express = require('express');
const router = express.Router();
const axios = require('axios');
const Assessment = require('../models/Assessment');

// AI-powered learner profiler
router.post('/analyze', async (req, res) => {
  try {
    const { story, goals, motivations, learningStyle } = req.body;

    const inputText = `
    Story: ${story}
    Goals: ${goals}
    Motivations: ${motivations}
    Learning Style: ${learningStyle}
    `;

    // Use the correct Hugging Face router endpoint
    const HF_URL = 'https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn';
    const HF_KEY = process.env.HF_API_KEY;

    if (!HF_KEY) {
      return res.status(500).json({ success: false, error: 'Missing HF_API_KEY in environment' });
    }

    // Send request to Hugging Face API
    const response = await axios.post(
      HF_URL,
      { inputs: inputText },
      {
        headers: {
          Authorization: `Bearer ${HF_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );

    const aiSummary =
      response.data?.[0]?.summary_text ||
      response.data?.generated_text ||
      'AI summary unavailable';

    const newProfile = await Assessment.create({
      story,
      goals,
      motivations,
      learningStyle,
      aiAnalysis: {
        profileSummary: aiSummary,
        learnerArchetype: 'Creative Builder',
        strengthAreas: ['Ideation', 'Empathy'],
        growthAreas: ['Execution', 'Financial Literacy']
      }
    });

    res.json({
      success: true,
      profile: newProfile
    });
  } catch (err) {
    console.error('❌ AI Analysis Error:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      error: err.response?.data?.error || err.message
    });
  }
});

module.exports = router;

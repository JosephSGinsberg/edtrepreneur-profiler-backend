const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  story: String,
  goals: String,
  motivations: String,
  learningStyle: String,
  aiAnalysis: {
    profileSummary: String,
    learnerArchetype: String,
    strengthAreas: [String],
    growthAreas: [String],
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Assessment', AssessmentSchema);

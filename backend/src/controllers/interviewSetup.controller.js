// Interview Setup Wizard Controller - handles multi-step interview setup
const InterviewSetupService = require('../services/interviewSetup.service');
const { catchAsync } = require('../utils/asyncHandler');

exports.startWizard = catchAsync(async (req, res) => {
  const { id: userId } = req.user;

  // Check if user has a verified candidate profile
  const profile = await InterviewSetupService.checkProfileReadiness(userId);

  res.json({
    data: {
      profileReady: profile.exists && profile.isVerified,
      profile: profile.profile,
      missingFields: profile.missingFields,
      canProceed: profile.exists && profile.isVerified,
    },
  });
});

exports.validateStep = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const { step, data } = req.body;

  const validation = await InterviewSetupService.validateStep(userId, step, data);

  res.json({ data: validation });
});

exports.createInterviewSession = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const config = req.body;

  const session = await InterviewSetupService.createInterviewSession(userId, config);

  res.status(201).json({ data: session });
});

exports.getInterviewSession = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const { sessionId } = req.params;

  const session = await InterviewSetupService.getInterviewSession(userId, sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Interview session not found' });
  }

  res.json({ data: session });
});

exports.getUserInterviewSessions = catchAsync(async (req, res) => {
  const { id: userId } = req.user;

  const sessions = await InterviewSetupService.getUserSessions(userId);

  res.json({ data: sessions });
});

exports.updateInterviewSession = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const { sessionId } = req.params;
  const updates = req.body;

  const session = await InterviewSetupService.updateSession(userId, sessionId, updates);

  res.json({ data: session });
});

exports.deleteInterviewSession = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const { sessionId } = req.params;

  await InterviewSetupService.deleteSession(userId, sessionId);

  res.json({ message: 'Interview session deleted' });
});

exports.getWizardOptions = catchAsync(async (req, res) => {
  const options = await InterviewSetupService.getWizardOptions();
  res.json({ data: options });
});
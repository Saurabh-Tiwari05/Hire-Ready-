// Resume Controller - handles upload, parsing, AI analysis, and profile creation
const ResumeUploadService = require("../services/resumeUpload.service");
const ResumeParserService = require("../services/resumeParser.service");
const GeminiResumeAnalysisService = require("../services/geminiResumeAnalysis.service");
const CandidateProfileService = require("../services/candidateProfile.service");
const { catchAsync } = require("../utils/asyncHandler");
const fs = require("fs").promises;

exports.uploadResume = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  console.info("[RESUME] Upload started", { userId });

  if (!req.file) {
    return res.status(400).json({ error: "Resume file is required" });
  }

  try {
    // Process upload
    const resume = await ResumeUploadService.processResumeUpload(
      userId,
      req.file,
      req.body.title || "Resume",
    );
    console.info("[RESUME] Upload completed", { resumeId: resume.id, userId });

    res.status(201).json({
      data: { resume },
      message: "Resume uploaded successfully",
    });
  } catch (error) {
    // Clean up file on error
    try {
      await fs.unlink(req.file.path);
    } catch (e) {
      console.warn("Failed to cleanup file:", e.message);
    }
    throw error;
  }
});

exports.parseResume = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const { resumeId } = req.params;

  const resume = await ResumeUploadService.getResumeById(userId, resumeId);

  if (!resume) {
    return res.status(404).json({ error: "Resume not found" });
  }

  try {
    console.info("[RESUME] Parse started", { resumeId, userId });
    console.info("[RESUME] File path", {
      resumeId,
      filePath: resume.file_path,
    });
    console.info("[RESUME] Extracting resume text", { resumeId });
    // Extract text from file
    const rawText = await ResumeParserService.parseResume(
      resume.file_path,
      resume.mime_type,
    );
    const cleanedText = ResumeParserService.cleanText(rawText);
    if (!cleanedText) {
      const error = new Error(
        "Unable to extract text from this PDF. Please upload a text-based PDF.",
      );
      error.statusCode = 422;
      throw error;
    }
    console.info("[RESUME] Extracted characters", {
      resumeId,
      characters: cleanedText.length,
    });
    const sections = ResumeParserService.extractSections(cleanedText);

    // Update resume with parsed data
    const parsedData = {
      rawText: rawText.substring(0, 50000), // Limit stored text
      cleanedText: cleanedText.substring(0, 50000),
      sections,
      parsedAt: new Date().toISOString(),
    };

    await resume.update({ parsed_data: parsedData });
    console.info("[RESUME] Parsing completed", { resumeId });

    res.json({
      data: {
        parsedData: {
          textLength: cleanedText.length,
          sections: Object.keys(sections).reduce((acc, key) => {
            acc[key] = Array.isArray(sections[key])
              ? sections[key].length
              : sections[key]
                ? 1
                : 0;
            return acc;
          }, {}),
          preview: cleanedText.substring(0, 500),
        },
      },
      message: "Resume parsed successfully",
    });
  } catch (error) {
    console.error("Parse error:", error);
    res
      .status(error.statusCode || 500)
      .json({ error: error.message || "Failed to parse resume" });
  }
});

exports.analyzeResume = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const { resumeId } = req.params;
  const { targetRole, targetCompany, experienceLevel } = req.body;

  const resume = await ResumeUploadService.getResumeById(userId, resumeId);

  if (!resume) {
    return res.status(404).json({ error: "Resume not found" });
  }

  if (!resume.parsed_data?.cleanedText) {
    return res.status(400).json({
      error: "Resume not parsed yet. Call parse endpoint first.",
    });
  }

  try {
    console.info("[AI] Starting Gemini analysis", { resumeId, userId });

    // Analyze with Gemini
    const analysis = await GeminiResumeAnalysisService.analyzeResume(
      resume.parsed_data.cleanedText,
      { targetRole, targetCompany, experienceLevel },
    );

    console.info("[AI] Gemini response received", { resumeId });

    // Create candidate profile from analysis
    const profile = await CandidateProfileService.createOrUpdateProfile(
      userId,
      analysis,
      resumeId,
    );

    if (!profile) {
      throw new Error(
        "Candidate profile could not be saved because the user no longer exists.",
      );
    }

    console.info("[AI] Candidate profile saved", {
      resumeId,
      profileId: profile.id,
    });

    // Update resume with analysis reference
    await resume.update({
      parsed_data: {
        ...resume.parsed_data,
        analysis: {
          ...analysis.analysis,
          analyzedAt: new Date().toISOString(),
        },
      },
    });

    console.info("[RESUME] Analysis completed", { resumeId });

    res.json({
      data: {
        profile,
        analysis: analysis.analysis,
      },
      message: "Resume analyzed and candidate profile created",
    });
  } catch (error) {
    console.error("Analysis error:", error);

    res
      .status(error.statusCode || 502)
      .json({ error: error.message || "Failed to analyze resume" });
  }
});

exports.getResume = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const { resumeId } = req.params;

  const resume = resumeId
    ? await ResumeUploadService.getResumeById(userId, resumeId)
    : await ResumeUploadService.getCurrentResume(userId);

  if (!resume) {
    return res.status(404).json({ error: "Resume not found" });
  }

  res.json({ data: { resume: resume.toJSON() } });
});

exports.getAllResumes = catchAsync(async (req, res) => {
  const { id: userId } = req.user;

  const resumes = await ResumeUploadService.getUserResumes(userId);
  res.json({ data: { resumes: resumes.map((r) => r.toJSON()) } });
});

exports.deleteResume = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const { resumeId } = req.params;

  await ResumeUploadService.deleteResume(userId, resumeId);
  res.json({ message: "Resume deleted successfully" });
});

exports.setCurrentResume = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const { resumeId } = req.params;

  const resume = await ResumeUploadService.setCurrentResume(userId, resumeId);
  res.json({ data: { resume }, message: "Current resume updated" });
});

exports.getCandidateProfile = catchAsync(async (req, res) => {
  const { id: userId } = req.user;

  const profile = await CandidateProfileService.getProfileByUserId(userId);
  if (!profile) {
    return res.status(404).json({ error: "Candidate profile not found" });
  }

  res.json({ data: { profile } });
});

exports.updateCandidateProfile = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const updates = req.body;

  const profile = await CandidateProfileService.updateProfile(userId, updates);
  res.json({ data: { profile }, message: "Profile updated" });
});

exports.verifyCandidateProfile = catchAsync(async (req, res) => {
  const { id: userId } = req.user;

  const profile = await CandidateProfileService.verifyProfile(userId);
  res.json({ data: { profile }, message: "Profile verified" });
});

exports.getProfileCompletionStatus = catchAsync(async (req, res) => {
  const { id: userId } = req.user;

  const status = await CandidateProfileService.getCompletionStatus(userId);
  res.json({ data: status });
});

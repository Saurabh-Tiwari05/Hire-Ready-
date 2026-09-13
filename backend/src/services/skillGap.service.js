// SkillGapService - analyzes skill gaps between candidate and target roles
const CareerRepository = require('../repositories/career.repository');

class SkillGapService {
  /**
   * Analyze skill gaps for a user
   * @param {Object} candidateProfile - Resume-parsed candidate profile
   * @param {Array} targetRoles - Target roles to analyze against
   * @param {Object} interviewScores - Historical interview scores
   */
  async analyzeSkillGaps(candidateProfile, targetRoles, interviewScores) {
    const currentSkills = this._extractCurrentSkills(candidateProfile);
    const requiredSkills = this._getRequiredSkillsForRoles(targetRoles);

    const gaps = this._identifyGaps(currentSkills, requiredSkills);
    const priorityGaps = this._prioritizeGaps(gaps, interviewScores);

    return priorityGaps.map(gap => ({
      skillName: gap.skill,
      category: this._categorizeSkill(gap.skill),
      currentLevel: this._estimateSkillLevel(currentSkills, gap.skill),
      requiredLevel: gap.requiredLevel,
      priority: this._calculatePriority(gap, interviewScores),
      recommendedResources: this._getResourcesForSkill(gap.skill),
      relatedToRoles: gap.relatedRoles,
      relatedToCompanies: gap.relatedCompanies,
    }));
  }

  /**
   * Store skill gaps in database
   */
  async storeSkillGaps(userId, gaps) {
    // Clear existing gaps
    await CareerRepository.deleteSkillGapsByUserId(userId);

    // Store new gaps
    const formattedGaps = gaps.map(g => ({
      user_id: userId,
      skill_name: g.skillName,
      category: g.category,
      current_level: g.currentLevel,
      required_level: g.requiredLevel,
      priority: g.priority,
      recommended_resources: g.recommendedResources,
      related_to_roles: g.relatedToRoles,
      related_to_companies: g.relatedToCompanies,
    }));

    return CareerRepository.bulkCreateSkillGaps(formattedGaps);
  }

  /**
   * Extract current skills from candidate profile
   */
  _extractCurrentSkills(candidateProfile) {
    const skills = [];
    const allSkills = candidateProfile.skills || {};

    // Flatten all skill categories
    Object.values(allSkills).forEach(arr => {
      if (Array.isArray(arr)) skills.push(...arr);
    });

    // Extract technologies from experience
    const experience = candidateProfile.experience || [];
    experience.forEach(exp => {
      if (exp.technologies) {
        skills.push(...exp.technologies);
      }
    });

    return [...new Set(skills.map(s => s.toLowerCase()))];
  }

  /**
   * Get required skills for target roles
   */
  _getRequiredSkillsForRoles(targetRoles) {
    const roleSkillMap = {
      'Backend Developer': ['node.js', 'python', 'java', 'sql', 'postgresql', 'mongodb', 'redis', 'docker', 'api design', 'microservices', 'jwt', 'rest'],
      'Frontend Developer': ['react', 'vue', 'angular', 'javascript', 'typescript', 'html/css', 'state management', 'rest api'],
      'Full Stack Developer': ['react', 'node.js', 'javascript', 'typescript', 'sql', 'mongodb', 'docker', 'rest api', 'jwt'],
      'DevOps Engineer': ['docker', 'kubernetes', 'aws', 'ci/cd', 'terraform', 'linux', 'monitoring', 'jenkins'],
      'Data Engineer': ['python', 'sql', 'spark', 'kafka', 'aws', 'data warehousing', 'etl'],
      'Software Engineer': ['data structures', 'algorithms', 'system design', 'coding'],
      'Cloud Engineer': ['aws', 'gcp', 'azure', 'docker', 'kubernetes', 'infrastructure as code'],
      'Mobile Developer': ['react native', 'flutter', 'android', 'ios', 'mobile architecture'],
    };

    const roles = targetRoles && targetRoles.length > 0 ? targetRoles : ['Backend Developer', 'Full Stack Developer', 'Software Engineer'];

    const skills = [];
    roles.forEach(role => {
      const roleSkills = roleSkillMap[role] || roleSkillMap['Software Engineer'];
      skills.push(...roleSkills);
    });

    return [...new Set(skills)];
  }

  /**
   * Identify which skills are missing or weak
   */
  _identifyGaps(currentSkills, requiredSkills) {
    return requiredSkills.map(skill => {
      const isPresent = currentSkills.includes(skill.toLowerCase());
      const relatedRoles = this._findRelatedRoles(skill);
      return {
        skill,
        isPresent,
        requiredLevel: isPresent ? 4 : 3,
        relatedRoles,
        relatedCompanies: this._findRelatedCompanies(skill),
      };
    }).filter(gap => !gap.isPresent || gap.requiredLevel > 3);
  }

  /**
   * Prioritize skill gaps based on interview performance
   */
  _prioritizeGaps(gaps, interviewScores) {
    return gaps.sort((a, b) => {
      const aPriority = this._calculatePriority(a, interviewScores);
      const bPriority = this._calculatePriority(b, interviewScores);
      if (aPriority === 'high' && bPriority !== 'high') return -1;
      if (bPriority === 'high' && aPriority !== 'high') return 1;
      if (aPriority === 'medium' && bPriority === 'low') return -1;
      if (bPriority === 'medium' && aPriority === 'low') return 1;
      return 0;
    });
  }

  _calculatePriority(gap, interviewScores) {
    const weakAreas = interviewScores?.weakAreas || [];
    const skillGaps = interviewScores?.skillGaps || [];

    if (weakAreas.includes(gap.skill) || skillGaps.includes(gap.skill)) {
      return 'high';
    }

    const commonRoleSkills = ['system design', 'database', 'operating systems', 'data structures', 'sql', 'docker', 'aws'];
    if (commonRoleSkills.some(s => gap.skill.toLowerCase().includes(s))) {
      return 'medium';
    }

    return 'low';
  }

  _estimateSkillLevel(currentSkills, skill) {
    const skillLower = skill.toLowerCase();
    if (currentSkills.includes(skillLower)) return Math.floor(Math.random() * 3) + 2; // 2-4
    return 1; // No experience
  }

  _categorizeSkill(skill) {
    const categories = {
      'technical': ['javascript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'typescript'],
      'database': ['sql', 'postgresql', 'mongodb', 'mysql', 'redis', 'elasticsearch'],
      'framework': ['react', 'vue', 'angular', 'node.js', 'express', 'spring', 'django', 'flask'],
      'devops': ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'jenkins', 'ci/cd'],
      'system_design': ['system design', 'scalability', 'load balancing', 'caching', 'microservices'],
      'soft': ['communication', 'leadership', 'teamwork', 'problem solving'],
      'language': ['html', 'css', 'html/css'],
      'behavioral': ['behavioral', 'hr'],
    };

    for (const [cat, skills] of Object.entries(categories)) {
      if (skills.some(s => skill.toLowerCase().includes(s))) {
        return cat;
      }
    }
    return 'technical';
  }

  _getResourcesForSkill(skill) {
    const resourceMap = {
      'docker': [
        { name: 'Docker Official Documentation', url: 'https://docs.docker.com/', type: 'documentation' },
        { name: 'Docker Mastery Course', url: 'https://kodekloud.com/courses/docker/', type: 'course' },
        { name: 'Docker Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=3c-iBXWCIjk', type: 'video' },
      ],
      'kubernetes': [
        { name: 'Kubernetes Documentation', url: 'https://kubernetes.io/docs/', type: 'documentation' },
        { name: 'Kubernetes Hands-on Course', url: 'https://kodekloud.com/courses/kubernetes/', type: 'course' },
      ],
      'system design': [
        { name: 'Grokking the System Design Interview', url: 'https://www.educative.io/courses/grokking-the-system-design-interview', type: 'course' },
        { name: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', type: 'repository' },
      ],
      'sql': [
        { name: 'SQLBolt', url: 'https://sqlbolt.com/', type: 'platform' },
        { name: 'Mode Analytics SQL Tutorial', url: 'https://mode.com/sql-tutorial/', type: 'course' },
      ],
      'aws': [
        { name: 'AWS Training', url: 'https://aws.amazon.com/training/', type: 'course' },
        { name: 'AWS Certified Solutions Architect', url: 'https://aws.amazon.com/certification/', type: 'course' },
      ],
    };

    return resourceMap[skill.toLowerCase()] || [];
  }

  _findRelatedRoles(skill) {
    const roleMap = {
      'docker': ['DevOps Engineer', 'Cloud Engineer', 'Backend Developer'],
      'kubernetes': ['DevOps Engineer', 'Cloud Engineer'],
      'aws': ['DevOps Engineer', 'Cloud Engineer', 'Data Engineer'],
      'system design': ['Software Engineer', 'Backend Developer'],
      'sql': ['Backend Developer', 'Data Engineer', 'Full Stack Developer'],
      'mongodb': ['Backend Developer', 'Full Stack Developer'],
      'redis': ['Backend Developer'],
      'jwt': ['Backend Developer'],
      'microservices': ['Backend Developer', 'Software Engineer'],
    };

    return roleMap[skill.toLowerCase()] || [];
  }

  _findRelatedCompanies(skill) {
    const companyMap = {
      'system design': ['Google', 'Meta', 'Amazon', 'Microsoft'],
      'docker': ['Amazon', 'Google', 'Microsoft', 'Adobe'],
      'kubernetes': ['Google', 'Amazon', 'Microsoft'],
      'aws': ['Amazon', 'Netflix', 'Capital One'],
    };

    return companyMap[skill.toLowerCase()] || [];
  }
}

module.exports = new SkillGapService();
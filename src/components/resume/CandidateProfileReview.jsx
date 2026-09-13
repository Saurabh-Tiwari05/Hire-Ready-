import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "../ui/GlassCard";
import Button from "../ui/Button";

const BASE = import.meta.env.VITE_API_URL || "/api";

const SKILL_CATEGORIES = [
  { key: 'technical', label: 'Technical Skills', color: '#00F2FF' },
  { key: 'frameworks', label: 'Frameworks', color: '#60A5FA' },
  { key: 'tools', label: 'Tools & Platforms', color: '#A78BFA' },
  { key: 'languages', label: 'Programming Languages', color: '#F472B6' },
  { key: 'soft', label: 'Soft Skills', color: '#34D399' },
];

export default function CandidateProfileReview({ profile, onSave, onCancel, editable = true }) {
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    if (profile) {
      setFormData({
        personal: {
          fullName: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          location: profile.location || '',
          linkedin: profile.linkedin_url || '',
          github: profile.github_url || '',
          portfolio: profile.portfolio_url || '',
        },
        summary: profile.summary || '',
        experience: profile.experience || [],
        education: profile.education || [],
        skills: profile.skills || {
          technical: [],
          frameworks: [],
          tools: [],
          languages: [],
          soft: [],
        },
        projects: profile.projects || [],
        certifications: profile.certifications || [],
        languages: profile.languages || [],
        analysis: profile.analysis || {},
      });
    }
  }, [profile]);

  const updateField = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateNestedField = (section, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = (section, item) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...(prev[section] || []), item],
    }));
  };

  const removeItem = (section, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  const addSkill = (category, skill) => {
    if (!skill.trim()) return;
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: [...new Set([...(prev.skills[category] || []), skill.trim()])],
      },
    }));
  };

  const removeSkill = (category, skill) => {
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].filter(s => s !== skill),
      },
    }));
  };

  const handleSave = async () => {
    if (!editable) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("hr_token");
      const response = await fetch(`${BASE}/resume/profile/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(await response.text());

      const data = await response.json();
      onSave?.(data.data.profile);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    try {
      const token = localStorage.getItem("hr_token");
      const response = await fetch(`${BASE}/resume/profile/me/verify`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(await response.text());

      const data = await response.json();
      onSave?.(data.data.profile);
    } catch (err) {
      console.error('Verify failed:', err);
      alert('Failed to verify profile: ' + err.message);
    }
  };

  if (!formData) {
    return (
      <GlassCard className="p-8 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent mx-auto" />
        <p className="mt-4 text-white/60">Loading profile...</p>
      </GlassCard>
    );
  }

  const tabs = [
    { id: 'personal', label: 'Personal', icon: '👤' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'skills', label: 'Skills', icon: '🛠️' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'analysis', label: 'AI Analysis', icon: '🤖' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Candidate Profile</h2>
          <p className="text-white/60">Review and edit your parsed resume data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          {editable && (
            <>
              {!profile?.is_verified && (
                <Button variant="neon" onClick={handleVerify}>
                  Verify Profile
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Verification Status */}
      {profile && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                profile.is_verified ? 'bg-emerald-400/20' : 'bg-amber-400/20'
              }`}>
                {profile.is_verified ? (
                  <svg className="h-5 w-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium text-white">
                  {profile.is_verified ? 'Profile Verified' : 'Profile Pending Verification'}
                </p>
                <p className="text-sm text-white/60">
                  {profile.is_verified
                    ? 'Your profile has been reviewed and approved'
                    : 'Please review the information below and verify when ready'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-accent">{profile.analysis?.totalYearsExperience || 0}+</p>
              <p className="text-sm text-white/60">Years Experience</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 bg-white/5 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-accent text-bg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'personal' && (
            <PersonalInfoTab data={formData.personal} onChange={updateField.bind(null, 'personal')} editable={editable} />
          )}
          {activeTab === 'experience' && (
            <ExperienceTab
              data={formData.experience}
              onUpdate={updateNestedField.bind(null, 'experience')}
              onAdd={() => addItem('experience', { title: '', company: '', location: '', startDate: '', endDate: '', description: '', technologies: [], achievements: [] })}
              onRemove={removeItem.bind(null, 'experience')}
              editable={editable}
            />
          )}
          {activeTab === 'education' && (
            <EducationTab
              data={formData.education}
              onUpdate={updateNestedField.bind(null, 'education')}
              onAdd={() => addItem('education', { degree: '', field: '', institution: '', location: '', graduationYear: '', gpa: '', honors: [] })}
              onRemove={removeItem.bind(null, 'education')}
              editable={editable}
            />
          )}
          {activeTab === 'skills' && (
            <SkillsTab
              data={formData.skills}
              onAdd={addSkill}
              onRemove={removeSkill}
              editable={editable}
            />
          )}
          {activeTab === 'projects' && (
            <ProjectsTab
              data={formData.projects}
              onUpdate={updateNestedField.bind(null, 'projects')}
              onAdd={() => addItem('projects', { name: '', description: '', technologies: [], url: '', role: '' })}
              onRemove={removeItem.bind(null, 'projects')}
              editable={editable}
            />
          )}
          {activeTab === 'analysis' && (
            <AnalysisTab data={formData.analysis} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Sub-components for each tab
function PersonalInfoTab({ data, onChange, editable }) {
  const fields = [
    { key: 'fullName', label: 'Full Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone', type: 'tel' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'linkedin', label: 'LinkedIn', type: 'url' },
    { key: 'github', label: 'GitHub', type: 'url' },
    { key: 'portfolio', label: 'Portfolio', type: 'url' },
  ];

  return (
    <GlassCard className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(field => (
          <div key={field.key} className={field.key === 'fullName' ? 'md:col-span-2' : ''}>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/40 mb-1">
              {field.label}
            </label>
            <input
              type={field.type}
              value={data[field.key] || ''}
              onChange={e => onChange(field.key, e.target.value)}
              disabled={!editable}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none disabled:opacity-50"
            />
          </div>
        ))}
      </div>

      <div className="mt-6">
        <label className="block text-xs font-medium uppercase tracking-wider text-white/40 mb-1">
          Professional Summary
        </label>
        <textarea
          value={data.summary || ''}
          onChange={e => onChange('summary', e.target.value)}
          disabled={!editable}
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none disabled:opacity-50 resize-none"
        />
      </div>
    </GlassCard>
  );
}

function ExperienceTab({ data, onUpdate, onAdd, onRemove, editable }) {
  return (
    <GlassCard className="p-6">
      <div className="space-y-4">
        {data.map((exp, index) => (
          <motion.div
            key={exp.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    placeholder="Job Title"
                    value={exp.title || ''}
                    onChange={e => onUpdate(index, 'title', e.target.value)}
                    disabled={!editable}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none"
                  />
                  <input
                    placeholder="Company"
                    value={exp.company || ''}
                    onChange={e => onUpdate(index, 'company', e.target.value)}
                    disabled={!editable}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none"
                  />
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    placeholder="Location"
                    value={exp.location || ''}
                    onChange={e => onUpdate(index, 'location', e.target.value)}
                    disabled={!editable}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none"
                  />
                  <input
                    placeholder="Start (YYYY-MM)"
                    value={exp.startDate || ''}
                    onChange={e => onUpdate(index, 'startDate', e.target.value)}
                    disabled={!editable}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none"
                  />
                  <input
                    placeholder="End (YYYY-MM or Present)"
                    value={exp.endDate || ''}
                    onChange={e => onUpdate(index, 'endDate', e.target.value)}
                    disabled={!editable}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none"
                  />
                </div>
              </div>
              {editable && (
                <button
                  onClick={() => onRemove(index)}
                  className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  aria-label="Remove experience"
                >
                  ✕
                </button>
              )}
            </div>

            <textarea
              placeholder="Description"
              value={exp.description || ''}
              onChange={e => onUpdate(index, 'description', e.target.value)}
              disabled={!editable}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none resize-none"
            />

            <div className="mt-3">
              <label className="block text-xs font-medium text-white/40 mb-1">Technologies</label>
              <div className="flex flex-wrap gap-2">
                {exp.technologies?.map((tech, i) => (
                  <span key={i} className="px-2 py-1 text-xs rounded-full bg-accent/10 text-accent border border-accent/30 flex items-center gap-1">
                    {tech}
                    {editable && (
                      <button onClick={() => onUpdate(index, 'technologies', exp.technologies.filter((_, j) => j !== i))} className="hover:text-red-400">×</button>
                    )}
                  </span>
                ))}
                {editable && (
                  <AddTagInput onAdd={tech => onUpdate(index, 'technologies', [...(exp.technologies || []), tech])} />
                )}
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-white/40 mb-1">Achievements</label>
              <div className="space-y-1">
                {exp.achievements?.map((achievement, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={achievement}
                      onChange={e => onUpdate(index, 'achievements', exp.achievements.map((a, j) => j === i ? e.target.value : a))}
                      disabled={!editable}
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none"
                    />
                    {editable && (
                      <button onClick={() => onUpdate(index, 'achievements', exp.achievements.filter((_, j) => j !== i))} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">×</button>
                    )}
                  </div>
                ))}
                {editable && (
                  <button onClick={() => onUpdate(index, 'achievements', [...(exp.achievements || []), ''])} className="text-sm text-accent hover:underline">+ Add Achievement</button>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {editable && data.length < 10 && (
          <button onClick={onAdd} className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-white/60 hover:border-accent/50 hover:text-white transition-colors">
            + Add Experience
          </button>
        )}
      </div>
    </GlassCard>
  );
}

function EducationTab({ data, onUpdate, onAdd, onRemove, editable }) {
  return (
    <GlassCard className="p-6">
      <div className="space-y-4">
        {data.map((edu, index) => (
          <motion.div
            key={edu.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input placeholder="Degree" value={edu.degree || ''} onChange={e => onUpdate(index, 'degree', e.target.value)} disabled={!editable} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none" />
                <input placeholder="Field of Study" value={edu.field || ''} onChange={e => onUpdate(index, 'field', e.target.value)} disabled={!editable} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none" />
                <input placeholder="Institution" value={edu.institution || ''} onChange={e => onUpdate(index, 'institution', e.target.value)} disabled={!editable} className="md:col-span-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none" />
                <input placeholder="Location" value={edu.location || ''} onChange={e => onUpdate(index, 'location', e.target.value)} disabled={!editable} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none" />
                <input placeholder="Graduation Year" value={edu.graduationYear || ''} onChange={e => onUpdate(index, 'graduationYear', e.target.value)} disabled={!editable} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none" />
                <input placeholder="GPA" value={edu.gpa || ''} onChange={e => onUpdate(index, 'gpa', e.target.value)} disabled={!editable} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none" />
              </div>
              {editable && (
                <button onClick={() => onRemove(index)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">✕</button>
              )}
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-white/40 mb-1">Honors</label>
              <div className="flex flex-wrap gap-2">
                {edu.honors?.map((honor, i) => (
                  <span key={i} className="px-2 py-1 text-xs rounded-full bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/30 flex items-center gap-1">
                    {honor}
                    {editable && <button onClick={() => onUpdate(index, 'honors', edu.honors.filter((_, j) => j !== i))} className="hover:text-red-400">×</button>}
                  </span>
                ))}
                {editable && <AddTagInput onAdd={h => onUpdate(index, 'honors', [...(edu.honors || []), h])} />}
              </div>
            </div>
          </motion.div>
        ))}

        {editable && data.length < 5 && (
          <button onClick={onAdd} className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-white/60 hover:border-accent/50 hover:text-white transition-colors">
            + Add Education
          </button>
        )}
      </div>
    </GlassCard>
  );
}

function SkillsTab({ data, onAdd, onRemove, editable }) {
  return (
    <GlassCard className="p-6">
      <div className="space-y-6">
        {SKILL_CATEGORIES.map(category => (
          <div key={category.key}>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/40 mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
              {category.label}
            </label>
            <div className="flex flex-wrap gap-2">
              {data[category.key]?.map(skill => (
                <span key={skill} className="px-3 py-1 text-sm rounded-full border flex items-center gap-1"
                  style={{
                    backgroundColor: category.color + '15',
                    borderColor: category.color + '40',
                    color: category.color,
                  }}
                >
                  {skill}
                  {editable && <button onClick={() => onRemove(category.key, skill)} className="hover:opacity-50">×</button>}
                </span>
              ))}
              {editable && <AddTagInput onAdd={skill => onAdd(category.key, skill)} placeholder={`Add ${category.label.toLowerCase()}`} />}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function ProjectsTab({ data, onUpdate, onAdd, onRemove, editable }) {
  return (
    <GlassCard className="p-6">
      <div className="space-y-4">
        {data.map((proj, index) => (
          <motion.div
            key={proj.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input placeholder="Project Name" value={proj.name || ''} onChange={e => onUpdate(index, 'name', e.target.value)} disabled={!editable} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none" />
                <input placeholder="URL" value={proj.url || ''} onChange={e => onUpdate(index, 'url', e.target.value)} disabled={!editable} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none" />
                <input placeholder="Your Role" value={proj.role || ''} onChange={e => onUpdate(index, 'role', e.target.value)} disabled={!editable} className="md:col-span-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none" />
              </div>
              {editable && <button onClick={() => onRemove(index)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">✕</button>}
            </div>

            <textarea placeholder="Description" value={proj.description || ''} onChange={e => onUpdate(index, 'description', e.target.value)} disabled={!editable} rows={2} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-accent/50 focus:outline-none resize-none" />

            <div className="mt-3">
              <label className="block text-xs font-medium text-white/40 mb-1">Technologies</label>
              <div className="flex flex-wrap gap-2">
                {proj.technologies?.map((tech, i) => (
                  <span key={i} className="px-2 py-1 text-xs rounded-full bg-accent/10 text-accent border border-accent/30 flex items-center gap-1">
                    {tech}
                    {editable && <button onClick={() => onUpdate(index, 'technologies', proj.technologies.filter((_, j) => j !== i))} className="hover:text-red-400">×</button>}
                  </span>
                ))}
                {editable && <AddTagInput onAdd={tech => onUpdate(index, 'technologies', [...(proj.technologies || []), tech])} />}
              </div>
            </div>
          </motion.div>
        ))}

        {editable && data.length < 10 && (
          <button onClick={onAdd} className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-white/60 hover:border-accent/50 hover:text-white transition-colors">
            + Add Project
          </button>
        )}
      </div>
    </GlassCard>
  );
}

function AnalysisTab({ data }) {
  const analysis = data || {};

  return (
    <GlassCard className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Seniority Level" value={analysis.seniorityLevel || 'Mid'} icon="📊" color="#60A5FA" />
        <StatCard label="Primary Role" value={analysis.primaryRole || '—'} icon="🎯" color="#A78BFA" />
        <StatCard label="Total Experience" value={`${analysis.totalYearsExperience || 0} years`} icon="📅" color="#34D399" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnalysisSection title="Strong Areas" items={analysis.strongAreas || []} color="#34D399" icon="✅" />
        <AnalysisSection title="Weak Areas" items={analysis.weakAreas || []} color="#F472B6" icon="⚠️" />
        <AnalysisSection title="Skill Gaps" items={analysis.skillGaps || []} color="#FBBF24" icon="📉" />
        <AnalysisSection title="Interview Focus Areas" items={analysis.interviewFocusAreas || []} color="#00F2FF" icon="🎯" />
        <AnalysisSection title="Recommended Roles" items={analysis.recommendedRoles || []} color="#A78BFA" icon="💼" />
      </div>
    </GlassCard>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">{label}</p>
          <p className="text-lg font-bold text-white">{value}</p>
        </div>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: '60%', backgroundColor: color }} />
      </div>
    </div>
  );
}

function AnalysisSection({ title, items, color, icon }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <span>{icon}</span>
        <h4 className="font-medium text-white">{title}</h4>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item, i) => (
            <span key={i} className="px-3 py-1 text-sm rounded-full border"
              style={{ backgroundColor: color + '15', borderColor: color + '40', color: color }}
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-white/40">None identified</span>
        )}
      </div>
    </div>
  );
}

function AddTagInput({ onAdd, placeholder = "Add..." }) {
  const [value, setValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim()) {
      onAdd(value.trim());
      setValue('');
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className="px-3 py-1 text-sm rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/30 focus:border-accent/50 focus:outline-none min-w-[120px]"
    />
  );
}

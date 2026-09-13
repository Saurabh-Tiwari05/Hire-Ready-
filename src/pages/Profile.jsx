import { useState, useEffect } from "react";
import PageTransition from "../components/ui/PageTransition";
import Navbar from "../components/ui/Navbar";
import SectionTitle from "../components/ui/SectionTitle";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";

const BASE = import.meta.env.VITE_API_URL || "/api";

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/30 transition-colors focus:border-accent/60 focus:outline-none";

const UPDATEABLE_FIELDS = new Set([
  "full_name",
  "college",
  "branch",
  "graduation_year",
  "linkedin_url",
  "github_url",
  "profile_picture_url",
  "skills",
  "target_companies",
  "preferred_role",
  "email_notifications",
  "notification_preferences",
]);

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-widest text-[var(--text-3)]">{label}</span>
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, checked, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-[var(--text-2)]">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onToggle(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-white/15"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

export default function Profile() {
    const [form, setForm] = useState({
    full_name: "",
    email: "",
    college: "",
    branch: "",
    graduation_year: "",
    linkedin_url: "",
    github_url: "",
    skills: [],
    target_companies: [],
    preferred_role: "",
    profile_picture_url: null,
    email_notifications: { resume_submission: true, interview_invite: true },
    notification_preferences: { email: true, push: false },
  });
  const [initialProfile, setInitialProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [profileInitialized, setProfileInitialized] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const normalizeSkills = (skills) => {
    if (Array.isArray(skills)) return skills;
    if (skills && typeof skills === "object") {
      // Flatten all category arrays into a single list for display
      return Object.values(skills).flat().filter(Boolean);
    }
    return [];
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("hr_token");
      if (!token) {
        // No token, initialize empty profile
        setForm({
          full_name: "",
          email: "",
          college: "",
          branch: "",
          graduation_year: "",
          linkedin_url: "",
          github_url: "",
          skills: [],
          target_companies: [],
          preferred_role: "",
          profile_picture_url: null,
          email_notifications: { resume_submission: true, interview_invite: true },
          notification_preferences: { email: true, push: false },
        });
        setInitialProfile(null);
        setProfileInitialized(true);
        return;
      }

      const res = await fetch(`${BASE}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 404) {
        // Profile doesn't exist yet - initialize with empty state
        setForm({
          full_name: "",
          email: "",
          college: "",
          branch: "",
          graduation_year: "",
          linkedin_url: "",
          github_url: "",
          skills: [],
          target_companies: [],
          preferred_role: "",
          profile_picture_url: null,
          email_notifications: { resume_submission: true, interview_invite: true },
          notification_preferences: { email: true, push: false },
        });
        setInitialProfile(null);
        setProfileInitialized(true);
        return;
      }

      if (!res.ok) {
        // Try to get profile from candidate profile endpoint
        try {
          const profileRes = await fetch(`${BASE}/resume/profile/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.data?.profile) {
              const mergedProfile = {
                ...profileData.data.profile,
                skills: normalizeSkills(profileData.data.profile.skills || []),
                target_companies: Array.isArray(profileData.data.profile.target_companies) ? profileData.data.profile.target_companies : [],
              };
              setForm(mergedProfile);
              setInitialProfile(mergedProfile);
              setProfileInitialized(true);
              return;
            }
          }
        } catch (e) {
          console.log('Failed to fetch candidate profile:', e);
        }

        // Fallback to original behavior
        throw new Error(await res.text());
      }

      const data = await res.json();
      if (data.data) {
        const profileData = {
          ...data.data,
          skills: normalizeSkills(data.data.skills),
          target_companies: Array.isArray(data.data.target_companies) ? data.data.target_companies : [],
        };
        setForm(profileData);
        setInitialProfile(profileData);

        // Try to fetch candidate profile to get additional fields
        try {
          const candidateRes = await fetch(`${BASE}/resume/profile/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (candidateRes.ok) {
            const candidateData = await candidateRes.json();
            if (candidateData.data?.profile) {
              // Merge candidate profile data with form data
              const merged = {
                ...profileData,
                ...candidateData.data.profile,
                // CandidateProfile stores skills by category (a JSON object), while
                // the account profile uses a flat array for this screen.
                skills: [...(profileData.skills || []), ...normalizeSkills(candidateData.data.profile.skills)].filter(Boolean),
                target_companies: [...(profileData.target_companies || []), ...(candidateData.data.profile.target_companies || [])].filter(Boolean),
              };
              setForm(merged);
            }
          }
        } catch (e) {
          console.log('Failed to fetch candidate profile:', e);
        }
        setProfileInitialized(true);
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    } finally {
      setProfileInitialized(true);
    }
  };

  const updateField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Only send fields allowed by the backend validation schema
      const updateData = {};
      for (const [key, value] of Object.entries(form)) {
        if (UPDATEABLE_FIELDS.has(key)) {
          updateData[key] = value;
        }
      }

      const res = await fetch(`${BASE}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("hr_token")}`,
        },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main" className="relative overflow-hidden bg-bg">
          <div className="section mx-auto max-w-5xl px-6">
            {/* header */}
            <div className="mb-12 flex items-center gap-6">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-xl font-black text-bg shadow-[0_0_40px_rgba(0,242,255,0.35)]">
                {form.profile_picture_url ? (
                  <img src={form.profile_picture_url} alt={form.full_name} className="h-full w-full rounded-full object-cover" />
                ) : (
                  (form.full_name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <h1 className="display-title text-3xl text-white md:text-4xl">Hello, {form.full_name || "Candidate"}</h1>
                <p className="mt-1 text-sm text-[var(--text-2)]">
                  {form.preferred_role || "Software Engineer"} · {form.college || ""} {form.branch || ""}
                </p>
              </div>
            </div>

            <SectionTitle
              title="Profile Settings"
              gradient={["Profile"]}
              subtitle="Manage your information, skills, and preferences."
              align="left"
            />

            <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Basic info */}
              <GlassCard className="p-7 lg:col-span-2">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Full Name">
                    <input className={inputCls} value={form.full_name || ""} onChange={(e) => updateField("full_name", e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <input className={inputCls} value={form.email || ""} readOnly onChange={(e) => updateField("email", e.target.value)} />
                  </Field>
                  <Field label="College">
                    <input className={inputCls} value={form.college || ""} onChange={(e) => updateField("college", e.target.value)} />
                  </Field>
                  <Field label="Branch">
                    <input className={inputCls} value={form.branch || ""} onChange={(e) => updateField("branch", e.target.value)} />
                  </Field>
                  <Field label="Graduation Year">
                    <input className={inputCls} value={form.graduation_year || ""} onChange={(e) => updateField("graduation_year", e.target.value)} />
                  </Field>
                  <Field label="Preferred Role">
                    <input className={inputCls} value={form.preferred_role || ""} onChange={(e) => updateField("preferred_role", e.target.value)} />
                  </Field>
                  <Field label="LinkedIn">
                    <input className={inputCls} value={form.linkedin_url || ""} onChange={(e) => updateField("linkedin_url", e.target.value)} />
                  </Field>
                  <Field label="GitHub">
                    <input className={inputCls} value={form.github_url || ""} onChange={(e) => updateField("github_url", e.target.value)} />
                  </Field>
                </div>
              </GlassCard>

              {/* Skills & Targets */}
              <GlassCard className="p-7">
                <h3 className="mb-4 text-sm font-semibold text-white">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {form.skills?.map((s) => (
                    <span key={s} className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">{s}</span>
                  ))}
                </div>
                <div className="mt-4">
                  <input className={inputCls} placeholder="Add a skill…" onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      updateField("skills", [...(form.skills || []), e.target.value.trim()]);
                      e.target.value = "";
                    }
                  }} />
                </div>

                <h3 className="mb-4 mt-8 text-sm font-semibold text-white">Target Companies</h3>
                <div className="flex flex-wrap gap-2">
                  {form.target_companies?.map((c) => (
                    <span key={c} className="rounded-full border border-[#a78bfa]/30 bg-[#a78bfa]/10 px-3 py-1 text-xs text-[#a78bfa]">{c}</span>
                  ))}
                </div>
                <div className="mt-4">
                  <input className={inputCls} placeholder="Add a company…" onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      updateField("target_companies", [...(form.target_companies || []), e.target.value.trim()]);
                      e.target.value = "";
                    }
                  }} />
                </div>
              </GlassCard>
            </div>

            {/* preferences */}
            <GlassCard className="mt-6 p-7">
              <h3 className="mb-6 text-sm font-semibold text-white">Preferences</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <ToggleRow
                  label="Email Notifications"
                  desc="Resume submissions & interview invites"
                  checked={form.email_notifications?.resume_submission}
                  onToggle={(v) => updateField("email_notifications", { ...form.email_notifications, resume_submission: v })}
                />
                <ToggleRow
                  label="Push Notifications"
                  desc="Browser notifications for results"
                  checked={form.notification_preferences?.push}
                  onToggle={(v) => updateField("notification_preferences", { ...form.notification_preferences, push: v })}
                />
              </div>
            </GlassCard>

            {/* actions */}
            <div className="mt-8 flex items-center justify-end gap-3">
              {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
              <Button variant="ghost" onClick={() => initialProfile && setForm(initialProfile)}>Reset</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
            </div>
          </div>
        </main>
      </PageTransition>
    </>
  );
}

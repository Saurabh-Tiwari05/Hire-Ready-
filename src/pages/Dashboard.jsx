import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/ui/Navbar";
import PageTransition from "../components/ui/PageTransition";
import SectionTitle from "../components/ui/SectionTitle";
import GlassCard from "../components/ui/GlassCard";
import Button from "../components/ui/Button";
import { Gauge, ProgressBar, AnimatedBar } from "../sections/Dashboard";

const BASE = import.meta.env.VITE_API_URL || "/api";

const STAGE_LABELS = {
  screening: "Screening",
  technical: "Technical",
  system_design: "System Design",
  behavioral: "Behavioral",
  final: "Final Round",
  offer: "Offer",
  rejected: "Rejected",
};

const STATUS_LABELS = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
};

const STATUS_COLORS = {
  scheduled: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  in_progress: "text-accent bg-accent/10 border-accent/20",
  completed: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
  rescheduled: "text-violet-400 bg-violet-400/10 border-violet-400/20",
};

const PRIORITY_COLORS = {
  low: "text-gray-400",
  medium: "text-amber-400",
  high: "text-orange-400",
  urgent: "text-red-400",
};

const TYPE_ICONS = {
  interview_scheduled: "📅",
  interview_reminder: "⏰",
  interview_completed: "✅",
  report_generated: "📊",
  resume_submitted: "📄",
  application_update: "🔄",
  system_announcement: "📢",
  achievement_unlocked: "🏆",
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("hr_token");
        if (!token) {
          throw new Error("Not authenticated");
        }

        const res = await fetch(`${BASE}/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Session expired. Please log in again.");
          }
          throw new Error(await res.text());
        }

        const json = await res.json();
        setData(json.data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("hr_token");
      await fetch(`${BASE}/dashboard/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setData((prev) => ({
        ...prev,
        latestNotifications: prev.latestNotifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
        stats: { ...prev.stats, unreadNotifications: Math.max(0, prev.stats.unreadNotifications - 1) },
      }));
    } catch (e) {
      console.error("Failed to mark notification read:", e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem("hr_token");
      await fetch(`${BASE}/dashboard/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setData((prev) => ({
        ...prev,
        latestNotifications: prev.latestNotifications.map((n) => ({ ...n, is_read: true })),
        stats: { ...prev.stats, unreadNotifications: 0 },
      }));
    } catch (e) {
      console.error("Failed to mark all read:", e);
    }
  };

  const handleArchiveNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem("hr_token");
      await fetch(`${BASE}/dashboard/notifications/${notificationId}/archive`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setData((prev) => ({
        ...prev,
        latestNotifications: prev.latestNotifications.filter((n) => n.id !== notificationId),
      }));
    } catch (e) {
      console.error("Failed to archive notification:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <PageTransition>
          <main id="main" className="relative overflow-hidden bg-bg">
            <div className="section mx-auto max-w-5xl px-6 pt-20">
              <GlassCard className="p-8 text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </GlassCard>
            </div>
          </main>
        </PageTransition>
      </>
    );
  }

  const { user, currentResume, stats, latestInterview, recentReports, latestNotifications, skillBreakdown, timeline, quickActions } = data;

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main" className="relative overflow-hidden bg-bg">
          <div className="section mx-auto max-w-6xl px-6">
            {/* Welcome Banner */}
            <GlassCard className="relative overflow-hidden p-6 glow" glow="#00F2FF" strong>
              <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-cyan-400/10" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-accent">Welcome back</p>
                  <h1 className="mt-1 display-title text-3xl text-white md:text-4xl">
                    Hello, <span className="text-gradient-cyan">{user?.full_name?.split(" ")[0] || "User"}</span>
                  </h1>
                  <p className="mt-2 text-sm text-white/60">
                    {user?.preferred_role ? `${user.preferred_role} · ` : ""}
                    {user?.college ? `${user.college}` : "Ready to ace your interviews"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-cyan-400 text-xl font-black text-bg shadow-[0_0_40px_rgba(0,242,255,0.35)]">
                    {user?.profile_picture_url ? (
                      <img src={user.profile_picture_url} alt={user.full_name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs uppercase tracking-widest text-white/40">Overall Score</p>
                    <p className="text-3xl font-bold text-white">{stats.averageScore || "—"}</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Stats Grid */}
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="Total Interviews" value={stats.totalInterviews} icon="🎯" color="#60A5FA" />
              <StatCard label="Completed" value={stats.completedInterviews} icon="✅" color="#34D399" />
              <StatCard label="Upcoming" value={stats.upcomingInterviews} icon="📅" color="#FBBF24" />
              <StatCard
                label="Notifications"
                value={stats.unreadNotifications}
                icon="🔔"
                color={stats.unreadNotifications > 0 ? "#F472B6" : "#6B7280"}
                highlight={stats.unreadNotifications > 0}
              />
            </div>

            {/* Main Content Grid */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column - Profile Summary & Current Resume */}
              <div className="lg:col-span-1 space-y-6">
                {/* Profile Summary */}
                <GlassCard className="p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/40">Profile Summary</h3>
                  <div className="space-y-4">
                    <ProfileRow label="Email" value={user?.email} />
                    <ProfileRow label="College" value={user?.college || "Not set"} />
                    <ProfileRow label="Branch" value={user?.branch || "Not set"} />
                    <ProfileRow label="Graduation" value={user?.graduation_year || "Not set"} />
                    <ProfileRow label="Preferred Role" value={user?.preferred_role || "Not set"} />
                  </div>

                  {user?.skills?.length > 0 && (
                    <div className="mt-6">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {user.skills.slice(0, 6).map((s) => (
                          <span key={s} className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">
                            {s}
                          </span>
                        ))}
                        {user.skills.length > 6 && (
                          <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/60">
                            +{user.skills.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {user?.target_companies?.length > 0 && (
                    <div className="mt-6">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">Target Companies</p>
                      <div className="flex flex-wrap gap-2">
                        {user.target_companies.slice(0, 4).map((c) => (
                          <span key={c} className="rounded-full border border-[#a78bfa]/30 bg-[#a78bfa]/10 px-3 py-1 text-xs text-[#a78bfa]">
                            {c}
                          </span>
                        ))}
                        {user.target_companies.length > 4 && (
                          <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/60">
                            +{user.target_companies.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-white/10">
                    <Link to="/profile" className="btn-ghost w-full text-sm">
                      Edit Profile
                    </Link>
                  </div>
                </GlassCard>

                {/* Current Resume */}
                <GlassCard className="p-6" glow={currentResume ? "#34D399" : "#FBBF24"}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold uppercase tracking-widest text-white/40">Current Resume</p>
                      {currentResume ? (
                        <>
                          <h4 className="mt-1 text-lg font-medium text-white">{currentResume.title}</h4>
                          <p className="mt-1 text-sm text-white/60">
                            {currentResume.original_filename || "PDF"} · v{currentResume.version} ·{(currentResume.file_size / 1024).toFixed(1)} KB
                          </p>
                          <div className="mt-4 flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => window.open(currentResume.file_url, "_blank")}>
                              View
                            </Button>
                            <Link to="/profile#resume" className="btn-ghost text-sm">
                              Replace
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="mt-1 text-white/60">No resume uploaded yet</p>
                          <Link to="/profile#resume" className="btn-neon mt-3 inline-block text-sm">
                            Upload Resume
                          </Link>
                        </>
                      )}
                    </div>
                    {currentResume && (
                      <div className="relative flex h-16 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10">
                        <span className="text-3xl">📄</span>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>

              {/* Middle Column - Interview Stats & Latest Interview */}
              <div className="lg:col-span-1 space-y-6">
                {/* Skill Breakdown Gauge */}
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-sm font-semibold uppercase tracking-widest text-white/40">Skill Breakdown</p>
                    {skillBreakdown && (
                      <span className="text-xs text-emerald-400">From latest report</span>
                    )}
                  </div>

                  {skillBreakdown ? (
                    <div className="space-y-4">
                      {Object.entries(skillBreakdown).map(([key, value], i) => (
                        <div key={key} className="flex items-center gap-4">
                          <span className="w-28 text-sm text-gray-300 capitalize">{key.replace("_", " ")}</span>
                          <ProgressBar value={value} color={getSkillColor(key)} />
                          <span className="w-8 text-right text-sm font-bold tabular-nums text-white">{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-white/40">
                      <p className="mb-2">No skill data available</p>
                      <p className="text-sm">Complete an interview to see your breakdown</p>
                    </div>
                  )}
                </GlassCard>

                {/* Latest Interview */}
                <GlassCard className="p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/40">Latest Interview</h3>
                  {latestInterview ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-medium text-white">{latestInterview.company}</h4>
                          <p className="text-sm text-white/60">{latestInterview.role}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border ${STATUS_COLORS[latestInterview.status] || "border-white/20 text-white/60"}`}>
                          {STATUS_LABELS[latestInterview.status] || latestInterview.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-white/40">Stage</p>
                          <p className="text-white capitalize">{STAGE_LABELS[latestInterview.stage] || latestInterview.stage}</p>
                        </div>
                        <div>
                          <p className="text-white/40">Scheduled</p>
                          <p className="text-white">{latestInterview.scheduled_at ? new Date(latestInterview.scheduled_at).toLocaleDateString() : "—"}</p>
                        </div>
                        {latestInterview.score !== null && (
                          <div>
                            <p className="text-white/40">Score</p>
                            <p className="text-white font-bold text-accent">{latestInterview.score}/100</p>
                          </div>
                        )}
                        {latestInterview.duration_minutes && (
                          <div>
                            <p className="text-white/40">Duration</p>
                            <p className="text-white">{latestInterview.duration_minutes} min</p>
                          </div>
                        )}
                      </div>

                      {latestInterview.feedback && (
                        <div className="pt-4 border-t border-white/10">
                          <p className="text-sm text-white/40">Feedback</p>
                          <p className="mt-1 text-sm text-white/70 line-clamp-2">{latestInterview.feedback}</p>
                        </div>
                      )}

                      <div className="pt-4 border-t border-white/10 flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => latestInterview.meeting_link && window.open(latestInterview.meeting_link, "_blank")} disabled={!latestInterview.meeting_link}>
                          Join Meeting
                        </Button>
                        <Link to={`/interviews/${latestInterview.id}`} className="btn-ghost text-sm flex-1 text-center">
                          View Details
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-white/40">
                      <p className="mb-2">No interviews yet</p>
                      <Link to="/interviews/new" className="btn-neon inline-block text-sm">
                        Schedule Interview
                      </Link>
                    </div>
                  )}
                </GlassCard>

                {/* Interview Timeline */}
                <GlassCard className="p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/40">Interview Timeline</h3>
                  {timeline.length > 0 ? (
                    <div className="relative flex flex-col gap-5 pl-6">
                      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-accent via-white/10 to-transparent" />
                      {timeline.map((item, i) => (
                        <TimelineItem key={item.id} item={item} index={i} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-white/40">No interview history</p>
                  )}
                </GlassCard>
              </div>

              {/* Right Column - Reports & Notifications */}
              <div className="lg:col-span-1 space-y-6">
                {/* Recent Reports */}
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-white/40">Recent Reports</h3>
                    {recentReports.length > 0 && (
                      <span className="text-xs text-white/50">{recentReports.length} report(s)</span>
                    )}
                  </div>

                  {recentReports.length > 0 ? (
                    <div className="space-y-3">
                      {recentReports.map((report) => (
                        <ReportCard key={report.id} report={report} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-white/40">
                      <p className="mb-2">No reports generated yet</p>
                      <p className="text-sm mb-4">Complete interviews to generate analysis reports</p>
                      <Button variant="ghost" size="sm" onClick={() => handleMarkAllRead()}>
                        Generate Report
                      </Button>
                    </div>
                  )}
                </GlassCard>

                {/* Notifications */}
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-white/40">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {stats.unreadNotifications > 0 && (
                        <span className="rounded-full bg-red-400/20 px-2 py-0.5 text-xs text-red-400">
                          {stats.unreadNotifications} unread
                        </span>
                      )}
                      {stats.unreadNotifications > 0 && (
                        <Button size="sm" variant="ghost" onClick={handleMarkAllRead}>
                          Mark all read
                        </Button>
                      )}
                    </div>
                  </div>

                  {latestNotifications.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {latestNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onRead={() => !notification.is_read && handleMarkNotificationRead(notification.id)}
                          onArchive={() => handleArchiveNotification(notification.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-white/40">No notifications</p>
                  )}
                </GlassCard>

                {/* Quick Actions */}
                <GlassCard className="p-6" glow="#A78BFA">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/40">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {quickActions.map((action) => (
                      <QuickActionButton key={action.key} action={action} />
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </main>
      </PageTransition>
    </>
  );
}

// Helper components
function StatCard({ label, value, icon, color, highlight }) {
  return (
    <GlassCard className="p-5" glow={highlight ? color : null}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40">{label}</p>
          <p className="mt-1 text-3xl font-bold text-white tabular-nums">{value}</p>
        </div>
        <div className={`shrink-0 flex h-12 w-12 items-center justify-center rounded-xl ${highlight ? `bg-[${color}]/20` : "bg-white/5"} text-2xl`}>
          {icon}
        </div>
      </div>
    </GlassCard>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/50">{label}</span>
      <span className="text-sm font-medium text-white text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

function TimelineItem({ item, index }) {
  const isUpcoming = item.type === "upcoming";
  const date = item.scheduled_at || item.completed_at || item.created_at;

  return (
    <div className="relative flex items-start gap-4">
      <span
        className={`absolute -left-6 mt-1 h-[15px] w-[15px] rounded-full border-3 flex-shrink-0 ${
          isUpcoming
            ? "border-accent bg-transparent shadow-[0_0_10px_rgba(0,242,255,0.6)]"
            : "border-emerald-400 bg-emerald-400"
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-white truncate">{item.company}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[item.status] || "border-white/20 text-white/60"}`}>
            {STATUS_LABELS[item.status] || item.status}
          </span>
        </div>
        <p className="text-xs text-white/50">{item.role}</p>
        <p className="mt-1 text-[11px] text-white/40">{date ? new Date(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</p>
        {item.score !== null && (
          <p className="mt-1 text-xs font-medium text-accent">Score: {item.score}/100</p>
        )}
      </div>
    </div>
  );
}

function ReportCard({ report }) {
  const typeLabels = {
    interview_analysis: "Interview Analysis",
    skill_assessment: "Skill Assessment",
    progress_report: "Progress Report",
    mock_feedback: "Mock Feedback",
  };

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-accent/30 transition-colors group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium uppercase tracking-wider text-accent">
              {typeLabels[report.type] || report.type}
            </span>
            {report.scores && (
              <span className="text-xs text-emerald-400 font-mono">
                Avg: {Math.round(Object.values(report.scores).reduce((a, b) => a + b, 0) / Object.values(report.scores).length)}
              </span>
            )}
          </div>
          <h4 className="mt-1 text-sm font-medium text-white truncate group-hover:text-accent transition-colors">
            {report.title}
          </h4>
          {report.summary && (
            <p className="mt-1 text-xs text-white/50 line-clamp-2">{report.summary}</p>
          )}
        </div>
        <span className="shrink-0 text-xs text-white/40">
          {new Date(report.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

function NotificationItem({ notification, onRead, onArchive }) {
  const icon = TYPE_ICONS[notification.type] || "🔔";

  return (
    <div
      className={`p-3 rounded-xl border transition-colors ${
        notification.is_read
          ? "bg-white/5 border-white/10"
          : "bg-accent/10 border-accent/30"
      } group`}
    >
      <div className="flex items-start gap-3">
        <span className="shrink-0 mt-0.5 text-lg">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-medium ${notification.is_read ? "text-white/80" : "text-white"}`}>
              {notification.title}
            </h4>
            <span className={`shrink-0 text-[10px] font-medium ${PRIORITY_COLORS[notification.priority]}`}>
              {notification.priority}
            </span>
          </div>
          {notification.message && (
            <p className="mt-1 text-xs text-white/60 line-clamp-1">{notification.message}</p>
          )}
          <p className="mt-1 text-[10px] text-white/40">
            {new Date(notification.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.is_read && (
            <button
              onClick={onRead}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              aria-label="Mark as read"
              title="Mark as read"
            >
              ✓
            </button>
          )}
          <button
            onClick={onArchive}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-400/20 text-white/60 hover:text-red-400 transition-colors"
            aria-label="Archive"
            title="Archive"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({ action }) {
  const icons = {
    upload: "📤",
    calendar: "📅",
    "file-text": "📊",
    user: "👤",
    bell: "🔔",
  };

  const priorityColors = {
    high: "border-red-400/30 hover:border-red-400",
    medium: "border-amber-400/30 hover:border-amber-400",
    low: "border-white/10 hover:border-accent/30",
  };

  const routes = {
    upload_resume: "/profile#resume",
    schedule_mock: "/interviews/new",
    generate_report: "/reports/new",
    update_profile: "/profile",
    settings: "/settings",
  };

  return (
    <Link
      to={routes[action.key] || "#"}
      className={`group p-4 rounded-xl border ${priorityColors[action.priority]} bg-white/5 hover:bg-white/10 transition-all text-center`}
    >
      <span className="block text-2xl mb-2">{icons[action.icon] || "⚡"}</span>
      <span className="text-sm font-medium text-white group-hover:text-accent transition-colors">
        {action.label}
      </span>
    </Link>
  );
}

function getSkillColor(skill) {
  const colors = {
    communication: "#00F2FF",
    technical: "#60A5FA",
    behavioral: "#A78BFA",
    confidence: "#F472B6",
    coding: "#34D399",
    behavior: "#A78BFA",
  };
  return colors[skill] || "#60A5FA";
}

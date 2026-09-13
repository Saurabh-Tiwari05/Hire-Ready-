const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function migrate() {
  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL");

    const migrationFolder = path.join(__dirname, "../../migrations");

    // Run migrations in dependency order
    const files = [
      "2024_08_04_users.sql",
      "2024_08_04_profile_management.sql",
      "2024_08_04_resume_management.sql",
      "2024_08_04_interviews.sql",
      "2024_08_04_candidate_interview.sql",
      "2024_08_04_dashboard_tables.sql",
      "20260804_reports_notifications.sql",
      "20260804_ai_interview_messages.sql",
      "20260805_ai_evaluation_tables.sql",
      "20260805_analytics_dashboard.sql",
      "20260805_career_analysis.sql",
      "20260805_process14_profile_tables.sql",
      "20260805_report_pdf_email.sql",
      "20260808_candidate_profile_user_unique.sql",
      "20260908_auth_columns.sql",
    ];

    for (const file of files) {
      const filePath = path.join(migrationFolder, file);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Skipping ${file} (not found)`);
        continue;
      }

      console.log(`🚀 Running ${file}`);

      const sql = fs.readFileSync(filePath, "utf8");

      await client.query(sql);

      console.log(`✅ ${file} completed`);
    }

    console.log("\n🎉 All migrations completed successfully.");
  } catch (err) {
    console.error("\n❌ Migration Failed");
    console.error(err);
  } finally {
    await client.end();
  }
}

migrate();
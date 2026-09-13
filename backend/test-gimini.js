const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-flash-latest",
  });

  const result = await model.generateContent("Say Hello!");

  console.log(result.response.text());
}

test().catch(console.error);

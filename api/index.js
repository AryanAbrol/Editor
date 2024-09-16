require("dotenv").config(); 

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors"); 
const { GoogleGenerativeAI } = require("@google/generative-ai");


const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();


app.use(cors());

app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({ error: "Invalid JSON" });
        throw new Error("Invalid JSON");
      }
    },
  })
);

app.use(express.json());

app.post("/any", async (req, res) => {
  try {
    const { content, type } = req.body; 

    console.log("Received content:", content);

    const prompt = `Based on the following ${type} code snippets, please generate additional lines of code that improve or extend the current implementation. Don't include the current code snippet. Code: \n\n${content}`;
    console.log("Generated prompt:", prompt);

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    console.log("Generated suggestion:", responseText);

    responseText = formatResponse(responseText, type, content);

    res.json({ suggestion: responseText });
  } catch (error) {
    console.error("Error generating suggestion:", error);
    res.status(500).json({ error: error.toString() });
  }
});

function formatResponse(text, type, originalContent) {
  if (typeof text !== "string") {
    console.error("Unexpected response format:", text);
    return "Error: Unexpected response format";
  }
  switch (type) {
    case "html":
    case "css":
    case "js":
      return extractFirstContent(text, type, originalContent);
    default:
      return text;
  }
}

function extractFirstContent(text, type, originalContent) {
  if (typeof text !== "string") {
    console.error("Unexpected text format in extractFirstContent:", text);
    return "";
  }
  const pattern = new RegExp(`\\\`${type}\\n([\\s\\S]*?)\\\``, "i");
  const match = text.match(pattern);
  if (match) {
    let extractedContent = match[1].trim();
    return extractedContent.replace(originalContent, "").trim();
  }
  return "";
}

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

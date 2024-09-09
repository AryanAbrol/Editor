require("dotenv").config(); // Add this at the top of the file

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors"); // Importing the cors middleware
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();

// Enable CORS for all routes
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
    const { content, type } = req.body; // Expecting 'content' and 'type' (e.g., 'html', 'css', 'js') from the frontend

    console.log("Received content:", content);

    // Create a prompt based on content type
    const prompt = `Based on the following ${type} code snippets, please generate additional lines of code that improve or extend the current implementation. Don't include the current code snippet. Code: \n\n${content}`;
    console.log("Generated prompt:", prompt);

    // Generate suggestions using Google Generative AI
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    console.log("Generated suggestion:", responseText);

    // Format the response (optional, depending on your needs)
    responseText = formatResponse(responseText, type, content);

    // Send back the generated response
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
    // Remove original content from the extracted content
    return extractedContent.replace(originalContent, "").trim();
  }
  return "";
}

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

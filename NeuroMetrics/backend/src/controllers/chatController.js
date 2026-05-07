import OpenAI from "openai";

export const handleChatQuery = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: 'GROQ_API_KEY is not configured.' });
    }

    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const systemPrompt = `You are a helpful, professional AI assistant built for "NeuroMetrics", a platform dedicated to cognitive assessments and health tracking. 
Your primary goal is to answer questions related to cognitive health, neuro-metrics, mental wellness, and how the app works.

CRITICAL INSTRUCTIONS:
- ONLY answer questions related to health, cognitive assessments, psychology, or the NeuroMetrics app.
- If a user asks a question completely unrelated to these topics (e.g., coding, cooking, general knowledge, sports), politely refuse to answer and remind them that you are specifically designed to assist with health and cognitive assessment queries.
- Keep your responses concise, friendly, and easy to read. Use short paragraphs.`;

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...(history || []),
      { role: "user", content: message }
    ];

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: formattedMessages,
    });

    const reply = response.choices[0].message.content;

    res.json({ reply });
  } catch (error) {
    console.error("Chat API Error:", error);
    res.status(500).json({ message: 'Error processing your query. Please try again later.' });
  }
};

import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, chatHistory, knowledgeBase } from "@workspace/db";
import { ChatbotAskBody } from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";
import { ai } from "@workspace/integrations-gemini-ai";
import crypto from "crypto";

const router = Router();

// Simple keyword-based retrieval (since pgvector embeddings aren't available in Gemini integration)
async function retrieveRelevantDocs(question: string) {
  const docs = await db.select().from(knowledgeBase);
  const q = question.toLowerCase();

  // Score by keyword overlap
  const scored = docs.map(doc => {
    const words = q.split(/\s+/).filter(w => w.length > 3);
    const text = (doc.chunk + " " + doc.sourceName).toLowerCase();
    const score = words.filter(w => text.includes(w)).length;
    return { ...doc, score };
  });

  return scored
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

router.post("/chatbot/ask", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = ChatbotAskBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { question, conversationId } = parsed.data;
  const convId = conversationId ?? crypto.randomUUID();

  const relevantDocs = await retrieveRelevantDocs(question);

  let context = "";
  const sources: { sourceName: string; excerpt: string }[] = [];

  if (relevantDocs.length > 0) {
    context = relevantDocs.map(d => `[Source: ${d.sourceName}]\n${d.chunk}`).join("\n\n---\n\n");
    sources.push(...relevantDocs.map(d => ({
      sourceName: d.sourceName,
      excerpt: d.chunk.slice(0, 200) + (d.chunk.length > 200 ? "..." : ""),
    })));
  }

  const systemPrompt = `You are an official AI assistant for the CitizenConnect Government Service Portal. 
Your role is to help citizens understand how to update their personal information (mobile number, email, address).

STRICT RULES:
1. Answer ONLY from the provided official policy documents below.
2. If no relevant information is found in the documents, respond exactly: "Official information could not be retrieved. Please contact your nearest government service center for assistance."
3. Never invent or hallucinate government rules, procedures, or requirements.
4. Be concise, professional, and clear.
5. Always recommend consulting an official government officer for complex queries.
6. Never ask the user to share personal data like Aadhaar numbers or passwords.

${context ? `OFFICIAL POLICY DOCUMENTS:\n\n${context}` : "NO RELEVANT DOCUMENTS FOUND FOR THIS QUERY."}`;

  const userMessage = question;

  let answer = "";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 8192,
      },
    });
    answer = response.text ?? "Official information could not be retrieved.";
  } catch (err) {
    req.log.error({ err }, "Gemini API error");
    answer = "Official information could not be retrieved. Please try again later.";
  }

  if (relevantDocs.length === 0) {
    answer = "Official information could not be retrieved. Please contact your nearest government service center for assistance.";
  }

  // Save to chat history
  await db.insert(chatHistory).values({
    clerkUserId: userId,
    conversationId: convId,
    role: "user",
    content: question,
    sources: "[]",
  });

  await db.insert(chatHistory).values({
    clerkUserId: userId,
    conversationId: convId,
    role: "assistant",
    content: answer,
    sources: JSON.stringify(sources),
  });

  res.json({
    answer,
    sources,
    conversationId: convId,
    retrievedCount: relevantDocs.length,
  });
});

router.get("/chatbot/history", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const history = await db.select().from(chatHistory)
    .where(eq(chatHistory.clerkUserId, userId))
    .orderBy(chatHistory.createdAt);

  res.json(history.map((h, idx) => ({
    id: h.id,
    role: h.role,
    content: h.content,
    sources: JSON.parse(h.sources || "[]"),
    createdAt: h.createdAt.toISOString(),
  })));
});

router.delete("/chatbot/history", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  await db.delete(chatHistory).where(eq(chatHistory.clerkUserId, userId));
  res.status(204).send();
});

export default router;

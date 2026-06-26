export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        message: "Method not allowed",
      });
    }

    const { answers } = req.body || {};

    if (!answers) {
      return res.status(400).json({
        ok: false,
        message: "Answers required",
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        ok: false,
        message: "SUPABASE_URL yoki SUPABASE_PUBLISHABLE_KEY Vercel env ichida yo‘q",
      });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/love_answers`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        answers,
      }),
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(500).json({
        ok: false,
        message: text,
      });
    }

    return res.status(200).json({
      ok: true,
      data: text ? JSON.parse(text) : null,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: error.message || "Server error",
    });
  }
}
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Groq API (Llama 3.3 70B Versatile 모델 사용)
async function callGroqApi(prompt) {
    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY가 Render 환경변수에 설정되지 않았습니다.");
    }

    const url = "https://api.groq.com/openai/v1/chat/completions";

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq API Error Response:", response.status, errorText);
        throw new Error(`Groq API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

app.post('/api/evaluate', async (req, res) => {
    try {
        const { roundNews, portfolio, userReason, roundNumber } = req.body;

        const systemInstruction = `
너는 자산 관리를 맡긴 깐깐하고 논리적인 AI 투자 고객이다.
현재 펀드매니저(학생)가 자산 배분 후 너에게 설득 메시지를 보냈다.

[판단 기준]
1. 단순히 얼마를 넣었다는 숫자 나열이나 '믿어달라', '안전하다' 같은 단순 장담은 반드시 거절(REJECT)해라.
2. 제시된 시장 뉴스(경제 상황)와 본인이 배분한 포트폴리오 비중 간의 '원인과 결과(논리적 이유)'가 명확히 연결되어야 승인(APPROVE)해라.
3. 핑계나 얼버무림, 맥락에 맞지 않는 답은 구체적으로 꼬집어서 지적해라.

[응답 포맷]
반드시 아래 JSON 형태로만 응답해라. 다른 말은 덧붙이지 마라.
{
  "status": "APPROVE" 또는 "REJECT",
  "feedback": "고객 입장에서 학생에게 할 말 (승인 시 감사 인사, 거절 시 깐깐한 지적과 이유 요구)"
}
`;

        const prompt = `
${systemInstruction}

[현재 상황]
- 라운드: ${roundNumber}라운드
- 시장 뉴스: ${roundNews}
- 학생이 설정한 포트폴리오: 예금 ${portfolio.deposit}원, 주식 ${portfolio.stock}원, 코인/벤처 ${portfolio.crypto}원
- 학생의 설득 메시지: "${userReason}"

이 설득이 논리적으로 타당한지 심사하고 지정된 JSON으로만 응답해라.
`;

        const responseText = await callGroqApi(prompt);
        const resultJson = JSON.parse(responseText);
        res.json(resultJson);

    } catch (error) {
        console.error("Server Internal Error:", error.message);
        res.status(500).json({ status: "REJECT", feedback: `AI 통신 에러가 발생했습니다: ${error.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

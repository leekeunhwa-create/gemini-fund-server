const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

async function callGeminiApi(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
    }

    // Gemini 1.5 Flash 공식 API 엔드포인트
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error Response:", response.status, errorText);
        throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

app.post('/api/evaluate', async (req, res) => {
    try {
        const { roundNews, portfolio, userReason, roundNumber } = req.body;

        const prompt = `
너는 자산 관리를 맡긴 깐깐하고 논리적인 AI 투자 고객이다.
현재 펀드매니저(학생)가 자산 배분 후 너에게 설득 메시지를 보냈다.

[판단 기준]
1. 단순히 얼마를 넣었다는 숫자 나열이나 '믿어달라', '안전하다' 같은 단순 장담은 반드시 거절(REJECT)해라.
2. 제시된 시장 뉴스(경제 상황)와 본인이 배분한 포트폴리오 비중 간의 '원인과 결과(논리적 이유)'가 명확히 연결되어야 승인(APPROVE)해라.
3. 핑계나 얼버무림, 맥락에 맞지 않는 답은 구체적으로 꼬집어서 지적해라.

[현재 상황]
- 라운드: ${roundNumber}라운드
- 시장 뉴스: ${roundNews}
- 학생이 설정한 포트폴리오: 예금 ${portfolio.deposit}원, 주식 ${portfolio.stock}원, 코인/벤처 ${portfolio.crypto}원
- 학생의 설득 메시지: "${userReason}"

[응답 포맷]
반드시 아래 JSON 형태로만 응답해라. 다른 말은 덧붙이지 마라.
{
  "status": "APPROVE" 또는 "REJECT",
  "feedback": "고객 입장에서 학생에게 할 말 (승인 시 감사 인사, 거절 시 깐깐한 지적과 이유 요구)"
}
`;

        const responseText = await callGeminiApi(prompt);
        const resultJson = JSON.parse(responseText);
        res.json(resultJson);

    } catch (error) {
        console.error("Server Internal Error:", error.message);
        res.status(500).json({ 
            status: "REJECT", 
            feedback: "AI 고객이 응답을 처리하는 중입니다. 전송 버튼을 한 번 더 눌러주세요!" 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// 환경 변수에서 API 키 불러오기
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
[지침]
${systemInstruction}

[현재 상황]
- 라운드: ${roundNumber}라운드
- 시장 뉴스: ${roundNews}
- 학생이 설정한 포트폴리오: 예금 ${portfolio.deposit}원, 주식 ${portfolio.stock}원, 코인/벤처 ${portfolio.crypto}원
- 학생의 설득 메시지: "${userReason}"

이 설득이 논리적으로 타당한지 심사하고 지정된 JSON으로만 응답해라.
`;

        const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        const resultJson = JSON.parse(responseText);
        res.json(resultJson);

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ status: "REJECT", feedback: "AI 고객과의 통신 중 오류가 발생했습니다. 입력한 내용을 다시 확인해주세요." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

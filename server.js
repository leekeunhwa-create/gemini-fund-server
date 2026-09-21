const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/evaluate', (req, res) => {
    try {
        const { roundNews, portfolioOption, userReason, roundNumber } = req.body;

        // 이유 작성이 너무 짧은 경우 거절 처리 (최소 10자 이상)
        if (!userReason || userReason.trim().length < 10) {
            return res.json({
                status: "REJECT",
                feedback: "AI 고객: '이유가 너무 성의없습니다! 최소 10자 이상 논리적으로 나를 설득해보세요.'"
            });
        }

        // 라운드별/선택지별 조건부 피드백 (선택한 객관식 옵션에 따라 달라짐)
        let isApproved = true;
        let feedbackMessage = "";

        // 포트폴리오 선택지 타입에 따른 논리 평가 (프론트에서 넘어오는 option 값)
        if (portfolioOption === "STABLE") { // 안전형 (예금 중심)
            isApproved = true;
            feedbackMessage = "AI 고객: '원금을 지키면서 안정적인 수익을 노리는 합리적인 선택이군요. 승인합니다!'";
        } else if (portfolioOption === "BALANCED") { // 중립형 (주식/예금 분산)
            isApproved = true;
            feedbackMessage = "AI 고객: '시장 상황에 맞게 위험을 잘 분산했네요. 설득력이 있습니다. 승인!'";
        } else if (portfolioOption === "AGGRESSIVE") { // 공격형 (코인/주식 중심)
            // 작성한 이유에 특정 키워드(분석, 대응, 호재, 전략)가 포함되었는지 간단 확인
            const keywords = ["뉴스", "분석", "대응", "상승", "하락", "전략", "원인", "이유"];
            const hasKeyword = keywords.some(kw => userReason.includes(kw));

            if (hasKeyword) {
                isApproved = true;
                feedbackMessage = "AI 고객: '공격적인 투자지만, 제시한 뉴스 분석 이유가 꽤 논리적이군요. 위험을 감수하고 승인하겠습니다!'";
            } else {
                isApproved = false;
                feedbackMessage = "AI 고객: '위험 자산 비중이 너무 높은데, 뉴스에 기반한 근거가 부족합니다. 조금 더 논리적으로 작성해서 다시 제출하세요.'";
            }
        } else {
            isApproved = true;
            feedbackMessage = "AI 고객: '제시하신 포트폴리오 전략과 이유를 검토했습니다. 승인합니다!'";
        }

        // 결과 반환 (AI 응답과 동일한 형태)
        res.json({
            status: isApproved ? "APPROVE" : "REJECT",
            feedback: feedbackMessage
        });

    } catch (error) {
        console.error("Evaluation Error:", error);
        res.status(500).json({
            status: "REJECT",
            feedback: "평가 처리 중 오류가 발생했습니다. 다시 시도해 주세요."
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Static Logic Server running on port ${PORT}`));

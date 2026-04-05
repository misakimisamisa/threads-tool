export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { theme, hint } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'APIキーが設定されていません' });

  const THEMES = {
    body_pain:         '腰痛・肩こり・膝痛など身体の痛みと不調のセルフケアや原因',
    training:          '効果的な筋トレ・運動習慣・正しいフォームの重要性',
    nutrition:         'パフォーマンス向上のための食事・栄養バランス・タンパク質',
    posture:           '猫背改善・インナーマッスル・正しい姿勢の作り方',
    motivation:        '継続するためのマインドセット・習慣化・小さな一歩',
    injury_prevention: '柔道整復師の専門知識を活かしたケガ予防・準備運動・アフターケア',
    studio_promo:      '白金高輪パーソナルトレーニングスタジオの特徴・柔道整復師運営の強み',
    lifestyle:         '睡眠・ストレスケア・日常動作・デスクワーカーの健康習慣',
  };

  const prompt = `あなたは白金高輪でパーソナルトレーニングスタジオを運営する柔道整復師です。Threadsに投稿する日本語の投稿文を1つだけ作成してください。

テーマ：${THEMES[theme] || theme}
${hint ? '追加指示：' + hint : ''}

条件：
- 300〜450文字程度
- 柔道整復師としての専門性と親しみやすさを両立
- 読者は30〜50代のビジネスパーソン
- 適度な改行・絵文字（多用しない）
- 末尾にCTA（DMください等）
- ハッシュタグ3〜5個を末尾に
- 投稿文のみ出力（前置き・説明不要）`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API error' });
    const text = data.content?.find(b => b.type === 'text')?.text?.trim();
    if (!text) return res.status(500).json({ error: '生成結果が空でした' });
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

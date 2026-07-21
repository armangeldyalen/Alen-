const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const MODEL = 'gemini-2.5-flash';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const clamp = (value: unknown, min: number, max: number) =>
  Math.max(min, Math.min(max, Number(value) || min));
const players = ['defender_left', 'defender_right', 'attacker_left', 'attacker_right'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY не настроен в Supabase Secrets');
    const body = await req.json();
    if (body.mode !== 'football-tactics') throw new Error('Неизвестный режим AI');
    const state = body.state ?? {};
    const prompt = `Ты тренер команды ботов в футбольной игре 5 на 5. Выбери решения на следующие 10 секунд.
Счёт ботов: ${state.awayGoals ?? 0}, счёт игрока: ${state.homeGoals ?? 0}, минута: ${state.minute ?? 0}, сила ботов: ${state.botStrength ?? 5}/10, владение: ${state.possession ?? 'unknown'}.
Роли: defender_left и defender_right — защитники, attacker_left и attacker_right — атакующие игроки.
passTarget — кому бот с мячом должен отдать пас. tacklePlayer — кто начинает отбор. defensiveLine — позиция защитников: low ближе к своим воротам, middle стандартно, high выше к центру.
counterattack включай, когда после отбора нужно быстро атаковать. Не объясняй решение. Верни только JSON по схеме.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: .35,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              style: { type: 'STRING', enum: ['defensive', 'balanced', 'attacking'] },
              pressing: { type: 'INTEGER', minimum: 1, maximum: 10 },
              attackSpeed: { type: 'INTEGER', minimum: 1, maximum: 10 },
              passTarget: { type: 'STRING', enum: players },
              tacklePlayer: { type: 'STRING', enum: players },
              counterattack: { type: 'BOOLEAN' },
              defensiveLine: { type: 'STRING', enum: ['low', 'middle', 'high'] },
            },
            required: ['style', 'pressing', 'attackSpeed', 'passTarget', 'tacklePlayer', 'counterattack', 'defensiveLine'],
          },
        },
      }),
    });
    if (!response.ok) throw new Error(`Gemini ${response.status}: ${await response.text()}`);
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const tactic = JSON.parse(text);
    const result = {
      style: ['defensive', 'balanced', 'attacking'].includes(tactic.style) ? tactic.style : 'balanced',
      pressing: clamp(tactic.pressing, 1, 10),
      attackSpeed: clamp(tactic.attackSpeed, 1, 10),
      passTarget: players.includes(tactic.passTarget) ? tactic.passTarget : 'attacker_left',
      tacklePlayer: players.includes(tactic.tacklePlayer) ? tactic.tacklePlayer : 'defender_left',
      counterattack: Boolean(tactic.counterattack),
      defensiveLine: ['low', 'middle', 'high'].includes(tactic.defensiveLine) ? tactic.defensiveLine : 'middle',
    };
    return new Response(JSON.stringify(result), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});

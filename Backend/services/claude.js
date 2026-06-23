const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({apiKey:process.env.GROQ_API_KEY});

const langMap = {
    hindi:'Respond entirely in simple Hindi.',
    english:'Respond in simple plain English.'
};

async function analyzeDocument(text,language = 'english'){
    const response = await groq.chat.completions.create({
       model: 'llama-3.3-70b-versatile',
        messages:[{
            role:'user',
            content:`You are a legal expert helping common Indian people understand legal documents.

${langMap[language] || langMap['english']}

Analyze this document and return ONLY valid JSON, no extra text:

            {
            "docType": "type in 2-3 words",
            "riskScore":<number 1-10>,
            "summary":"2-3 sentance plain language summary",
            "clauses":[
            {
            "title":"clause name",
            "risk":"safe|caution|risky",
            "explanation":"simple explanation under 60 words",
            "warnings":"specific warning if risky,else empty string"
            }]
            }

            Document:
            ${text.substring(0,4000)}`

        }],
        temperature:0.3,
        max_tokens:2000

    });

    const raw = response.choices[0].message.content;
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
}
module.exports = {analyzeDocument};
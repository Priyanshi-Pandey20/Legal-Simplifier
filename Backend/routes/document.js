const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Document = require('../models/Document');
const Analysis = require('../models/Analysis');
const { analyzeDocument } = require('../services/claude');
const multer = require('multer');
const path = require('path')
const fs = require('fs');
const crypto = require('crypto');


const storage = multer.diskStorage({
  destination:(req,file,cb) =>{
    const dir = './uploads';
    if(!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null,dir);
  },
  filename:(req,file,cb) =>{
    cb(null,`${req.user.id}_${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({storage});

router.post('/upload-file',authMiddleware,upload.single('file'),(req,res)=>{
  res.json({success:true,filename:req.file.filename});
});

router.get('/file/:filename',authMiddleware,(req,res)=>{
  const filePath = path.join(__dirname,'../uploads',req.params.filename);
  if(fs.existsSync(filePath)){
    res.sendFile(path.resolve(filePath));
  }else{
    res.status(404).json({error:'File not found'});
  }
});


router.post('/analyze', authMiddleware, async (req, res) => {
  const { text, filename, language } = req.body;

  try {
    const textHash = crypto.createHash('sha256').update(text).digest('hex');

    // Check if this user already uploaded this exact document
    let doc = await Document.findOne({ userId: req.user.id, textHash });

    if (!doc) {
      doc = await Document.create({
        userId: req.user.id,
        filename: filename || 'pasted_text',
        originalText: text,
        savedFile: req.body.savedFile || null,
        textHash,
      });
    }

    const cachedAnalysis = await Analysis.findOne({ documentId: doc._id, language: language || 'english' });
    let result;

    if (cachedAnalysis) {
      result = {
        riskScore: cachedAnalysis.riskScore,
        summary: cachedAnalysis.summary,
        docType: cachedAnalysis.docType,
        clauses: cachedAnalysis.clauses,
      };
    } else {
      result = await analyzeDocument(text, language);
    }

    const analysis = await Analysis.create({
      documentId: doc._id,
      userId: req.user.id,
      language: language || 'english',
      riskScore: result.riskScore,
      summary: result.summary,
      docType: result.docType,
      clauses: result.clauses,
    });
    await analysis.populate('documentId');
    res.json({ success: true, analysis });

  } catch (err) {
    console.log('FULL ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id',authMiddleware,async(req,res) =>{
  try{
    await Analysis.findByIdAndDelete(req.params.id);
    await Document.findByIdAndDelete(req.params.id);
    res.json({success:true});
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

router.post('/reanalyze/:analysisId', authMiddleware, async (req, res) => {
  try {
    const { language } = req.body;

    const existingAnalysis = await Analysis.findById(req.params.analysisId)
      .populate('documentId');

    if (!existingAnalysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const text = existingAnalysis.documentId.originalText;
    const result = await analyzeDocument(text, language);

    const newAnalysis = await Analysis.create({
      documentId: existingAnalysis.documentId._id,
      userId: req.user.id,
      language,
      riskScore: result.riskScore,
      summary: result.summary,
      docType: result.docType,
      clauses: result.clauses,
    });

    await newAnalysis.populate('documentId');
    res.json({ success: true, analysis: newAnalysis });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/chat/:analysisId', authMiddleware, async (req, res) => {
  try {
    const { question, history } = req.body;

    const existingAnalysis = await Analysis.findById(req.params.analysisId)
      .populate('documentId');

    if (!existingAnalysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const documentText = existingAnalysis.documentId.originalText;
    const { riskScore, summary, clauses, docType } = existingAnalysis;

    // Pre-calculate stats
    const riskyCount = clauses.filter(c => c.risk === 'risky').length;
    const cautionCount = clauses.filter(c => c.risk === 'caution').length;
    const safeCount = clauses.filter(c => c.risk === 'safe').length;
    const safePercent = Math.round((10 - riskScore) / 10 * 100);

    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const messages = [
      {
        role: 'system',
        content: `You are a helpful legal document assistant.

Here is the complete analysis of this document:
- Document Type: ${docType}
- Risk Score: ${riskScore}/10
- Safety Rate: ${safePercent}%
- Total Clauses: ${clauses.length}
- Critical Clauses: ${riskyCount}
- Caution Clauses: ${cautionCount}
- Safe Clauses: ${safeCount}
- Summary: ${summary}

Clause Breakdown:
${clauses.map((c, i) => `${i + 1}. "${c.title}"
   Risk: ${c.risk.toUpperCase()}
   Explanation: ${c.explanation}
   Warning: ${c.warnings || 'None'}`).join('\n\n')}

When answering:
- Use the clause breakdown above to answer any questions about risks or clauses accurately
- Tell users exactly which clauses are risky and what they should do about it
- If asked about general terms or concepts, explain briefly in simple words
- If asked about safety rate, risk score, or clause counts — use the numbers above
- Keep answers under 5 lines
- Simple plain language, no legal jargon
- Be direct and helpful

Document Text:
${documentText.substring(0, 2000)}`,
      },
    ];

    // Strictly alternate user → assistant → user → assistant
    let lastRole = null;
    for (const msg of history) {
      if (msg.role !== lastRole) {
        messages.push({ role: msg.role, content: msg.content });
        lastRole = msg.role;
      }
    }

    // Always end with the new user question
    if (lastRole !== 'user') {
      messages.push({ role: 'user', content: question });
    } else {
      messages[messages.length - 1] = { role: 'user', content: question };
    }

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.3,
      max_tokens: 300,
    });

    const answer = response.choices[0].message.content;
    res.json({ success: true, answer });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
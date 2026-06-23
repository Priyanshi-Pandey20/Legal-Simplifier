const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Analysis = require('../models/Analysis');

router.get('/',authMiddleware,async(req,res) =>{
    try{
        const analyses = await Analysis
        .find({userId:req.user.id})
        .populate('documentId','filename createdAt')
        .sort({createdAt : -1});

        res.json(analyses);
    }catch(err){
        res.status(500).json({error:'Could not fetch history'});
    }
});
module.exports = router;
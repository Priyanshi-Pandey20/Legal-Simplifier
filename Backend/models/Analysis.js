const mongoose = require('mongoose');

const clauseSchema = new mongoose.Schema({
    title:String,
    risk:{type:String,enum:['safe','caution','risky']},
    explanation:String,
    warning:String,
});

const analysisSchema = new mongoose.Schema({
    documentId:{type:mongoose.Schema.Types.ObjectId,ref:'Document',required:true},
    userId :{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    language:{type:String,enum:['hindi','hinglish','english'],default:'hinglish'},
    riskScore:Number,
    summary:String,
    docType:String,
    clauses:[clauseSchema],
},{timestamps:true});


module.exports = mongoose.model('Analysis',analysisSchema);
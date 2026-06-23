const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId, ref:'User',required:true},
    filename:{type:String,default:'pasted_text'},
    originalText:{type:String,required:true},
    docType:{type:String},
    savedFile:{type:String,default:null},
    textHash:{type:String,index:true}
},{timestamps:true});

module.exports = mongoose.model('Document',documentSchema);
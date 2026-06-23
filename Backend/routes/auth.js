const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

router.post('/register',async(req,res) =>{
    const {name,email,password} = req.body;
    try{
        const exists = await User.findOne({email});
        if(exists) return res.status(400).json({error:'Email already exists'});

        const hashed = await bcrypt.hash(password,10);
        const user = await User.create({name,email,password:hashed});
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'})

        res.json({token,user:{id:user._id,name,email}})
    }catch(err){
        res.status(500).json({error:'Server error'});
    }
});

//Login 

router.post('/login',async(req,res) =>{
    const {email,password} = req.body;

    try{
        const user = await User.findOne({email});
        if(!user) return res.status(400).json({error:"User not found"});

        const match = await bcrypt.compare(password,user.password);
        if(!match) return res.status(400).json({error:"Wrong password"});

        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'});
        res.json({token,user:{id:user._id,name:user.name,email}});
    }catch(err){
        res.status(500).json({error:'Server error'});
    }
});

//Change Password
const authMiddleware = require('../middleware/auth');

// Change Password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ error: 'Current password is incorrect' });

    if (newPassword.length < 6) 
      return res.status(400).json({ error: 'New password must be at least 6 characters' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully!' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});
module.exports = router;
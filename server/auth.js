import jwt from 'jsonwebtoken';
import {User} from './models.js';

export function signToken(user){return jwt.sign({sub:user._id.toString(),role:user.role},process.env.JWT_SECRET,{expiresIn:'2h',issuer:'nova-commerce',audience:'nova-store'});}
export async function requireAuth(req,res,next){try{const raw=req.headers.authorization?.replace(/^Bearer\s+/,'');if(!raw)return res.status(401).json({message:'Faça login para continuar.'});const data=jwt.verify(raw,process.env.JWT_SECRET,{issuer:'nova-commerce',audience:'nova-store'});const user=await User.findById(data.sub);if(!user?.active)return res.status(401).json({message:'Sessão inválida.'});req.user=user;next();}catch{return res.status(401).json({message:'Sessão expirada ou inválida.'});}}
export function requireAdmin(req,res,next){if(req.user?.role!=='admin')return res.status(403).json({message:'Acesso administrativo necessário.'});next();}

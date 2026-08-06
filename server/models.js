import mongoose from 'mongoose';

const addressSchema=new mongoose.Schema({label:{type:String,default:'Principal'},recipient:String,zip:String,street:String,number:String,complement:String,neighborhood:String,city:String,state:String},{_id:true});
const providerSchema=new mongoose.Schema({provider:{type:String,enum:['google','microsoft'],required:true},providerId:{type:String,required:true},email:{type:String,lowercase:true},linkedAt:{type:Date,default:Date.now}},{_id:false});
const userSchema=new mongoose.Schema({name:{type:String,required:true,trim:true},email:{type:String,required:true,unique:true,lowercase:true,index:true},passwordHash:{type:String,select:false},emailVerifiedAt:Date,providers:[providerSchema],role:{type:String,enum:['customer','admin'],default:'customer'},addresses:[addressSchema],active:{type:Boolean,default:true}},{timestamps:true});
userSchema.index({'providers.provider':1,'providers.providerId':1},{unique:true,sparse:true});
const productSchema=new mongoose.Schema({name:{type:String,required:true},slug:{type:String,required:true,unique:true,index:true},description:String,category:{type:String,index:true},brand:String,price:{type:Number,required:true,min:0},compareAtPrice:Number,color:String,sizes:[String],images:[String],badge:String,rating:{type:Number,default:0},stock:{type:Number,required:true,min:0,index:true},active:{type:Boolean,default:true,index:true}},{timestamps:true});
const itemSchema=new mongoose.Schema({product:{type:mongoose.Schema.Types.ObjectId,ref:'Product',required:true},name:String,sku:String,quantity:{type:Number,min:1,required:true},unitPrice:{type:Number,min:0,required:true},total:{type:Number,min:0,required:true}},{_id:false});
const orderSchema=new mongoose.Schema({number:{type:String,unique:true,index:true},user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},items:[itemSchema],shippingAddress:{recipient:String,zip:String,street:String,number:String,complement:String,neighborhood:String,city:String,state:String},subtotal:Number,shipping:Number,total:Number,status:{type:String,enum:['awaiting_payment','paid','preparing','shipped','delivered','cancelled','expired','refunded'],default:'awaiting_payment',index:true},payment:{provider:{type:String,default:'mercadopago'},method:{type:String,default:'pix'},providerPaymentId:String,status:String,qrCode:String,qrCodeBase64:String,ticketUrl:String,expiresAt:Date},paidAt:Date,trackingCode:String},{timestamps:true});
const webhookSchema=new mongoose.Schema({provider:String,eventId:{type:String,unique:true},type:String,payload:mongoose.Schema.Types.Mixed,processedAt:Date},{timestamps:true});
const loginCodeSchema=new mongoose.Schema({codeHash:{type:String,required:true,unique:true,index:true},user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},expiresAt:{type:Date,required:true,index:{expireAfterSeconds:0}},usedAt:Date},{timestamps:true});

export const User=mongoose.model('User',userSchema);
export const Product=mongoose.model('Product',productSchema);
export const Order=mongoose.model('Order',orderSchema);
export const WebhookEvent=mongoose.model('WebhookEvent',webhookSchema);
export const LoginCode=mongoose.model('LoginCode',loginCodeSchema);

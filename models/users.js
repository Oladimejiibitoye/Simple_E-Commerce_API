const mongoose = require('mongoose');
const validate = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto')


const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    validate:{
      validator:function(email){
          return validate.isEmail(email)
      },
      message:"Sorry Invalid email Address"
  },
    unique: true,
    required: true
  },
  password: {
    type: String,
    minlength: 6,
    required: true
  },

  otp: {
    type: Number,
    default: null,
  },

  isEmailVerified: {
    type: Boolean,
    default: false,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false,
    required: true
  },
  resetToken: String,
  resetTokenExpired: Date,

  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: { type: Number, required: true },

        price: {
          type: Number,
          ref: 'Product',
          required: true
        }
      }
    ]
  }
});

// hash password before save user doc

userSchema.pre('save', async function(next){

 if(!this.isModified('password')) return next()
  
  this.password = await bcrypt.hash(this.password,12);
  
  next()

})

userSchema.methods.comparePasswords = async (newPassword,originalPassword) => await bcrypt.compare(newPassword,originalPassword);

// method for generating reset token 
userSchema.methods.generateResetToken = function(){

  randomToken = crypto.randomBytes(32).toString('hex')

  this.resetToken = crypto.createHash('sha256').update(randomToken).digest('hex')

  this.resetTokenExpired = Date.now() + 10 * 60 * 1000 // token expires in 5 minutes

  return randomToken
}


userSchema.methods.addToCart = function(product) {
  const cartProductIndex = this.cart.items.findIndex(cp => {
    return cp.productId.toString() === product._id.toString();
  });
  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity,
      price: product.price
    });
  }
  const updatedCart = {
    items: updatedCartItems
  };
  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.removeFromCart = function(productId) {
  const updatedCartItems = this.cart.items.filter(item => {
    return item.productId.toString() !== productId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart = function() {
  this.cart = { items: [] };
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
const Product = require('../models/product');
const User = require('../models/users')
const Order = require('../models/order')


exports.AddProduct = async (req, res, next) => {
  const {title, price, description, imageUrl} = req.body;
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.userId
  })

  await product.save()
  return res.status(201).json({
    "message": "product successfully created",
    "product": product
  })
}


exports.FetchAllProducts = async (req, res, next) => {
  const products = await Product.find()
  return res.status(201).json({
    "products": products
  })
}


exports.AddToCart = async (req, res, next) => {
  const productId = req.params.id;
  const product = await Product.findById(productId);
  if(!product){
    return res.status(404).json({
      'message': 'product not found'
    })
  }
  const user = await User.findById(req.userId);
  if(!user){
    return res.status(404).json({
      'message': 'user not found'
    })
  }
  user.addToCart(product);
  return res.status(201).json({
    'message': 'product successfully added to cart'
  })
}

exports.GetCart = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if(!user){
    return res.status(404).json({
      'message':'user not found'
    });
  }
  return res.status(201).json({
    cart: user.cart.items
  })

}

exports.RemoveFromCart = async (req , res, next) => {
  const productId = req.params.id;
  const product = await Product.findById(productId);
  if(!product){
    return res.status(404).json({
      'message': 'product not found'
    })
  }
  const user = await User.findById(req.userId);
  if(!user){
    return res.status(404).json({
      'message':'user not found'
    });
  }
  user.removeFromCart(productId)
  return res.status(201).json({
    'message': 'item successfully removed from cart'
  })
}
//payment gateway should be added later
exports.GetCheckOut = async (req, res, next) => {
  
  const user = await User.findById(req.userId);
  if(!user){
    return res.status(404).json({
      'message':'user not found'
    });
  }
  let total = 0;
  const products = user.cart.items;
  products.forEach(p => {
    total += p.quantity * p.price;
  });
  return res.status(201).json({
    products: products,
    totalSum: total
  })
}

exports.checkoutSucessful = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if(!user){
    return res.status(404).json({
      'message':'user not found'
    });
  }
  const products = user.cart.items.map(i => {
    return { quantity: i.quantity, product: { ...i.productId._doc } };
  });
  const order = new Order({
    user: {
      name: user.name,
      userId: req.userId
    },
    products: products
  });
  await order.save();
  user.clearCart();
  return res.status(201).json({
    "order": order
  })
};

exports.GetOrder = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if(!user){
    return res.status(404).json({
      'message':'user not found'
    });
  };
  if(user.isAdmin === true){
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    if(!order){
      return res.status(404).json({
        'message':'order not found'
      });
    }
    return res.status(201).json({
      "order": order
  })};
  return res.status(400).json({
    'message':'not authorized'
  })

}
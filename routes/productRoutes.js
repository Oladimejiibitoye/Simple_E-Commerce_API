const Router = require('express').Router();


const productController = require('../controllers/product');
const isAuth = require('../middleware/is-auth')


//routes
Router.post('/addproduct', isAuth, productController.AddProduct);
Router.get('/allproduct', productController.FetchAllProducts);
Router.get('/cart', isAuth, productController.GetCart);
Router.patch('/addtocart/:id', isAuth, productController.AddToCart);
Router.get('/checkout', isAuth, productController.GetCheckOut);
Router.get('/removefromcart/:id', isAuth, productController.RemoveFromCart);
Router.get('/pay', isAuth, productController.checkoutSucessful);
Router.get('/order/:orderId', isAuth, productController.GetOrder);



module.exports = Router
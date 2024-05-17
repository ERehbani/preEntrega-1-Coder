const ProductService = require("../services/product-service");
const productService = new ProductService();
const CartService = require("../services/cart-service");
const cartService = new CartService();
const User = require("../dao/models/user.model");
const UserDTO = require("../dto/user.dto.js");

class ViewsController {
  async viewProducts(req, res) {
    try {
      const userDto = new UserDTO(
        req.user.first_name,
        req.user.last_name,
        req.user.role,
        req.user.age,
        req.user.email
      );

      const findUser = await User.findById(req.session.passport.user);
      if (findUser) req.session.login = true;

      if (req.user.role === "admin") {
        res.send("Esta ruta está restringida para el administrador");
      }
      const { page = 1, limit = 5 } = req.query;

      const productos = await productService.getProducts({
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
      });

      const nuevoArray = productos.docs.map((producto) => {
        const { _id, ...rest } = producto.toObject();
        return { _id, ...rest };
      });
      req.session.usuario = userDto
      res.render("products", {
        nuevoArray,
        req: req.session.login,
        user: userDto,
      });
    } catch (error) {
      console.error("Error al obtener productos", error);
      res.status(500).json({
        status: "error",
        error: "Error interno del servidor",
      });
    }
  }

  async viewDetail(req, res) {
    try {
      const { id } = req.params;
      const producto = await productService.getProductById(id);
      console.log({
        producto,
        productId: producto._id.toString(),
      });
      res.render("detail", {
        producto,
        productId: producto._id.toString(),
      });
    } catch (error) {
      console.log(error);
    }
  }

  async viewCartDetail(req, res) {
    const { cid } = req.params;
    try {
      const cart = await cartService.getCartById(cid);

      if (!cart) {
        console.log("No existe carrito con ese id");
        return res.status(400).json({ error: "Carrito no encontrado" });
      }
      const productsInCart = cart.products.map((item) => ({
        product: item.product,
        quantity: item.quantity,
      }));
      console.log(productsInCart);
      res.render("cart", { products: productsInCart });
    } catch (error) {
      console.log("Error al obtener el carrito");
      res.status(500).json({ error: error });
    }
  }

  async viewLogin(req, res) {
    res.render("login", { req: req.session.login });
  }

  async viewRegister(req, res) {
    res.render("register");
  }

  async viewPerfil(req, res) {
    if (!req.session.login) {
      res.redirect("/login");
    } else {
      const isAdmin = req.session.usuario.role === "Admin";
      res.render("profile", { user: req.session.usuario, isAdmin });
    }
  }

  async realTimeProducts(req, res) {
    try {
      if (req.session.usuario.role === "Admin") {
        res.render("realTimeProducts");
      } else {
        res.redirect("/profile");
      }
    } catch (error) {
      console.log("error en la vista real time", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
  async chat(req, res) {
    try {
      if (req.session.usuario.role === "Admin") {
        res.redirect("/products");
      }
      res.render("chat");
    } catch (error) {
      console.log("error en la vista chat", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
}

module.exports = ViewsController;

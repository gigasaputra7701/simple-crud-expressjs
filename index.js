const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const path = require("path");
const mongoose = require("mongoose");
const rupiah = require("./utils/formatIdr");
const ErrorHandler = require("./utils/ErrorHandler");
const wrapAsync = require("./utils/wrapAsync");
const methodOverride = require("method-override");

const app = express();

const Product = require("./models/product");
const Garment = require("./models/garment");

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/shop_db")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Connection error:", err);
  });

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use(
  session({
    secret: "Secret_key",
  })
);
app.use(flash());

app.use((req, res, next) => {
  res.locals.flash_messages = req.flash("messages");
  next();
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

//Garment
app.get(
  "/garments",
  wrapAsync(async (req, res) => {
    const garments = await Garment.find({});
    res.render("garments/index", { garments });
  })
);

app.get("/garments/create", (req, res) => {
  res.render("garments/create");
});

app.post(
  "/garments",
  wrapAsync(async (req, res) => {
    // No Validate
    const garment = new Garment(req.body);
    await garment.save();
    req.flash("messages", "Berhasil menambahkan data pabrik!");
    res.redirect(`/garments`);
  })
);

app.get(
  "/garments/:id",
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const garment = await Garment.findById(id).populate("products");
    res.render("garments/show", { garment, rupiah });
  })
);

app.get("/garments/:garment_id/products/create", (req, res) => {
  const { garment_id } = req.params;
  res.render("products/create", { garment_id });
});

app.post(
  "/garments/:garment_id/products",
  wrapAsync(async (req, res) => {
    const { garment_id } = req.params;
    const garment = await Garment.findById(garment_id);
    const product = new Product(req.body);
    garment.products.push(product);
    product.garment = garment;
    await garment.save();
    await product.save();
    res.redirect(`/garments/${garment_id}`);
  })
);

app.get(
  "/garments/:id/edit",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const garment = await Garment.findById(id);
    res.render("garments/edit", { garment });
  })
);

app.put(
  "/garments/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Garment.findByIdAndUpdate(id, req.body, { runValidators: true });
    res.redirect(`/garments/${id}`);
  })
);

app.delete(
  "/garments/:garment_id",
  wrapAsync(async (req, res) => {
    const { garment_id } = req.params;
    await Garment.findOneAndDelete({ _id: garment_id });
    res.redirect("/garments/");
  })
);

//Products
app.get(
  "/products",
  wrapAsync(async (req, res) => {
    const { category } = req.query;
    if (category) {
      const products = await Product.find({ category });
      res.render("products/index", { products, category });
    } else {
      const products = await Product.find({});
      res.render("products/index", { products, category: "All" });
    }
  })
);

app.get("/products/create", (req, res) => {
  res.render("products/create");
});

app.post(
  "/products",
  wrapAsync(async (req, res) => {
    const product = new Product(req.body);
    await product.save();
    res.redirect(`/products/${product._id}`);
  })
);

app.get(
  "/products/:id",
  wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const product = await Product.findById(id).populate("garment");
    res.render("products/show", { product, rupiah });
  })
);

app.get(
  "/products/:id/edit",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    res.render("products/edit", { product });
  })
);

app.put(
  "/products/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Product.findByIdAndUpdate(id, req.body, { runValidators: true });
    res.redirect(`/products/${id}`);
  })
);

app.delete(
  "/products/:id",
  wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.redirect("/products/");
  })
);

const validatorHandler = (err) => {
  err.status = 400;
  err.message = Object.values(err.errors).map((item) => item.message);

  return new ErrorHandler(err.message, err.status);
};

app.use((err, req, res, next) => {
  if (err.name === "validationError") err = validatorHandler(err);
  if (err.name === "CastError") {
    err.status = 404;
    err.message = "Product not Found";
  }
  next(err);
});

app.use((err, req, res, next) => {
  const { status = 500, message = "Something went wrong" } = err;
  res.status(status).send(message);
});

app.listen(3000, () => {
  console.log(`Shop App listening on http://127.0.0.1:3000`);
});

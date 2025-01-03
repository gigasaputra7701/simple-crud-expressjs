const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "nama tidak boleh kosong"],
  },
  brand: {
    type: String,
    required: [true, "brand tidak boleh kosong"],
  },
  price: {
    type: Number,
    required: [true, "harga tidak boleh kosong"],
  },
  color: {
    type: String,
    required: [true, "warna tidak boleh kosong"],
  },
  category: {
    type: String,
    enum: ["Baju", "Celana", "Aksesoris", "Jaket"],
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;

const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  toggleFavourite,
  getFavourites,
} = require("../controllers/favouriteController");

// Every favourites route needs a logged-in customer
router.use(protect, authorize("customer"));

router.get("/", getFavourites);
router.post("/:productId", toggleFavourite);

module.exports = router;
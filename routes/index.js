var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("hello");
});

router.use("/db", require("./db/index"));
router.use("/segment", require("./segment/index"));

module.exports = router;

const express = require("express");
const router = express.Router();
const controller = require("../../../controllers/users");
const guard = require("../../../helpers/guard");
const upload = require("../../../helpers/upload");

router.post("/signup", controller.signup);

router.post("/login", controller.login);

router.post("/logout", guard, controller.logout);

router.get("/current", guard, controller.currentUser);

router.patch("/subscription", guard, controller.update);

router.patch("/avatars", guard, upload.single("avatar"), controller.avatars); // обновление аватарки

router.get("/verify/:token", controller.verify); // для отправки email c верификацией
router.post("/verify", controller.repeatEmailVerification); // для повторной отправки email c верификацией, если до этого произошла ошибка

module.exports = router;

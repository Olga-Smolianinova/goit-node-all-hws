const fs = require("fs/promises");
const path = require("path");
const jwt = require("jsonwebtoken");

const Users = require("../repositories/users");
const { HttpCode } = require("../helpers/constants");
const EmailService = require("../services/email");
const { CreateEmailSenderSendgrid } = require("../services/email-sender");
// const { CreateEmailSenderNodemailer } = require("../services/email-sender");

require("dotenv").config();

const UploadAvatarService = require("../services/local-upload");
// const { isError } = require("joi");

const SECRET_KEY = process.env.SECRET_KEY;

const signup = async (req, res, next) => {
  try {
    const user = await Users.findByEmail(req.body.email);

    if (user) {
      return res.status(HttpCode.CONFLICT).json({
        status: "error",
        code: HttpCode.CONFLICT,
        message: "Email in use",
      });
    }
    const { id, email, subscription, avatar, verifyToken } =
      await Users.createUser(req.body);

    // отправляем письмо для верификации. Используем try/catch, т.к. не хотим, чтобы прерывалось выполнение отправки. Пользователя мы регистрируем в любом случае, даже если произошла ошибка при отправке письма, для этого выводим ошибку, что отправка письма не произошла и какая ошибка возникла
    try {
      // создаем сервис
      const emailService = new EmailService(
        process.env.NODE_ENV, // вбросили переменную окружения, где мы вообще находимся
        new CreateEmailSenderSendgrid() // пробрасываем sender, и можем отправить что угодно
      );

      await emailService.sendVerifyEmail(verifyToken, email);
    } catch (error) {
      console.log(error.message);
    }

    return res.status(HttpCode.CREATED).json({
      status: "success",
      code: HttpCode.CREATED,
      data: { id, email, subscription, avatar },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const user = await Users.findByEmail(req.body.email);
    const isValidPassword = await user?.isValidPassword(req.body.password);

    if (!user || !isValidPassword || !user.verify) {
      return res.status(HttpCode.UNAUTHORIZED).json({
        status: "error",
        code: HttpCode.UNAUTHORIZED,
        message: "Email or password is wrong",
      });
    }

    const id = user.id;
    const payload = { id };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });

    await Users.updateToken(id, token);

    return res.json({ status: "success", code: HttpCode.OK, data: { token } });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const id = req.user.id;

    await Users.updateToken(id, null);

    return res.status(HttpCode.NO_CONTENT).json();
  } catch (error) {
    next(error);
  }
};

const currentUser = async (req, res, next) => {
  try {
    const { email, subscription } = req.user;

    return res.status(HttpCode.OK).json({
      status: "success",
      code: HttpCode.OK,
      data: { email, subscription },
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const id = req.user.id;

    if (req.body) {
      const user = await Users.updateUserSubscription(id, req.body);

      const { email, subscription } = user;

      if (user) {
        return res.status(HttpCode.OK).json({
          status: "success",
          code: HttpCode.OK,
          data: { email, subscription },
        });
      }
      return res.json({ status: "error", code: 404, message: "Not Found" });
    }
  } catch (error) {
    next(error);
  }
};

const avatars = async (req, res, next) => {
  try {
    const id = req.user.id;

    const uploads = new UploadAvatarService(process.env.AVATAR_OF_USERS);

    const avatarURL = await uploads.saveAvatar({ idUser: id, file: req.file });

    try {
      await fs.unlink(path.join(process.env.AVATAR_OF_USERS, req.user.avatar));
    } catch (error) {
      console.log(error.message);
    }

    await Users.updateAvatar(id, avatarURL);

    res.json({
      status: "success",
      code: HttpCode.OK,
      data: { avatarURL },
    });
  } catch (error) {
    next(error);
  }
};

// для отправки email c верификацией
const verify = async (req, res, next) => {
  try {
    const user = await Users.findByVerifyToken(req.params.token);

    // если пользователь найден - устанавливаем verificationToken в null, а поле verify ставим равным true в документе пользователя и возвращаем Успешный ответ
    if (user) {
      await Users.updateTokenVerify(user.id, true, null);
      return res.json({
        status: "success",
        code: HttpCode.OK,
        message: "Verification successful",
      });
    }
    return res.status(HttpCode.NOT_FOUND).json({
      status: "error",
      code: HttpCode.NOT_FOUND,
      message: "User not Found",
    });
  } catch (error) {
    next(error);
  }
};

// для повторной отправки email c верификацией, если до этого произошла ошибка
const repeatEmailVerification = async (req, res, next) => {
  try {
    const user = await Users.findByEmail(req.body.email);

    if (user) {
      const { email, verify, verifyToken } = user;

      if (!verify) {
        // если пользователь не верефицировал свой email полностью повторяем отправку письма

        const emailService = new EmailService(
          process.env.NODE_ENV, // вбросили переменную окружения, где мы вообще находимся
          new CreateEmailSenderSendgrid() // пробрасываем sender, и можем отправить что угодно
        );

        await emailService.sendVerifyEmail(verifyToken, email);
        return res.json({
          status: "success",
          code: HttpCode.OK,
          data: { message: "Verification email sent" },
        });
      }
      // Если пользователь уже прошел верификацию
      return res.status(HttpCode.CONFLICT).json({
        status: "error",
        code: HttpCode.CONFLICT,
        message: "Email has been verified",
      });
    }
    return res.status(HttpCode.BAD_REQUEST).json({
      status: "error",
      code: HttpCode.BAD_REQUEST,
      message: "Verification has already been passed",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  logout,
  currentUser,
  update,
  avatars,
  verify,
  repeatEmailVerification,
};

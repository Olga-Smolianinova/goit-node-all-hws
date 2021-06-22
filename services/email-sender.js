// отправка email для верификации пользователя
// Подключение пакетов для отправки email. Используем 2 сервиса, они работают по разному
const sgMail = require("@sendgrid/mail");
const nodemailer = require("nodemailer");

require("dotenv").config();

// Вариант 1 - Sendgrid - создаем Class, у которого будет метод send, который принимает message
class CreateEmailSenderSendgrid {
  async send(msg) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY); // достаем ApiKey из sendgrid, где предварительно зарегистрировались

    return await sgMail.send({
      ...msg,
      from: "Olga Node.js <olga.smol2015@gmail.com>",
    }); // отправляем и указываем откуда
  }
}

// Вариант 2 - Nodemailer
class CreateEmailSenderNodemailer {
  async send(msg) {
    const config = {
      host: "smtp.meta.ua", // взято из учебника
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.NODEMAILER_EMAIL, // взято из лекции; generated ethereal user
        pass: process.env.NODEMAILER_PASSWORD, // generated ethereal password
      },
    };

    const transporter = nodemailer.createTransport(config); // создаем transporter

    //   отправка самого письма
    return await transporter.sendMail({
      ...msg,
      from: process.env.NODEMAILER_EMAIL,
    });
  }
}

module.exports = { CreateEmailSenderSendgrid, CreateEmailSenderNodemailer };

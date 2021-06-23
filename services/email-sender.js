const sgMail = require("@sendgrid/mail");
const nodemailer = require("nodemailer");

require("dotenv").config();

class CreateEmailSenderSendgrid {
  async send(msg) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    return await sgMail.send({
      ...msg,
      from: "Olga Node.js <olga.smol2015@gmail.com>",
    });
  }
}

class CreateEmailSenderNodemailer {
  async send(msg) {
    const config = {
      host: "smtp.meta.ua",
      port: 465,
      secure: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    };

    const transporter = nodemailer.createTransport(config);

    return await transporter.sendMail({
      ...msg,
      from: process.env.NODEMAILER_EMAIL,
    });
  }
}

module.exports = { CreateEmailSenderSendgrid, CreateEmailSenderNodemailer };

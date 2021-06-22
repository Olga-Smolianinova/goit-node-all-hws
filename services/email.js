// подключение email-агента
const Mailgen = require("mailgen");

require("dotenv").config();

class EmailService {
  constructor(env, sender) {
    // env - при отправке писем, мы в письме внедряем ссылку для активации аккаунта;

    this.sender = sender; // sender - это класс из файла email.sender (sendgrid или nodemailer). Вместо наследования от чего-то, мы экземпляр класса пробрасываем внутрь класса и уже этим экземпляром класса пользуемся

    // в зависимости от окружения должны быть разные письма
    switch (env) {
      case "development":
        this.link = "http://localhost:3000/";
        break;

      case "production":
        this.link = "link for production"; // нужно знать доменное имя (DNS); нужно будет сюда добавать когда задеплоим наше приложение, к примеру на heroku
        break;

      default:
        this.link = "http://localhost:3000/";
        break;
    }
  }

  #createTemplateVerificationEmail(verifyToken) {
    // нужно создать генератор. Используем Mailgen. Если есть HTML - то читается этот файл
    const mailGenerator = new Mailgen({
      theme: "neopolitan",
      product: {
        // Appears in header & footer of e-mails
        name: "Olga Node.js",
        link: this.link,
        // Можно добавить  product logo 'https://mailgen.js/img/logo.png'
      },
    });

    // создаем email, прописываем, что именно должно быть в теле письма
    const email = {
      body: {
        // name,
        intro:
          "Welcome to Olga Node.js! We're very excited to have you on board.",
        action: {
          instructions: "To get started with Olga Node.js, please click here:",
          button: {
            color: "#22BC66", // Optional action button color
            text: "Confirm your account",
            link: `${this.link}/api/users/verify/${verifyToken}`, // при клике на эту кнопку, будет get-запрос и мы через  req.params - получим verifyToken, и в зависимости от этого примем решение, нужно с этим письмом что-либо делать дальше или нет
          },
        },
        outro:
          "Need help, or have questions? Just reply to this email, we'd love to help.",
      },
    };

    // создание и возвращение готового HTML
    return mailGenerator.generate(email);
  }

  async sendVerifyEmail(verifyToken, email) {
    const emailHtml = this.#createTemplateVerificationEmail(verifyToken); // создание HTML

    // из документации sandgrid, и немного оптимизировали, удалили неиспользующиеся свойства
    const msg = {
      to: email,
      subject: "Verify your account",
      html: emailHtml,
    };
    // не зная даже кто будет отправлять (sandgrid или nodemailer), получаем результат
    const result = await this.sender.send(msg);
    console.log(result);
  }
}

module.exports = EmailService;

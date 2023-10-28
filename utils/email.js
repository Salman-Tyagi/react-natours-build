// import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { config } from 'dotenv';
config({ path: 'server/.env' });

const email = async options => {
  // if (process.env.NODE_ENV === 'development') {
  //   const transport = nodemailer.createTransport({
  //     host: process.env.MAILSAC_HOST,
  //     port: process.env.MAILSAC_PORT,
  //     auth: {
  //       user: process.env.MAILSAC_USER,
  //       pass: process.env.MAILSAC_API_KEY,
  //     },
  //   });

  //   const mailOptions = {
  //     from: 'Development-mail@email.com',
  //     to: options.email,
  //     subject: options.subject,
  //     html: options.innerHtml,
  //   };

  //   await transport.sendMail(mailOptions);
  // }

  // if (process.env.NODE_ENV === 'production') {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  await sgMail.send(mailOptions);
  // }
};

export default email;

// import nodemailer from 'nodemailer';
// // import sendgridTransport from 'nodemailer-sendgrid-transport';
// // import sendMail from '@sendgrid/mail';
// import path from 'path';
// import ejs from 'ejs';
// import { convert } from 'html-to-text';

// export default class Email {
//   constructor(user, url) {
//     this.to = user.email;
//     this.firstName = user.name.split(' ')[0];
//     this.from = `Salman <${process.env.EMAIL_FROM}>`;
//     this.url = url;
//   }

//   newTransport() {
//     if (process.env.NODE_ENV === 'production') {
//       return nodemailer.createTransport({
//         host: smtp.sendgrid.net,
//         port: 25 || 587,
//         auth: {
//           user: process.env.SENDGRID_USER,
//           pass: process.env.SENDGRID_API_KEY,
//         },
//       });
//     }
//     return nodemailer.createTransport({
//       host: process.env.EMAIL_HOST,
//       port: process.env.EMAIL_PORT,
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASSWORD,
//       },
//     });
//   }

//   async send(template, subject) {
//     // Render the template
//     const html = await ejs.renderFile(
//       path.resolve(`./views/email/${template}.ejs`),
//       {
//         firstName: this.firstName,
//         subject,
//         url: this.url,
//       }
//     );

//     // Define mailOptions
//     const mailOptions = {
//       from: this.from,
//       to: this.to,
//       subject,
//       html,
//       text: convert(html),
//     };

//     // Send the mail
//     await this.newTransport().sendMail(mailOptions);
//   }

//   async sendWelcome() {
//     await this.send('welcome', 'Welcome to the Natours Family!');
//   }

//   async sendPasswordReset() {
//     await this.send(
//       'passwordReset',
//       'Your password reset link! (expires in 10 min)'
//     );
//   }
// }

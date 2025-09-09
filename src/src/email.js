import emailjs from "@emailjs/browser";

export const sendEmail = (templateParams) => {
  return emailjs.send(
    "service_rz4ksxj",     // Service ID do EmailJS
    "template_rz4ksxj",    // Template ID do EmailJS
    templateParams,
    "3odMz4ZugF-JjtWF6"    // Public Key do EmailJS
  );
};

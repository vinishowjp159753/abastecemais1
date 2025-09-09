# 🚀 Pedidos Combustível

Sistema de gerenciamento de pedidos de combustível com **React + Vite**, integrado ao **Firebase Firestore** e **EmailJS**, com áreas de **Cliente** e **Administrador**.

---

## ⚙️ Instalação

```bash
npm install
npm run dev
```

---

## 🔑 Configuração

### Firebase
Edite o arquivo `src/firebase.js` e insira suas credenciais do Firebase.

### EmailJS
No arquivo `src/App.jsx`, configure:
```js
const EMAILJS_SERVICE_ID = "seu_service_id";
const EMAILJS_TEMPLATE_ID = "seu_template_id";
const EMAILJS_USER_ID = "sua_public_key";
```

import React, { useState } from "react";
import "./index.css";

function App() {
  const [mensagem, setMensagem] = useState("");

  return (
    <div className="app-container">
      {/* Cabeçalho com logo */}
      <header className="header">
        <img assets="/logo.png" alt="Logo Abastece+" className="logo" />
        <h1>Abastece+</h1>
      </header>

      {/* Área principal com cards */}
      <main className="content">
        <h2>Bem-vindo ao Abastece+</h2>
        <p>Faça seus pedidos de forma rápida e segura.</p>

        {/* Cards do painel */}
        <div className="cards-container">
          <div className="card">
            <h3>Novo Pedido</h3>
            <p>Solicite combustível em poucos cliques.</p>
            <button className="btn-primary">Fazer Pedido</button>
          </div>

          <div className="card">
            <h3>Meus Pedidos</h3>
            <p>Acompanhe o status e histórico de pedidos.</p>
            <button className="btn-secondary">Consultar</button>
          </div>

          <div className="card">
            <h3>Contato</h3>
            <p>Entre em contato com nosso suporte.</p>
            <button className="btn-secondary">Falar com Suporte</button>
          </div>
        </div>

        {mensagem && <p className="mensagem">{mensagem}</p>}
      </main>
    </div>
  );
}

export default App;

import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { sendEmail } from "./email";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ---------- CONFIGURE AQUI ----------
const EMAILJS_SERVICE_ID = "service_rz4ksxj";
const EMAILJS_TEMPLATE_ID = "service_rz4ksxj";
const EMAILJS_USER_ID = "3odMz4ZugF-JjtWF6";

const ADMIN_LOGIN = "loginadministrador";
const ADMIN_PASSWORD = "159753";
const ADMIN_RESET_EMAIL = "vinicius.andrade.123@hotmail.com";
// -------------------------------------

// Utilitários
function gerarCodigoPedido() {
  return "PED" + Date.now().toString().slice(-8);
}
function gerarSenha6() {
  return Math.random().toString(36).slice(-6).toUpperCase();
}

export default function App() {
  const [view, setView] = useState("home"); // home, cliente, admin

  // Cliente: novo pedido
  const [form, setForm] = useState({
    nome: "",
    nascimento: "",
    cpf: "",
    telefone: "",
    email: "",
    cep: "",
    endereco: "",
    possuiSmiles: false,
    possuiShellbox: false
  });
  const [mensagem, setMensagem] = useState("");

  // Consulta pedido
  const [consultaCodigo, setConsultaCodigo] = useState("");
  const [consultaSenha, setConsultaSenha] = useState("");
  const [resultadoConsulta, setResultadoConsulta] = useState(null);

  // Admin
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    const sess = localStorage.getItem("admin_session");
    if (sess === "ok") setIsAdminAuthenticated(true);
  }, []);

  useEffect(() => {
    if (isAdminAuthenticated) carregarPedidos();
  }, [isAdminAuthenticated]);

  async function carregarPedidos() {
    try {
      const q = query(collection(db, "pedidos"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map(docu => ({ id: docu.id, ...docu.data() }));
      setPedidos(lista);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleNovoPedido(e) {
    e.preventDefault();
    setMensagem("Enviando pedido...");
    const codigo = gerarCodigoPedido();
    const senha = gerarSenha6();
    try {
      await addDoc(collection(db, "pedidos"), {
        codigo,
        senha,
        cliente: { ...form },
        status: "Pendente",
        observacao: "",
        orcamento: { custo: 0, lucro: 0, combustivelEntregue: 0 },
        createdAt: serverTimestamp()
      });

      const templateParams = {
        to_email: form.email,
        to_name: form.nome,
        codigo_pedido: codigo,
        senha_pedido: senha
      };

      try {
        await sendEmail(templateParams);
      } catch (emailErr) {
        console.warn("Falha ao enviar e-mail via EmailJS:", emailErr);
      }

      setMensagem(`Pedido criado! Código: ${codigo} (senha enviada por e-mail)`);
      setForm({ nome: "", nascimento: "", cpf: "", telefone: "", email: "", cep: "", endereco: "", possuiSmiles: false, possuiShellbox: false });
    } catch (err) {
      console.error(err);
      setMensagem("Erro ao criar pedido. Veja o console.");
    }
  }

  async function handleConsultarPedido(e) {
    e.preventDefault();
    setResultadoConsulta(null);
    try {
      const snapshot = await getDocs(collection(db, "pedidos"));
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const encontrado = docs.find(p => p.codigo === consultaCodigo && p.senha === consultaSenha);
      if (!encontrado) {
        setResultadoConsulta({ error: "Pedido não encontrado ou senha incorreta." });
      } else {
        setResultadoConsulta(encontrado);
      }
    } catch (err) {
      console.error(err);
      setResultadoConsulta({ error: "Erro ao consultar pedido." });
    }
  }

  function loginAdmin(e) {
    e.preventDefault();
    if (adminUser === ADMIN_LOGIN && adminPass === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      localStorage.setItem("admin_session", "ok");
      carregarPedidos();
    } else {
      alert("Login ou senha incorretos.");
    }
  }

  function logoutAdmin() {
    setIsAdminAuthenticated(false);
    localStorage.removeItem("admin_session");
    setPedidos([]);
  }

  async function resetAdminPassword() {
    window.open(`mailto:${ADMIN_RESET_EMAIL}?subject=Resetar%20senha&body=Por%20favor,%20resetar%20senha.`);
  }

  async function atualizarPedidoCampo(id, campo, valor) {
    try {
      const docRef = doc(db, "pedidos", id);
      await updateDoc(docRef, { [campo]: valor });
      carregarPedidos();
    } catch (err) {
      console.error(err);
    }
  }

  const orcamentoLabels = pedidos.slice(0, 7).map(p => p.codigo);
  const orcamentoData = pedidos.slice(0, 7).map(p => (p.orcamento?.lucro ?? 0));

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Pedidos Combustível</h1>
          {isAdminAuthenticated && (
            <button onClick={logoutAdmin} className="px-3 py-1 bg-red-500 text-white rounded">Sair</button>
          )}
        </header>

        {view === "home" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => setView("cliente")} className="p-6 bg-blue-600 text-white rounded-lg">Sou Cliente</button>
            <button onClick={() => setView("admin")} className="p-6 bg-gray-800 text-white rounded-lg">Sou Administrador</button>
          </div>
        )}

        {view === "cliente" && (
          <div>
            <button onClick={() => setView("home")} className="text-sm text-blue-600 mb-4">← Voltar</button>
            <h2 className="text-xl font-semibold mb-3">Área do Cliente</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 border rounded">
                <h3 className="font-semibold mb-2">Fazer novo pedido</h3>
                <form onSubmit={handleNovoPedido} className="space-y-2">
                  <input required value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="Nome" className="w-full p-2 border rounded" />
                  <input type="date" value={form.nascimento} onChange={e => setForm({...form, nascimento: e.target.value})} className="w-full p-2 border rounded" />
                  <input value={form.cpf} onChange={e => setForm({...form, cpf: e.target.value})} placeholder="CPF" className="w-full p-2 border rounded" />
                  <input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} placeholder="Telefone" className="w-full p-2 border rounded" />
                  <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className="w-full p-2 border rounded" />
                  <input value={form.cep} onChange={e => setForm({...form, cep: e.target.value})} placeholder="CEP" className="w-full p-2 border rounded" />
                  <input value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} placeholder="Endereço" className="w-full p-2 border rounded" />
                  <button type="submit" className="mt-2 px-4 py-2 bg-green-600 text-white rounded">Enviar pedido</button>
                </form>
                <p className="mt-2 text-sm text-gray-600">{mensagem}</p>
              </div>
              <div className="p-4 border rounded">
                <h3 className="font-semibold mb-2">Consultar pedido</h3>
                <form onSubmit={handleConsultarPedido} className="space-y-2">
                  <input value={consultaCodigo} onChange={e => setConsultaCodigo(e.target.value)} placeholder="Código do pedido" className="w-full p-2 border rounded" />
                  <input value={consultaSenha} onChange={e => setConsultaSenha(e.target.value)} placeholder="Senha (recebida por e-mail)" className="w-full p-2 border rounded" />
                  <button type="submit" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">Consultar</button>
                </form>
                {resultadoConsulta && (
                  <div className="mt-3 p-3 bg-gray-100 rounded">
                    {resultadoConsulta.error ? (
                      <p className="text-red-600">{resultadoConsulta.error}</p>
                    ) : (
                      <div>
                        <p><strong>Código:</strong> {resultadoConsulta.codigo}</p>
                        <p><strong>Status:</strong> {resultadoConsulta.status}</p>
                        <p><strong>Observação:</strong> {resultadoConsulta.observacao || "—"}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === "admin" && (
          <div>
            <button onClick={() => setView("home")} className="text-sm text-blue-600 mb-4">← Voltar</button>
            <h2 className="text-xl font-semibold mb-3">Área do Administrador</h2>
            {!isAdminAuthenticated ? (
              <div className="max-w-md p-4 border rounded">
                <form onSubmit={loginAdmin} className="space-y-2">
                  <input value={adminUser} onChange={e => setAdminUser(e.target.value)} placeholder="Usuário" className="w-full p-2 border rounded" />
                  <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} placeholder="Senha" className="w-full p-2 border rounded" />
                  <div className="flex items-center justify-between">
                    <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Entrar</button>
                    <button type="button" onClick={resetAdminPassword} className="text-sm text-blue-600">Resetar senha</button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <section className="mb-4">
                  <h3 className="font-semibold mb-2">Painel</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded">
                      <h4 className="font-medium">Estatísticas</h4>
                      <p>Total de pedidos: <strong>{pedidos.length}</strong></p>
                    </div>
                    <div className="p-3 border rounded">
                      <h4 className="font-medium">Orçamento (últimos 7 lucros)</h4>
                      <Bar data={{ labels: orcamentoLabels, datasets: [{ label: "Lucro", data: orcamentoData }] }} />
                    </div>
                  </div>
                </section>
                <section>
                  <h3 className="font-semibold mb-2">Pedidos</h3>
                  <div className="overflow-auto">
                    <table className="w-full table-auto border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2">Código</th>
                          <th className="border p-2">Nome</th>
                          <th className="border p-2">Email</th>
                          <th className="border p-2">Status</th>
                          <th className="border p-2">Observação</th>
                          <th className="border p-2">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pedidos.map(p => (
                          <tr key={p.id} className="odd:bg-white even:bg-gray-50">
                            <td className="border p-2">{p.codigo}</td>
                            <td className="border p-2">{p.cliente?.nome}</td>
                            <td className="border p-2">{p.cliente?.email}</td>
                            <td className="border p-2">
                              <select value={p.status} onChange={e => atualizarPedidoCampo(p.id, "status", e.target.value)}>
                                <option>Pendente</option>
                                <option>Em produção</option>
                                <option>Entregue</option>
                                <option>Cancelado</option>
                              </select>
                            </td>
                            <td className="border p-2">
                              <input className="w-full p-1" defaultValue={p.observacao} onBlur={e => atualizarPedidoCampo(p.id, "observacao", e.target.value)} />
                            </td>
                            <td className="border p-2">
                              <button onClick={() => navigator.clipboard.writeText(p.codigo)} className="px-2 py-1 bg-gray-200 rounded">Copiar código</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

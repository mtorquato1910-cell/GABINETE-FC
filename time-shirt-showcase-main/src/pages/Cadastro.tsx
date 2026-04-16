import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Cadastro = () => {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    cpf: "",
    telefone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.senha !== form.confirmarSenha) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    toast({ title: "Conta criada!", description: "Bem-vindo ao Gabinete FC." });
  };

  const fields = [
    { name: "nome", label: "Nome completo", type: "text", placeholder: "SEU NOME COMPLETO" },
    { name: "email", label: "E-mail", type: "email", placeholder: "SEU@EMAIL.COM" },
    { name: "cpf", label: "CPF", type: "text", placeholder: "000.000.000-00" },
    { name: "telefone", label: "Telefone", type: "tel", placeholder: "(00) 00000-0000" },
    { name: "senha", label: "Senha", type: "password", placeholder: "••••••••" },
    { name: "confirmarSenha", label: "Confirmar Senha", type: "password", placeholder: "••••••••" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        <div className="p-6 lg:p-16 flex flex-col justify-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-2">
            Criar Conta
          </h1>
          <p className="text-muted-foreground text-sm lowercase tracking-normal mb-8">
            cadastre-se para acompanhar pedidos, receber drops exclusivos e muito mais.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
                  {field.label}
                </label>
                <input
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.name as keyof typeof form]}
                  onChange={handleChange}
                  required
                  className="w-full bg-background border border-border text-foreground p-4 placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-bold text-sm uppercase tracking-wider"
                />
              </div>
            ))}
            <button
              type="submit"
              className="w-full mt-4 bg-primary text-primary-foreground py-4 font-bold text-lg uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
            >
              Criar Conta
            </button>
          </form>
        </div>

        <div className="hidden lg:flex bg-secondary items-center justify-center p-16">
          <div className="text-center">
            <div className="text-8xl font-bold tracking-tighter text-primary mb-4">GFC</div>
            <p className="text-muted-foreground uppercase tracking-widest text-xs">
              Faça parte do clube
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Cadastro;

import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({ title: "Cadastrado!", description: "Você receberá as novidades em breve." });
      setEmail("");
    }
  };

  return (
    <section className="p-6 lg:p-24 flex flex-col items-center justify-center text-center bg-secondary">
      <h2 className="text-4xl lg:text-7xl font-bold tracking-tighter mb-4 uppercase">
        Fique por dentro.
      </h2>
      <p className="text-muted-foreground text-sm max-w-[40ch] mb-8 lowercase tracking-normal text-balance">
        receba antes de todo mundo. drops exclusivos, promoções e lançamentos direto no seu e-mail.
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-xl flex flex-col sm:flex-row gap-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="SEU@EMAIL.COM"
          className="w-full bg-background border border-border text-foreground p-4 placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-bold text-sm uppercase tracking-wider"
          required
        />
        <button
          type="submit"
          className="shrink-0 bg-primary text-primary-foreground px-8 py-4 font-bold text-sm uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
        >
          Cadastrar
        </button>
      </form>
    </section>
  );
};

export default NewsletterSection;

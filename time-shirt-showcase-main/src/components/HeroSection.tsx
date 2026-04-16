import { Link } from "react-router-dom";
import heroStadium from "@/assets/hero-stadium.jpg";

const HeroSection = () => {
  return (
    <header className="grid grid-cols-1 lg:grid-cols-2 border-b border-border">
      <div className="p-6 lg:p-12 flex flex-col justify-between min-h-[60vh] border-b lg:border-b-0 lg:border-r border-border">
        <div className="text-sm font-bold uppercase tracking-widest flex justify-between text-primary">
          <span>Status: Live</span>
          <span>Vol. 04</span>
        </div>

        <div className="my-12">
          <h1 className="text-5xl lg:text-8xl font-bold tracking-tighter leading-none text-balance mb-6 uppercase">
            A Beleza<br />Do Caos.
          </h1>
          <p className="text-muted-foreground max-w-[45ch] text-sm leading-relaxed lowercase font-medium tracking-normal text-pretty">
            as camisas das maiores seleções do mundo. edições limitadas, estoque reduzido. sem reposição. garanta a sua antes que acabe.
          </p>
        </div>

        <Link
          to="/produtos"
          className="group flex justify-between items-center w-full sm:w-max px-8 py-4 bg-foreground text-background font-bold text-lg uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
        >
          <span>Ver Camisas</span>
          <span className="ml-8 group-hover:translate-x-2 transition-transform">{"->"}</span>
        </Link>
      </div>

      <div className="relative min-h-[40vh] lg:min-h-full bg-secondary p-4 lg:p-8">
        <img
          src={heroStadium}
          width={1920}
          height={1080}
          className="w-full h-full object-cover grayscale contrast-125 brightness-75"
          alt="Estádio"
        />
        <div className="absolute bottom-8 right-8 text-right">
          <div className="text-4xl font-bold text-primary">01</div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Campaign / Rio</div>
        </div>
      </div>
    </header>
  );
};

export default HeroSection;

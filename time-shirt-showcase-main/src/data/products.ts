import jerseyBrasilHome from "@/assets/jersey-brasil-home.jpg";
import jerseyBrasilAway from "@/assets/jersey-brasil-away.jpg";
import jerseyArgentina from "@/assets/jersey-argentina-home.jpg";
import jerseyColombia from "@/assets/jersey-colombia.jpg";
import jerseyUruguai from "@/assets/jersey-uruguai.jpg";
import jerseyPeru from "@/assets/jersey-peru.jpg";

export interface Product {
  id: string;
  name: string;
  team: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  description: string;
  sizes: string[];
}

export const products: Product[] = [
  {
    id: "1",
    name: "Brasil Home 2024",
    team: "Brasil",
    category: "brasil",
    price: 349.90,
    image: jerseyBrasilHome,
    badge: "Lançamento",
    description: "Camisa oficial da Seleção Brasileira. Tecido Dri-FIT ADV, corte jogador. A amarelinha que é a cara do Brasil.",
    sizes: ["P", "M", "G", "GG", "XGG"],
  },
  {
    id: "2",
    name: "Brasil Away 2024",
    team: "Brasil",
    category: "brasil",
    price: 329.90,
    originalPrice: 399.90,
    image: jerseyBrasilAway,
    badge: "Promo",
    description: "Camisa reserva azul da Seleção Brasileira. Design moderno com detalhes em verde e amarelo.",
    sizes: ["P", "M", "G", "GG"],
  },
  {
    id: "3",
    name: "Argentina Home 2024",
    team: "Argentina",
    category: "argentina",
    price: 429.90,
    image: jerseyArgentina,
    badge: "Esgotando",
    description: "A clássica albiceleste. Camisa titular da Argentina com as tradicionais listras azuis e brancas.",
    sizes: ["P", "M", "G", "GG", "XGG"],
  },
  {
    id: "4",
    name: "Colômbia Away 2024",
    team: "Colômbia",
    category: "colombia",
    price: 299.90,
    image: jerseyColombia,
    description: "Camisa reserva da seleção colombiana. Design arrojado em vermelho com detalhes tricolor.",
    sizes: ["P", "M", "G", "GG"],
  },
  {
    id: "5",
    name: "Uruguai Home 2024",
    team: "Uruguai",
    category: "uruguai",
    price: 319.90,
    image: jerseyUruguai,
    description: "A celeste olímpica. Camisa titular do Uruguai em azul celeste clássico.",
    sizes: ["M", "G", "GG"],
  },
  {
    id: "6",
    name: "Peru Away 2024",
    team: "Peru",
    category: "peru",
    price: 279.90,
    originalPrice: 349.90,
    image: jerseyPeru,
    badge: "Sale",
    description: "Camisa reserva da seleção peruana. Design elegante em grená e branco.",
    sizes: ["P", "M", "G", "GG", "XGG"],
  },
];

export const categories = [
  { id: "all", label: "Todos" },
  { id: "brasil", label: "Brasil" },
  { id: "argentina", label: "Argentina" },
  { id: "colombia", label: "Colômbia" },
  { id: "uruguai", label: "Uruguai" },
  { id: "peru", label: "Peru" },
];

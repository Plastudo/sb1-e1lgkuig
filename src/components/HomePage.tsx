//-----------RESUMO----------------------------
//Objetivo geral: Este ficheiro define um componente React chamado `HomePage` que constrói a página inicial de um site para encontrar explicadores. 
//Mostra um cabeçalho com título e descrição, botões que levam a questionários, secções com passos (features) e uma chamada à ação final. 
//Inclui animações simples (com Framer Motion) e ícones decorativos para tornar a página mais dinâmica e agradável.

//--------- FLUXO DO CÒDIGO --------------------
//O código importa React, Framer Motion, componentes de interface, ícones e Link do React Router.
//Cria o componente HomePage, que apresenta a página inicial do site de forma visual e animada.
//Mostra uma secção principal com título e descrição, destacando “encontrar o explicador perfeito”, com animações de entrada suaves.
//Inclui dois botões principais: um para estudantes responderem ao questionário e outro para quem quer ser explicador, ambos com ícones e efeitos visuais.
//Apresenta uma secção de funcionalidades explicando em três passos como o serviço funciona: responder ao questionário, encontrar matches perfeitos e começar a aprender, cada passo com ícone, título e descrição animados.
//Finaliza com uma secção de chamada para ação (CTA), incentivando o utilizador a explorar o marketplace de explicadores, com botão destacado e animado.

import React, { useEffect, useState } from 'react'  // Importa a biblioteca React e hooks necessários
import { Link } from 'react-router-dom'  // Importa 'Link' para navegar entre páginas sem recarregar o site
import { motion } from 'framer-motion'  // Importa 'motion' para criar animações simples e fluidas
import { Button } from './ui/button'  // Importa um componente de botão personalizado do projeto
import { GraduationCap, Search, BookOpen, Users, Star, ArrowRight } from 'lucide-react'  // Importa vários ícones prontos a usar

export const HomePage = () => {  // Declara um componente funcional chamado 'HomePage'
  const [activeSection, setActiveSection] = useState(0); // Estado para controlar qual secção está visível

  // 👇 ADDED: Observa as secções e atualiza o indicador ativo
  useEffect(() => {
    const sections = document.querySelectorAll("section");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(Array.from(sections).indexOf(entry.target));
          }
        });
      },
      { threshold: 0.6 }
    );
    sections.forEach((sec) => observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  return (  // Começa a descrição do que será mostrado no ecrã
    <div 
      className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 relative"
      // 👇 ADDED: ativa o comportamento "scroll snap" vertical com rolagem suave
    >
      {/* Contém toda a página; define altura mínima e fundo com gradiente */}

      {/* 👇 ADDED: Indicadores laterais de secção */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${
              activeSection === i
                ? "bg-green-600 scale-125"
                : "bg-gray-400 opacity-50 hover:opacity-100"
            }`}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-40 h-screen snap-start">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-7xl mb-8">
                Encontre o{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-green-600">
                  explicador perfeito
                </span>{' '}
                para si
              </h1>
              <p className="text-xl leading-relaxed text-gray-600 mb-12">
                Conectamos estudantes com os melhores explicadores de Portugal. 
                Aprenda ao seu ritmo, no seu tempo, com quem entende as suas necessidades.
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-6 justify-center max-w-lg mx-auto"
            >
              <Link to="/student-questionnaire" className="flex-1">
                <Button 
                  size="lg" 
                  className="w-full text-lg py-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
                >
                  <Search className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                  Encontrar explicador ideal
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/tutor-questionnaire" className="flex-1">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full text-lg py-6 border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
                >
                  <GraduationCap className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                  Quero ser explicador
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Floating elements */}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 opacity-20"
        >
          <BookOpen className="h-16 w-16 text-yellow-500" />
        </motion.div>
        
        <motion.div
          animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-32 right-16 opacity-20"
        >
          <Users className="h-20 w-20 text-green-500" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white/60 backdrop-blur-sm h-screen snap-start flex items-center">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center mb-20"
          >
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
              Como funciona?
            </h2>
            <p className="text-xl text-gray-600">
              Um processo simples e eficaz para encontrar o explicador ideal
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 lg:grid-cols-3">
            {[
              {
                icon: Search,
                title: "1. Responda ao questionário",
                description: "Conte-nos sobre as suas necessidades, objetivos e preferências de aprendizagem."
              },
              {
                icon: Users,
                title: "2. Encontre matches perfeitos",
                description: "Ajudamos-te a encontrar o explicador ideal para ti."
              },
              {
                icon: Star,
                title: "3. Comece a aprender",
                description: "Entre em contacto diretamente e comece a sua jornada de aprendizagem personalizada."
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-100 to-green-100">
                  <feature.icon className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-lg text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 h-screen snap-start flex items-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl px-6 text-center"
        >
          <div className="rounded-3xl bg-gradient-to-r from-yellow-100 via-green-100 to-blue-100 p-12 sm:p-16 shadow-xl">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Pronto para começar?
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              Junte-se a milhares de estudantes que já encontraram o seu explicador ideal
            </p>
            <Link to="/marketplace">
              <Button 
                size="lg" 
                className="text-lg py-6 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Explorar explicadores
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

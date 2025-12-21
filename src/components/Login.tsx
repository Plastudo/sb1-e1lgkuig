//-----------RESUMO----------------------------
//Este código define um componente React chamado Login, que mostra um formulário de login usando o componente AuthModal. 
//Ele verifica se o utilizador já está autenticado e, nesse caso, redireciona automaticamente para a página de perfil. 
//Caso contrário, permite que o utilizador faça login e, após concluir, também é redirecionado para a página de perfil.

//--------- FLUXO DO CÒDIGO --------------------
//1. Usuário abre a página de login (Login).
//2. Se já estiver logado (user não é null), useEffect redireciona para /profile.
//3. Caso não esteja logado, o AuthModal aparece.
//4. Usuário digita credenciais e envia o formulário.
//5. AuthModal processa login/registo, verifica erros e, se tudo estiver correto, chama onComplete(userId).
//6. handleComplete é chamado, e o utilizador é redirecionado para /profile.

//---------CODE----------------
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AuthModal } from './AuthModal'

export const Login: React.FC = () => {
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (auth?.user) {
      navigate('/profile')
    }
  }, [auth, navigate])

  // handleComplete seguro
  const handleComplete = (userId?: string) => {
    if (userId) {
      navigate('/profile')
    } else {
      console.warn('userId não recebido no handleComplete')
    }
  }

  if (!auth) {
    return <p>Carregando...</p> // Evita renderizar antes do contexto
  }

  return (
    <AuthModal
      onComplete={handleComplete}
      title="Bem-vindo de volta"
      subtitle="Entre na sua conta para continuar"
    />
  )
}

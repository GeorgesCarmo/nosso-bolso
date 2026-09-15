# 💰 Finanças Compartilhadas (Georges & Luana)

Uma plataforma web moderna e completa para gestão financeira familiar e controle patrimonial compartilhado para casais. O sistema permite acompanhar receitas, despesas, cartões de crédito, parcelamentos, consórcios, carteiras de investimentos (renda fixa e variável) e faturas/vencimentos em tempo real.

---

## ✨ Funcionalidades Principais

- **📊 Dashboard Geral & Consolidador Familiar**:
  - Visão consolidada do patrimônio líquido familiar (Saldo em Caixa + Renda Fixa + Renda Variável).
  - Alternador de contexto: visão conjunta (Georges & Luana) ou individualizada por cônjuge.
  - Gráficos interativos de fluxo histórico (Receitas vs. Despesas) e distribuição de despesas por categoria via Recharts.
  - Conselheiro Financeiro Inteligente (diagnóstico de reserva de emergência e taxa de poupança).

- **⏰ Central de Vencimentos & Contas a Pagar**:
  - Controle de prazos com cálculo automático de dias restantes, alertas de urgência e contas atrasadas.
  - Integração automática de boletos avulsos, parcelas ativas de consórcio e faturas estimadas de cartões de crédito.
  - Linha do tempo diária e ação de 1 clique para "Dar Baixa / Pagar" ou reabrir obrigações.
  - Badge de aviso visual no menu lateral para obrigações vencendo em até 7 dias.

- **💳 Cartões de Crédito & Gestão de Parcelamentos**:
  - Cadastro de cartões de crédito com definição de bandeira, banco, dia de fechamento e dia de vencimento.
  - Controle de compras parceladas com barra de progresso visual de quitação e cálculo do impacto mensal por fatura.

- **🚗 Consórcios & Lances**:
  - Rastreamento das cotas e parcelas do consórcio de veículo (ex: 100 parcelas).
  - Registro de lances embutidos ou livres com impacto no planejamento financeiro.

- **📈 Renda Variável (Ações & FIIs)**:
  - Controle de posição em ações brasileiras e fundos imobiliários com preço médio, cotação atual e rentabilidade.
  - Painel de Proventos e Dividendos recebidos por ativo e por mês.

- **🏦 Renda Fixa Pré-Fixada**:
  - Acompanhamento de CDBs, LCIs, LCAs e Tesouro Direto com taxas contratadas (% CDI ou IPCA+), valor inicial e vencimento.

- **🔒 Autenticação & Modos de Uso**:
  - Login seguro com Supabase Auth (Magic Link, Senha ou OAuth) ou modo de demonstração local com persistência no `localStorage`.
  - Suporte completo a **Tema Claro (Light)** e **Tema Escuro (Dark)**.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Visualização de Dados & Gráficos**: [Recharts](https://recharts.org/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Animações**: [Motion](https://motion.dev/)
- **Backend & Autenticação (Opcional)**: [Supabase](https://supabase.com/)

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior
- Gerenciador de pacotes `npm`, `yarn` ou `pnpm`

### 1. Clonar o repositório
```bash
git clone https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git
cd NOME_DO_REPOSITORIO
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente (Opcional)
Copie o arquivo de exemplo para criar o seu `.env`:
```bash
cp .env.example .env
```

Caso deseje sincronização na nuvem com o Supabase, preencha as credenciais no arquivo `.env`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```
> *Nota: Se você não configurar o Supabase, a aplicação continuará funcionando perfeitamente em modo local (armazenamento seguro no navegador via `localStorage`).*

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

### 5. Compilar para produção
```bash
npm run build
```
Os arquivos otimizados para deploy estático serão gerados na pasta `dist/`.

---

## 📁 Estrutura de Pastas

```
├── public/                 # Recursos públicos e estáticos
├── src/
│   ├── components/         # Módulos de tela e abas do sistema
│   │   ├── AuthModal.tsx       # Modal de autenticação e troca de perfil
│   │   ├── BillsDueTab.tsx     # Central de vencimentos e contas a pagar
│   │   ├── CardsTab.tsx        # Gestão de cartões e compras parceladas
│   │   ├── DashboardTab.tsx    # Visão geral, gráficos e conselheiro financeiro
│   │   ├── DividendsTab.tsx    # Proventos e dividendos recebidos
│   │   ├── FixedTab.tsx        # Controle de aplicações em Renda Fixa
│   │   ├── LoginPage.tsx       # Tela inicial de login e cadastro
│   │   ├── TransactionsTab.tsx # Lançamento de receitas e despesas
│   │   └── VariableTab.tsx     # Carteira de Ações e FIIs
│   ├── data/               # Dados iniciais e mock para demonstração
│   │   └── initialData.ts
│   ├── lib/                # Configurações de clientes externos (Supabase)
│   │   └── supabase.ts
│   ├── utils/              # Funções utilitárias e cálculos financeiros
│   │   ├── billHelpers.ts      # Cálculo de prazos, urgências e faturas
│   │   └── formatters.ts       # Formatadores de moeda (BRL) e data
│   ├── App.tsx             # Componente raiz e gerenciamento de estado
│   ├── main.tsx            # Ponto de entrada React
│   ├── index.css           # Configuração global do Tailwind CSS
│   └── types.ts            # Tipagens e interfaces TypeScript do sistema
├── .env.example            # Modelo de variáveis de ambiente
├── .gitignore              # Regras de exclusão do Git
├── metadata.json           # Metadados da aplicação
├── package.json            # Dependências e scripts do projeto
└── vite.config.ts          # Configuração do Vite
```

---

## 📜 Scripts Disponíveis

- `npm run dev` — Inicia o servidor local de desenvolvimento na porta `3000`.
- `npm run build` — Executa a compilação do TypeScript e gera o build de produção via Vite.
- `npm run preview` — Visualiza localmente o build de produção gerado.
- `npm run lint` — Executa a verificação estática de tipos via `tsc --noEmit`.

---

## 📄 Licença

Este projeto é de uso pessoal e educacional sob a licença MIT. Sinta-se livre para adaptá-lo para a gestão financeira da sua própria família.

# Migração e Integração com o Appwrite - Treino Fofo

Este guia fornece o esquema completo, a estrutura de banco de dados e instruções de configuração para criar e configurar o seu banco de dados no **Appwrite** para o projeto **Treino Fofo**.

Como o Appwrite é uma plataforma Backend-as-a-Service (BaaS) que utiliza banco de dados NoSQL/Documentos com esquemas estritos baseados em atributos, não usamos arquivos SQL comuns. Em vez disso, criamos as **Coleções**, os **Atributos** e os **Índices** descritos abaixo.

---

## 1. Estrutura do Banco de Dados (Database ID: `treinofofo`)

Crie um novo banco de dados no painel do Appwrite com o ID `treinofofo` (ou use o ID do banco de dados existente e substitua nas configurações do seu app).

### 1.1 Coleção: `students` (ID da Coleção: `students`)

Armazena as informações dos alunos/usuários.

- **Definições de Atributos:**
  | Chave do Atributo | Tipo | Tamanho / Detalhes | Obrigatório | Padrão |
  | :--- | :--- | :--- | :--- | :--- |
  | `name` | String | 255 | Sim | - |
  | `pin` | String | 10 | Sim | - |
  | `avatar` | String | 1000 | Sim | - |
  | `createdAt` | String / Datetime | Formato ISO 8601 | Sim | - |

- **Definições de Índices:**
  - **Key:** `idx_pin` | **Type:** `unique` | **Attributes:** `pin`

- **Permissões sugeridas:**
  - `Any` (Qualquer um) ou `Role:all` -> `Read`, `Create`, `Update` (Para permitir login, busca e edição de perfil).

---

### 1.2 Coleção: `groups` (ID da Coleção: `groups`)

Armazena os grupos de músculos vinculados a cada aluno para garantir o isolamento solicitado.

- **Definições de Atributos:**
  | Chave do Atributo | Tipo | Tamanho / Detalhes | Obrigatório | Padrão |
  | :--- | :--- | :--- | :--- | :--- |
  | `studentId` | String | 36 (ID do aluno) | Sim | - |
  | `name` | String | 255 | Sim | - |
  | `image` | String | 1000 | Não (Opcional) | - |
  | `createdAt` | String / Datetime | Formato ISO 8601 | Sim | - |

- **Definições de Índices:**
  - **Key:** `idx_student` | **Type:** `key` | **Attributes:** `studentId`

---

### 1.3 Coleção: `exercises` (ID da Coleção: `exercises`)

Armazena os exercícios cadastrados individualmente para cada aluno e pertencentes a um grupo muscular.

- **Definições de Atributos:**
  | Chave do Atributo | Tipo | Tamanho / Detalhes | Obrigatório | Padrão |
  | :--- | :--- | :--- | :--- | :--- |
  | `studentId` | String | 36 (ID do aluno) | Sim | - |
  | `groupId` | String | 36 (ID do grupo) | Sim | - |
  | `name` | String | 255 | Sim | - |
  | `sets` | Integer | - | Sim | `3` |
  | `reps` | String | 50 | Sim | `10` |
  | `image` | String | 1000 | Não (Opcional) | - |
  | `createdAt` | String / Datetime | Formato ISO 8601 | Sim | - |

- **Definições de Índices:**
  - **Key:** `idx_student` | **Type:** `key` | **Attributes:** `studentId`
  - **Key:** `idx_group` | **Type:** `key` | **Attributes:** `groupId`

---

### 1.4 Coleção: `workout_plans` (ID da Coleção: `workout_plans`)

Armazena o planejamento semanal de treinos para cada aluno (por exemplo, segunda-feira -> Perna).

- **Definições de Atributos:**
  | Chave do Atributo | Tipo | Tamanho / Detalhes | Obrigatório | Padrão |
  | :--- | :--- | :--- | :--- | :--- |
  | `studentId` | String | 36 (ID do aluno) | Sim | - |
  | `dayOfWeek` | String | 50 (Ex: 'Segunda', 'Terça') | Sim | - |
  | `groupId` | String | 36 (ID do grupo muscular) | Não (Opcional) | - |
  | `updatedAt` | String / Datetime | Formato ISO 8601 | Sim | - |

- **Definições de Índices:**
  - **Key:** `idx_student_day` | **Type:** `unique` | **Attributes:** `studentId`, `dayOfWeek`

---

### 1.5 Coleção: `workout_logs` (ID da Coleção: `workout_logs`)

Controla se o aluno finalizou o treino geral em cada data.

- **Definições de Atributos:**
  | Chave do Atributo | Tipo | Tamanho / Detalhes | Obrigatório | Padrão |
  | :--- | :--- | :--- | :--- | :--- |
  | `studentId` | String | 36 (ID do aluno) | Sim | - |
  | `date` | String | 10 (Format: YYYY-MM-DD) | Sim | - |
  | `finished` | Boolean | - | Sim | `false` |
  | `finishedAt` | String / Datetime | Formato ISO 8601 | Não (Opcional) | - |
  | `createdAt` | String / Datetime | Formato ISO 8601 | Sim | - |

- **Definições de Índices:**
  - **Key:** `idx_student_date` | **Type:** `unique` | **Attributes:** `studentId`, `date`

---

### 1.6 Coleção: `workout_log_exercises` (ID da Coleção: `workout_log_exercises`)

Controla o estado de marcação individual de conclusão de cada exercício específico dentro de um treino diário.

- **Definições de Atributos:**
  | Chave do Atributo | Tipo | Tamanho / Detalhes | Obrigatório | Padrão |
  | :--- | :--- | :--- | :--- | :--- |
  | `logId` | String | 36 (ID do workout_log) | Sim | - |
  | `exerciseId` | String | 36 (ID do exercício) | Sim | - |
  | `done` | Boolean | - | Sim | `true` |

- **Definições de Índices:**
  - **Key:** `idx_log_exercise` | **Type:** `unique` | **Attributes:** `logId`, `exerciseId`

---

## 2. Configurações de Storage (Bucket ID: `exercise-images`)

Se sua aplicação permitir que os alunos enviem imagens personalizadas de seus exercícios ou do próprio avatar, crie um **Storage Bucket** com estas configurações:
- **Bucket ID:** `exercise-images`
- **Tamanho máximo do arquivo:** `5MB`
- **Extensões permitidas:** `jpg`, `png`, `webp`, `jpeg`, `gif`
- **Permissões sugeridas:**
  - `Any` (Qualquer um) ou `Role:all` -> `Read`, `Create` (Permitindo carregar e salvar fotos dos treinos).

---

## 3. Script de Autoinstalação (Opcional para Desenvolvedores)

Se preferir automatizar a criação dessas tabelas usando o SDK do Appwrite com uma chave de API Admin do seu Console Appwrite, criamos um script JSON de configuração do Appwrite CLI pronto para importação em `/appwrite_schema.json`.

Você também pode utilizar o endpoint REST `/v1/databases/{databaseId}/collections` para criar programaticamente cada atributo descrito acima no início do desenvolvimento.

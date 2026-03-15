# Catequese App – TODO

## Banco de Dados / Schema
- [x] Tabela alunos (id, slot, nome, telefone, sacramentos, createdAt)
- [x] Tabela aulas (id, numero, data, descricao, audioUrl, audioKey)
- [x] Tabela presencas (id, alunoId, aulaId, status: P/F/J)

## Backend (tRPC)
- [x] Router alunos: list, upsert (criar/editar por slot)
- [x] Router aulas: list, upsert (descrição + áudio)
- [x] Router presencas: list, upsert (P/F/J por aluno+aula)
- [x] Router upload: upload base64 para S3 de áudio
- [x] Router resumo: frequência consolidada por aluno

## Frontend – Layout e Navegação
- [x] Tema visual: azul/branco, mobile-first, fonte limpa
- [x] Bottom navigation bar com 5 abas: Início, Chamada, Alunos, Aulas, Resumo
- [x] Proteção de rotas: apenas usuário autenticado pode editar
- [x] Tela de login com OAuth Manus

## Página: Chamada
- [x] Seletor de data (22 aulas)
- [x] Lista de 25 alunos com botões P / F / J por aluno
- [x] Cores automáticas: verde (P), vermelho (F), amarelo (J)
- [x] Salvar presença com feedback visual (toast)
- [x] Contador de presentes/faltantes no topo

## Página: Alunos
- [x] Lista de 25 slots (11 pré-cadastrados + 14 vazios)
- [x] Editar nome e telefone inline
- [x] Seleção de sacramentos (Batismo, 1ª Comunhão, Crisma, Matrimônio)
- [x] Indicador visual de sacramentos por aluno

## Página: Aulas
- [x] Lista das 22 aulas com data
- [x] Campo de descrição/conteúdo da aula (editável)
- [x] Upload de áudio (mp3/m4a/wav) para cada aula
- [x] Player de áudio integrado com controles de play/pause/progresso
- [x] Indicador de aula com/sem áudio

## Página: Resumo
- [x] Tabela consolidada: aluno, presenças, faltas, justificadas, % frequência
- [x] Escala de cores na % frequência (vermelho→amarelo→verde)
- [x] Cards de estatísticas gerais no topo

## Testes e Entrega
- [x] Vitest: 16 testes passando (routers alunos, aulas, presenças, resumo, auth)
- [x] Checkpoint final
- [x] Entrega ao usuário

## Melhorias
- [x] Upload de PDF por aula na página Aulas (armazenado no S3)
- [x] Botão para visualizar/baixar PDF da aula
- [x] Indicador visual de aula com PDF anexado
- [x] Aumentar limite de upload de 16MB para 100MB (servidor e frontend)
- [x] Corrigir upload de áudio/PDF: substituir base64-via-tRPC por multipart/form-data direto
- [x] Suporte a link do Google Drive para áudio: colar link de compartilhamento e reproduzir no player
- [x] Conversão automática de link Google Drive para URL de reprodução direta
- [x] Corrigir link Google Drive: abrir diretamente no Drive sem tentar reproduzir no app
- [x] Upload de até 7 fotos de documentos por aluno (S3)
- [x] Galeria de fotos por aluno na página Alunos
- [x] Botão para gerar PDF com todas as fotos de um aluno para entregar ao responsável
- [x] Remover aula 01/03 e ajustar calendário para começar em 15/03 (21 aulas no total)
- [x] Adicionar imagem da Basílica de São Pedro no cabeçalho da tela Início
- [ ] Tabela aulas_extras no banco (titulo, tema, descricao, audioUrl, audioKey, audioNome, linkExterno, pdfUrl, pdfKey, pdfNome, data)
- [ ] Backend tRPC: router aulasExtras (list, upsert, delete, setAudioLink)
- [ ] Rota Express de upload de áudio e PDF para aulas extras
- [ ] Página AulasExtras com lista, criação, edição, player de áudio e PDF
- [ ] Aba "Extras" na navegação inferior
- [ ] Aulas extras não contam como presença nem falta
- [ ] Campo de links externos (URL + título) nas Aulas Extras — múltiplos links por aula
- [ ] Campo de texto livre/anotações nas Aulas Extras para orações, reflexões ou avisos
- [ ] Portal público do aluno: rota /aluno sem login, somente-leitura
- [ ] Portal do aluno: mostrar Aulas, Aulas Extras e Resumo de frequência
- [ ] Portal do aluno: ocultar página de Alunos (dados pessoais protegidos)
- [ ] Portal do aluno: ocultar Chamada (não pode alterar presenças)
- [ ] Link do portal do aluno visível na tela Início para o catequista compartilhar
- [ ] Adicionar campos de áudio (link Google Drive), PDF e links externos no formulário de criação de Aulas Extras
- [x] Portal público /portal: visualização somente-leitura sem login
- [x] Portal: mostrar lista de Aulas (conteúdo, PDF, link de áudio)
- [x] Portal: mostrar Aulas Extras (conteúdo, áudio, PDF, links)
- [x] Portal: sem acesso a dados de alunos, chamada ou frequência
- [x] Link de compartilhamento do portal na tela Início

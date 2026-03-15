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

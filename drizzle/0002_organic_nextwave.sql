CREATE TABLE `aluno_fotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoSlot` int NOT NULL,
	`ordem` int NOT NULL DEFAULT 1,
	`url` text NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`nomeArquivo` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aluno_fotos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aulas_extras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`tema` varchar(255),
	`descricao` text,
	`textoLivre` text,
	`data` varchar(20),
	`audioUrl` text,
	`audioKey` varchar(500),
	`audioNome` varchar(255),
	`linkExterno` varchar(2000),
	`pdfUrl` text,
	`pdfKey` varchar(500),
	`pdfNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aulas_extras_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aulas_extras_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aulaExtraId` int NOT NULL,
	`titulo` varchar(255),
	`url` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aulas_extras_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comentarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` enum('aula','aulaExtra') NOT NULL,
	`referenciaId` int NOT NULL,
	`autor` varchar(100) NOT NULL,
	`texto` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comentarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `alunos` MODIFY COLUMN `sacramentos` json;--> statement-breakpoint
ALTER TABLE `aulas` ADD `pdfUrl` text;--> statement-breakpoint
ALTER TABLE `aulas` ADD `pdfKey` varchar(255);--> statement-breakpoint
ALTER TABLE `aulas` ADD `pdfNome` varchar(255);
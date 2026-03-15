CREATE TABLE `alunos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slot` int NOT NULL,
	`nome` varchar(120),
	`telefone` varchar(30),
	`sacramentos` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alunos_id` PRIMARY KEY(`id`),
	CONSTRAINT `alunos_slot_unique` UNIQUE(`slot`)
);
--> statement-breakpoint
CREATE TABLE `aulas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numero` int NOT NULL,
	`data` varchar(10) NOT NULL,
	`descricao` text,
	`audioUrl` text,
	`audioKey` varchar(255),
	`audioNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aulas_id` PRIMARY KEY(`id`),
	CONSTRAINT `aulas_numero_unique` UNIQUE(`numero`)
);
--> statement-breakpoint
CREATE TABLE `presencas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alunoSlot` int NOT NULL,
	`aulaNumero` int NOT NULL,
	`status` enum('P','F','J') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `presencas_id` PRIMARY KEY(`id`)
);

<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260112125540 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE livre (isbn INTEGER NOT NULL, nom VARCHAR(255) NOT NULL, auteur VARCHAR(255) NOT NULL, description VARCHAR(255) NOT NULL, lien_img VARCHAR(255) NOT NULL, nb_stock INTEGER NOT NULL, PRIMARY KEY (isbn))');
        $this->addSql('CREATE TABLE mouvement (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, type BOOLEAN DEFAULT NULL, date_heure DATETIME NOT NULL, nom_prenom VARCHAR(255) DEFAULT NULL, isbn_id INTEGER NOT NULL, CONSTRAINT FK_5B51FC3EAFFF1118 FOREIGN KEY (isbn_id) REFERENCES livre (ISBN) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_5B51FC3EAFFF1118 ON mouvement (isbn_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE livre');
        $this->addSql('DROP TABLE mouvement');
    }
}

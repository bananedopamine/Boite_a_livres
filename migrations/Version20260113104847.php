<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260113104847 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__livre AS SELECT isbn, nom, auteur, description, lien_img, nb_stock, id FROM livre');
        $this->addSql('DROP TABLE livre');
        $this->addSql('CREATE TABLE livre (isbn VARCHAR(255) NOT NULL, nom VARCHAR(255) NOT NULL, auteur VARCHAR(255) NOT NULL, description VARCHAR(255) NOT NULL, lien_img VARCHAR(255) NOT NULL, nb_stock INTEGER NOT NULL, id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL)');
        $this->addSql('INSERT INTO livre (isbn, nom, auteur, description, lien_img, nb_stock, id) SELECT isbn, nom, auteur, description, lien_img, nb_stock, id FROM __temp__livre');
        $this->addSql('DROP TABLE __temp__livre');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_AC634F99CC1CF4E6 ON livre (isbn)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__livre AS SELECT id, isbn, nom, auteur, description, lien_img, nb_stock FROM livre');
        $this->addSql('DROP TABLE livre');
        $this->addSql('CREATE TABLE livre (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, isbn BIGINT NOT NULL, nom VARCHAR(255) NOT NULL, auteur VARCHAR(255) NOT NULL, description VARCHAR(255) NOT NULL, lien_img VARCHAR(255) NOT NULL, nb_stock INTEGER NOT NULL)');
        $this->addSql('INSERT INTO livre (id, isbn, nom, auteur, description, lien_img, nb_stock) SELECT id, isbn, nom, auteur, description, lien_img, nb_stock FROM __temp__livre');
        $this->addSql('DROP TABLE __temp__livre');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_AC634F99CC1CF4E6 ON livre (isbn)');
    }
}

<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260113083224 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__livre AS SELECT isbn, nom, auteur, description, lien_img, nb_stock FROM livre');
        $this->addSql('DROP TABLE livre');
        $this->addSql('CREATE TABLE livre (isbn INTEGER NOT NULL, nom VARCHAR(255) NOT NULL, auteur VARCHAR(255) NOT NULL, description VARCHAR(255) NOT NULL, lien_img VARCHAR(255) NOT NULL, nb_stock INTEGER NOT NULL, PRIMARY KEY (isbn))');
        $this->addSql('INSERT INTO livre (isbn, nom, auteur, description, lien_img, nb_stock) SELECT isbn, nom, auteur, description, lien_img, nb_stock FROM __temp__livre');
        $this->addSql('DROP TABLE __temp__livre');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__livre AS SELECT isbn, nom, auteur, description, lien_img, nb_stock FROM livre');
        $this->addSql('DROP TABLE livre');
        $this->addSql('CREATE TABLE livre (isbn INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, nom VARCHAR(255) NOT NULL, auteur VARCHAR(255) NOT NULL, description VARCHAR(255) NOT NULL, lien_img VARCHAR(255) NOT NULL, nb_stock INTEGER NOT NULL)');
        $this->addSql('INSERT INTO livre (isbn, nom, auteur, description, lien_img, nb_stock) SELECT isbn, nom, auteur, description, lien_img, nb_stock FROM __temp__livre');
        $this->addSql('DROP TABLE __temp__livre');
    }
}

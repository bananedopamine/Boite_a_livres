<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260113090117 extends AbstractMigration
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
        $this->addSql('CREATE TABLE livre (isbn BIGINT NOT NULL, nom VARCHAR(255) NOT NULL, auteur VARCHAR(255) NOT NULL, description VARCHAR(255) NOT NULL, lien_img VARCHAR(255) NOT NULL, nb_stock INTEGER NOT NULL, id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL)');
        $this->addSql('INSERT INTO livre (isbn, nom, auteur, description, lien_img, nb_stock) SELECT isbn, nom, auteur, description, lien_img, nb_stock FROM __temp__livre');
        $this->addSql('DROP TABLE __temp__livre');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_AC634F99CC1CF4E6 ON livre (isbn)');
        $this->addSql('CREATE TEMPORARY TABLE __temp__mouvement AS SELECT id, type, date_heure, nom_prenom, livre_isbn FROM mouvement');
        $this->addSql('DROP TABLE mouvement');
        $this->addSql('CREATE TABLE mouvement (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, type BOOLEAN DEFAULT NULL, date_heure DATETIME NOT NULL, nom_prenom VARCHAR(255) DEFAULT NULL, livre_id INTEGER NOT NULL, CONSTRAINT FK_5B51FC3E37D925CB FOREIGN KEY (livre_id) REFERENCES livre (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO mouvement (id, type, date_heure, nom_prenom, livre_id) SELECT id, type, date_heure, nom_prenom, livre_isbn FROM __temp__mouvement');
        $this->addSql('DROP TABLE __temp__mouvement');
        $this->addSql('CREATE INDEX IDX_5B51FC3E37D925CB ON mouvement (livre_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__livre AS SELECT isbn, nom, auteur, description, lien_img, nb_stock FROM livre');
        $this->addSql('DROP TABLE livre');
        $this->addSql('CREATE TABLE livre (isbn INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, nom VARCHAR(255) NOT NULL, auteur VARCHAR(255) NOT NULL, description VARCHAR(255) NOT NULL, lien_img VARCHAR(255) NOT NULL, nb_stock INTEGER NOT NULL)');
        $this->addSql('INSERT INTO livre (isbn, nom, auteur, description, lien_img, nb_stock) SELECT isbn, nom, auteur, description, lien_img, nb_stock FROM __temp__livre');
        $this->addSql('DROP TABLE __temp__livre');
        $this->addSql('CREATE TEMPORARY TABLE __temp__mouvement AS SELECT id, type, date_heure, nom_prenom, livre_id FROM mouvement');
        $this->addSql('DROP TABLE mouvement');
        $this->addSql('CREATE TABLE mouvement (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, type BOOLEAN DEFAULT NULL, date_heure DATETIME NOT NULL, nom_prenom VARCHAR(255) DEFAULT NULL, livre_isbn INTEGER NOT NULL, CONSTRAINT FK_5B51FC3EC67B0F6B FOREIGN KEY (livre_isbn) REFERENCES livre (ISBN) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO mouvement (id, type, date_heure, nom_prenom, livre_isbn) SELECT id, type, date_heure, nom_prenom, livre_id FROM __temp__mouvement');
        $this->addSql('DROP TABLE __temp__mouvement');
        $this->addSql('CREATE INDEX IDX_5B51FC3EC67B0F6B ON mouvement (livre_isbn)');
    }
}

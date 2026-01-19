<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260119145621 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__mouvement AS SELECT id, type, date_heure, nom_prenom, livre_id FROM mouvement');
        $this->addSql('DROP TABLE mouvement');
        $this->addSql('CREATE TABLE mouvement (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, type BOOLEAN DEFAULT NULL, date_heure DATETIME NOT NULL, nom_prenom VARCHAR(255) DEFAULT NULL, livre_id INTEGER NOT NULL, CONSTRAINT FK_5B51FC3E37D925CB FOREIGN KEY (livre_id) REFERENCES livre (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO mouvement (id, type, date_heure, nom_prenom, livre_id) SELECT id, type, date_heure, nom_prenom, livre_id FROM __temp__mouvement');
        $this->addSql('DROP TABLE __temp__mouvement');
        $this->addSql('CREATE INDEX IDX_5B51FC3E37D925CB ON mouvement (livre_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__mouvement AS SELECT id, type, date_heure, nom_prenom, livre_id FROM mouvement');
        $this->addSql('DROP TABLE mouvement');
        $this->addSql('CREATE TABLE mouvement (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, type BOOLEAN DEFAULT NULL, date_heure DATETIME NOT NULL, nom_prenom VARCHAR(255) DEFAULT NULL, livre_id INTEGER NOT NULL, CONSTRAINT FK_5B51FC3E37D925CB FOREIGN KEY (livre_id) REFERENCES livre (id) ON UPDATE NO ACTION ON DELETE NO ACTION NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('INSERT INTO mouvement (id, type, date_heure, nom_prenom, livre_id) SELECT id, type, date_heure, nom_prenom, livre_id FROM __temp__mouvement');
        $this->addSql('DROP TABLE __temp__mouvement');
        $this->addSql('CREATE INDEX IDX_5B51FC3E37D925CB ON mouvement (livre_id)');
    }
}

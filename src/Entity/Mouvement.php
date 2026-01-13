<?php

/* @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1
 * @dateCreate : 12/01/2026
 * @lastUpdate : 12/01/2026
 */

namespace App\Entity;

use App\Repository\MouvementRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MouvementRepository::class)]
class Mouvement
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(nullable: true)]
    private ?bool $Type = null;

    #[ORM\Column]
    private ?\DateTime $dateHeure = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $nomPrenom = null;

    #[ORM\ManyToOne(targetEntity: Livre::class, inversedBy: 'mouvements')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Livre $livre = null;

    public function getLivre(): ?Livre { return $this->livre; }
    public function setLivre(?Livre $livre): static { $this->livre = $livre; return $this; }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function isType(): ?bool
    {
        return $this->Type;
    }

    public function setType(?bool $Type): static
    {
        $this->Type = $Type;

        return $this;
    }

    public function getDateHeure(): ?\DateTime
    {
        return $this->dateHeure;
    }

    public function setDateHeure(\DateTime $dateHeure): static
    {
        $this->dateHeure = $dateHeure;

        return $this;
    }

    public function getNomPrenom(): ?string
    {
        return $this->nomPrenom;
    }

    public function setNomPrenom(?string $nomPrenom): static
    {
        $this->nomPrenom = $nomPrenom;

        return $this;
    }

    public function getISBN(): ?Livre
    {
        return $this->ISBN;
    }

    public function setISBN(?Livre $ISBN): static
    {
        $this->ISBN = $ISBN;

        return $this;
    }
}

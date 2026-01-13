<?php

namespace App\Entity;

use App\Repository\LivreRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: LivreRepository::class)]
class Livre
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null; // Nouvelle clé primaire

    #[ORM\Column(type: "string", unique: true)] // L'ISBN est maintenant une donnée unique
    private ?string $isbn = null;

    #[ORM\Column(length: 255)]
    private ?string $nom = null;

    #[ORM\Column(length: 255)]
    private ?string $auteur = null;

    #[ORM\Column(length: 255)]
    private ?string $description = null;

    #[ORM\Column(length: 255)]
    private ?string $lienImg = null;

    #[ORM\Column]
    private ?int $NbStock = null;

    /**
     * @var Collection<int, Mouvement>
     */
    #[ORM\OneToMany(targetEntity: Mouvement::class, mappedBy: 'livre')] 
    private Collection $mouvements;

    public function __construct()
    {
        $this->mouvements = new ArrayCollection();
    }

    public function getId(): ?int 
    { 
        return $this->id; 
    }
    
    public function getIsbn(): ?string 
    { 
        return $this->isbn; 
    }

    public function setIsbn(string $isbn): static 
    { 
        $this->isbn = $isbn; return $this; 
    }

    public function getnom(): ?string
    {
        return $this->nom;
    }

    public function setnom(string $nom): static
    {
        $this->nom = $nom;

        return $this;
    }

    public function getauteur(): ?string
    {
        return $this->auteur;
    }

    public function setauteur(string $auteur): static
    {
        $this->auteur = $auteur;

        return $this;
    }

    public function getdescription(): ?string
    {
        return $this->description;
    }

    public function setdescription(string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getLienImg(): ?string
    {
        return $this->lienImg;
    }

    public function setLienImg(string $lienImg): static
    {
        $this->lienImg = $lienImg;

        return $this;
    }

    public function getNbStock(): ?int
    {
        return $this->NbStock;
    }

    public function setNbStock(int $NbStock): static
    {
        $this->NbStock = $NbStock;

        return $this;
    }

    /**
     * @return Collection<int, Mouvement>
     */
    public function getMouvements(): Collection
    {
        return $this->mouvements;
    }

    public function addMouvement(Mouvement $mouvement): static
    {
        if (!$this->mouvements->contains($mouvement)) {
            $this->mouvements->add($mouvement);
            $mouvement->setLivre($this);
        }
        return $this;
    }

    public function removeMouvement(Mouvement $mouvement): static
    {
        if ($this->mouvements->removeElement($mouvement)) {
            // set the owning side to null (unless already changed)
            if ($mouvement->getISBN() === $this) {
                $mouvement->setISBN(null);
            }
        }

        return $this;
    }
}

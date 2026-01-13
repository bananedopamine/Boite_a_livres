<?php

/* @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1
 * @dateCreate : 12/01/2026
 * @lastUpdate : 12/01/2026
 */

namespace App\Repository;

use App\Entity\Mouvement;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class MouvementRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Mouvement::class);
    }

}

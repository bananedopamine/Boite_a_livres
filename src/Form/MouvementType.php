<?php

/* @author : Dufour Marc (marc.dufour@stjosup.com)
 * @version : 1
 * @dateCreate : 12/01/2026
 * @lastUpdate : 12/01/2026
 */

namespace App\Form;

use App\Entity\Livre;
use App\Entity\Mouvement;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class MouvementType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('Type')
            ->add('dateHeure', null, [
                'widget' => 'single_text', 
            ])
            ->add('nomPrenom')
            ->add('livre', EntityType::class, [
                'class' => Livre::class,
                'choice_label' => 'isbn',
                'label' => 'Livre sélectionné',
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => Mouvement::class,
        ]);
    }
}

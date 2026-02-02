<?php

namespace App\Service;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class ExportService
{
    /**
     * Exporte une liste de livres vers un fichier Excel
     * 
     * @param array $livres Tableau d'objets Livre
     * @param bool $isAdmin Si l'utilisateur est admin (affiche colonne Actif)
     * @return string Chemin du fichier généré
     */
    public function exportLivres(array $livres, bool $isAdmin = false): string
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Liste des livres');

        // En-têtes
        $headers = ['ISBN', 'Titre', 'Auteur', 'Stock'];
        if ($isAdmin) {
            $headers[] = 'Actif';
        }
        
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $col++;
        }

        // Style des en-têtes
        $headerRange = $isAdmin ? 'A1:E1' : 'A1:D1';
        $this->styleHeader($sheet, $headerRange);

        // Données
        $row = 2;
        foreach ($livres as $livre) {
            $sheet->setCellValue('A' . $row, $livre->getIsbn());
            $sheet->setCellValue('B' . $row, $livre->getTitre());
            $sheet->setCellValue('C' . $row, $livre->getAuteur());
            $sheet->setCellValue('D' . $row, $livre->getNbStock());
            
            if ($isAdmin) {
                $sheet->setCellValue('E' . $row, $livre->isActif() ? 'Actif' : 'Inactif');
            }
            
            $row++;
        }

        // Auto-dimensionnement des colonnes
        foreach (range('A', $isAdmin ? 'E' : 'D') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Bordures du tableau
        $lastRow = $row - 1;
        $dataRange = $isAdmin ? 'A1:E' . $lastRow : 'A1:D' . $lastRow;
        $this->styleBorders($sheet, $dataRange);

        // Générer le fichier
        $filename = 'export_livres_' . date('Y-m-d_His') . '.xlsx';
        $filepath = sys_get_temp_dir() . '/' . $filename;
        
        $writer = new Xlsx($spreadsheet);
        $writer->save($filepath);

        return $filepath;
    }

    /**
     * Exporte une liste de mouvements vers un fichier Excel
     * 
     * @param array $mouvements Tableau d'objets Mouvement
     * @return string Chemin du fichier généré
     */
    public function exportMouvements(array $mouvements): string
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Historique mouvements');

        // En-têtes
        $headers = ['ISBN', 'Titre', 'Auteur', 'Type', 'Date/Heure', 'Utilisateur'];
        
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $col++;
        }

        // Style des en-têtes
        $this->styleHeader($sheet, 'A1:F1');

        // Données
        $row = 2;
        foreach ($mouvements as $mouvement) {
            $livre = $mouvement->getLivre();
            
            // Gestion livre supprimé
            if ($livre) {
                $sheet->setCellValue('A' . $row, $livre->getIsbn());
                $sheet->setCellValue('B' . $row, $livre->getTitre());
                $sheet->setCellValue('C' . $row, $livre->getAuteur());
            } else {
                $sheet->setCellValue('A' . $row, 'Livre supprimé');
                $sheet->setCellValue('B' . $row, 'Livre supprimé');
                $sheet->setCellValue('C' . $row, 'Livre supprimé');
            }
            
            // Type de mouvement
            $type = $mouvement->isType() ? 'Sortie' : 'Entrée';
            $sheet->setCellValue('D' . $row, $type);
            
            // Date/Heure
            $dateHeure = $mouvement->getDateHeure() 
                ? $mouvement->getDateHeure()->format('d/m/Y H:i:s') 
                : '';
            $sheet->setCellValue('E' . $row, $dateHeure);
            
            // Utilisateur
            $sheet->setCellValue('F' . $row, $mouvement->getNomPrenom());
            
            $row++;
        }

        // Auto-dimensionnement des colonnes
        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Bordures du tableau
        $lastRow = $row - 1;
        $this->styleBorders($sheet, 'A1:F' . $lastRow);

        // Générer le fichier
        $filename = 'export_mouvements_' . date('Y-m-d_His') . '.xlsx';
        $filepath = sys_get_temp_dir() . '/' . $filename;
        
        $writer = new Xlsx($spreadsheet);
        $writer->save($filepath);

        return $filepath;
    }

    /**
     * Applique un style aux en-têtes
     */
    private function styleHeader($sheet, string $range): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 12
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '0D47A1'] // Bleu
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER
            ]
        ]);
    }

    /**
     * Applique des bordures au tableau
     */
    private function styleBorders($sheet, string $range): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000']
                ]
            ]
        ]);
    }
}

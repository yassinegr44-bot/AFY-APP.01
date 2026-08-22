import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DeceasedRecord, AppUser } from '../types';
import { formatOperatorName } from './userUtils';
import moroccoCoatOfArms from '../assets/images/morocco_coat_of_arms_1787413407773.jpg';
import afyLogo from '../assets/images/afy_app_logo_badge_1787413982578.jpg';

// Preload image elements for jsPDF rendering
let coatOfArmsImgElement: HTMLImageElement | null = null;
let afyLogoImgElement: HTMLImageElement | null = null;

if (typeof window !== 'undefined') {
  const img1 = new Image();
  img1.crossOrigin = 'Anonymous';
  img1.src = moroccoCoatOfArms;
  img1.onload = () => { coatOfArmsImgElement = img1; };

  const img2 = new Image();
  img2.crossOrigin = 'Anonymous';
  img2.src = afyLogo;
  img2.onload = () => { afyLogoImgElement = img2; };
}

async function ensureImagesLoaded(): Promise<void> {
  if (coatOfArmsImgElement?.complete && afyLogoImgElement?.complete) return;
  return new Promise<void>((resolve) => {
    let count = 0;
    const check = () => {
      count++;
      if (count >= 2) resolve();
    };

    if (!coatOfArmsImgElement || !coatOfArmsImgElement.complete) {
      const img1 = new Image();
      img1.crossOrigin = 'Anonymous';
      img1.onload = () => { coatOfArmsImgElement = img1; check(); };
      img1.onerror = () => check();
      img1.src = moroccoCoatOfArms;
    } else check();

    if (!afyLogoImgElement || !afyLogoImgElement.complete) {
      const img2 = new Image();
      img2.crossOrigin = 'Anonymous';
      img2.onload = () => { afyLogoImgElement = img2; check(); };
      img2.onerror = () => check();
      img2.src = afyLogo;
    } else check();

    setTimeout(resolve, 600);
  });
}

// Palette de couleurs haute visibilité et fort contraste
const COLOR_PRIMARY: [number, number, number] = [0, 96, 80];       // Vert AFY profond (#006050)
const COLOR_SECONDARY: [number, number, number] = [30, 41, 59];    // Bleu ardoise foncé (#1e293b)
const COLOR_DARK_TEXT: [number, number, number] = [15, 23, 42];    // Noir ardoise (#0f172a) - contraste maximal
const COLOR_MUTED_TEXT: [number, number, number] = [71, 85, 105];  // Gris moyen lisible (#475569)
const COLOR_WHITE: [number, number, number] = [255, 255, 255];     // Blanc pur
const COLOR_ROW_ALT: [number, number, number] = [248, 250, 252];   // Gris très clair (#f8fafc)
const COLOR_BORDER: [number, number, number] = [203, 213, 225];    // Bordure (#cbd5e1)
const COLOR_ACCENT_BG: [number, number, number] = [240, 253, 250];  // Vert d'eau très clair (#f0fdfa)

/**
 * Dessine l'en-tête officiel haute résolution conforme aux exigences réglementaires.
 */
const drawOfficialHeader = (doc: jsPDF, reportTitle: string) => {
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const leftMargin = 12;
  const rightMargin = pageWidth - 12; // 198mm

  // Fond d'en-tête officiel
  doc.setFillColor(252, 253, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(leftMargin - 2, 5, pageWidth - 20, 31, 2, 2, 'FD');

  // --- 1. UPPER LEFT MULTI-LINE FRENCH TEXT BLOCK ---
  doc.setTextColor(15, 23, 42); // Dark slate
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("ROYAUME DU MAROC", leftMargin, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  doc.text("Ministère de la santé et de la protection sociale", leftMargin, 14);
  doc.text("Direction Régionale R.S.K, Rabat- Salé-Kenitra", leftMargin, 17.6);
  doc.text("Délégation de Kénitra", leftMargin, 21.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 96, 80); // #006050
  doc.text("Centre Hospitalier Azzamouri", leftMargin, 24.8);

  // --- 2. OFFICIAL ROYAL COAT OF ARMS OF MOROCCO (CENTER) ---
  const centerX = pageWidth / 2;
  if (coatOfArmsImgElement && coatOfArmsImgElement.complete) {
    try {
      // Centered: 20mm width, 20mm height
      doc.addImage(coatOfArmsImgElement, 'JPEG', centerX - 10, 6, 20, 20);
    } catch (e) {
      console.warn("Coat of Arms render warning", e);
    }
  }

  // --- 3. UPPER RIGHT SECTION (AFY Logo + System Text) ---
  if (afyLogoImgElement && afyLogoImgElement.complete) {
    try {
      doc.addImage(afyLogoImgElement, 'JPEG', rightMargin - 15, 6, 15, 15);
    } catch (e) {
      console.warn("AFY Logo render warning", e);
    }
  }

  // Line 1: SYSTÈME DE GESTION DE LA MORT (medium font)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text("SYSTÈME DE GESTION DE LA MORT", rightMargin, 23, { align: 'right' });

  // Line 2: MORGUE HOSPITALIÈRE (AFY Kénitra) (slightly larger and bolder font)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 96, 80);
  doc.text("MORGUE HOSPITALIÈRE (AFY Kénitra)", rightMargin, 27, { align: 'right' });

  // --- DOUBLE DECORATIVE ACCENT LINES (Emerald & Gold) ---
  // Emerald Line
  doc.setDrawColor(0, 96, 80);
  doc.setLineWidth(0.8);
  doc.line(leftMargin, 33, rightMargin, 33);

  // Gold Line
  doc.setDrawColor(197, 155, 39); // #c59b27 Gold
  doc.setLineWidth(0.3);
  doc.line(leftMargin, 34, rightMargin, 34);

  // --- 4. ABSOLUTE CENTER PROMINENT DARK BLUE TITLE (ON ITS OWN LINE) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 51, 102); // Dark blue #003366
  doc.text(reportTitle, centerX, 40, { align: 'center' });

  // Ligne de séparation fine sous le titre
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(leftMargin, 43, rightMargin, 43);
};

export const generateStatisticsPDF = async (data: any) => {
  await ensureImagesLoaded();
  const { deceased, amputees } = data;
  const inFacilityCount = deceased.filter((d: any) => d.status === 'in_facility').length;
  const releasedCount = deceased.filter((d: any) => d.status === 'released').length;
  const unknownCount = deceased.filter((d: any) => d.isUnknown).length;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ================= EN-TÊTE PAGE 1 =================
  drawOfficialHeader(doc, "RAPPORT : RAPPORT STATISTIQUE ET D'ACTIVITÉ DES DOSSIERS DE DÉCÈS");

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_MUTED_TEXT);
  doc.text(`Période couverte : Jusqu'au ${format(new Date(), 'dd/MM/yyyy')}`, 14, 47);
  doc.text(`Généré le ${format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}`, pageWidth - 14, 47, { align: 'right' });

  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.5);
  doc.line(14, 50, pageWidth - 14, 50);

  // ================= 1. RÉSUMÉ GLOBAL =================
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_SECONDARY);
  doc.text("1. RÉSUMÉ GLOBAL DES ADMISSIONS", 14, 58);

  autoTable(doc, {
    startY: 61,
    head: [['Indicateur Clé', 'Nombre / Effectif', 'Pourcentage']],
    body: [
      ['Total des Admissions enregistrées', deceased.length.toString(), '100%'],
      ['Corps Actuellement Présents (en établissement)', inFacilityCount.toString(), deceased.length > 0 ? `${Math.round((inFacilityCount / deceased.length) * 100)}%` : '0%'],
      ['Corps Libérés / Sortis', releasedCount.toString(), deceased.length > 0 ? `${Math.round((releasedCount / deceased.length) * 100)}%` : '0%'],
      ['Dossiers avec Identité Inconnue (X)', unknownCount.toString(), deceased.length > 0 ? `${Math.round((unknownCount / deceased.length) * 100)}%` : '0%'],
    ],
    theme: 'striped',
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: COLOR_WHITE,
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      textColor: COLOR_DARK_TEXT,
      fontSize: 8.5,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: COLOR_ROW_ALT,
    },
    margin: { left: 14, right: 14 },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 12;

  // ================= 2. ANOMALIES & POINTS D'ATTENTION =================
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_SECONDARY);
  doc.text("2. ANOMALIES ET POINTS DE VIGILANCE", 14, currentY);

  const anomalies: string[] = [];
  if (unknownCount > 0) anomalies.push(`- ${unknownCount} dossier(s) sont répertoriés avec une identité non identifiée (X).`);
  
  const longStayCount = deceased.filter((d: any) => {
    if (d.status === 'in_facility' && d.admissionDate) {
      const days = Math.floor((new Date().getTime() - d.admissionDate.toDate().getTime()) / (1000 * 3600 * 24));
      return days > 30;
    }
    return false;
  }).length;

  if (longStayCount > 0) {
    anomalies.push(`- ${longStayCount} corps présent(s) depuis plus de 30 jours dans la morgue.`);
  }

  const anomalyRows = anomalies.length > 0 
    ? anomalies.map(a => [a])
    : [['Aucune anomalie critique détectée sur l\'ensemble des dossiers actifs.']];

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Observations et Alertes Opérationnelles']],
    body: anomalyRows,
    theme: 'grid',
    headStyles: {
      fillColor: COLOR_SECONDARY,
      textColor: COLOR_WHITE,
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      textColor: COLOR_DARK_TEXT,
      fontSize: 8.5,
      cellPadding: 4,
    },
    margin: { left: 14, right: 14 },
  });

  // ================= 3. REGISTRE DES AMPUTÉS =================
  doc.addPage();
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_SECONDARY);
  doc.text("3. REGISTRE DES PIÈCES ANATOMIQUES & AMPUTATIONS", 14, 20);

  const amputeeTableData = (amputees || []).map((a: any) => [
    `#${a.refNumber || 'N/A'}`,
    `${a.firstName || ''} ${a.name || ''}`.trim() || 'Non renseigné',
    a.bodyParts ? a.bodyParts.join(', ') : '—',
    a.cause || '—',
    a.amputationDateTime ? format(a.amputationDateTime.toDate(), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'Non renseigné'
  ]);

  if (amputeeTableData.length > 0) {
    autoTable(doc, {
      startY: 25,
      head: [['Réf', 'Nom du Patient', 'Partie(s) Amputée(s)', 'Cause', 'Date & Heure']],
      body: amputeeTableData,
      theme: 'grid',
      headStyles: {
        fillColor: COLOR_PRIMARY,
        textColor: COLOR_WHITE,
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        textColor: COLOR_DARK_TEXT,
        fontSize: 8.5,
        cellPadding: 3.5,
      },
      alternateRowStyles: {
        fillColor: COLOR_ROW_ALT,
      },
      margin: { left: 14, right: 14 },
    });
  } else {
    autoTable(doc, {
      startY: 25,
      head: [['Information']],
      body: [["Aucun dossier d'amputation enregistré dans le système."]],
      theme: 'grid',
      headStyles: { fillColor: COLOR_PRIMARY, textColor: COLOR_WHITE },
      styles: { textColor: COLOR_DARK_TEXT, fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
  }

  // ================= 4. TABLE RÉCAPITULATIVE DES DÉCÈS =================
  doc.addPage();
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_SECONDARY);
  doc.text("4. REGISTRE RÉCAPITULATIF DES DÉCÈS", 14, 20);

  const tableData = deceased.map((d: any) => {
    let priseEnCharge = "—";
    if (d.status === 'released' || d.isHistorical) {
      if (d.takingChargeType) {
        priseEnCharge = d.takingChargeType;
        if (d.takingChargeType === 'Autre' && d.takingChargeResponsibleName) {
           priseEnCharge = `Autre (${d.takingChargeResponsibleName})`;
        }
      } else if (d.takingChargeResponsibleName) {
        priseEnCharge = d.takingChargeResponsibleName;
      }
    }
    
    return [
      `#${d.refNumber || 'N/A'}`,
      d.cin || '—',
      d.name || 'Identité Inconnue',
      d.admissionDate ? format(d.admissionDate.toDate(), 'dd/MM/yyyy') : '—',
      d.status === 'released' ? 'SORTI' : 'PRÉSENT',
      d.fridgePosition && d.fridgePosition !== -1 ? `FRIGO-${d.fridgePosition.toString().padStart(2, '0')}` : '—',
      d.cause || '—',
      priseEnCharge
    ];
  });

  autoTable(doc, {
    startY: 25,
    head: [['Réf', 'CIN', 'Nom Complet', 'Date Adm.', 'État Actuel', 'Emplacement', 'Cause suspectée', 'Pris en charge']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: COLOR_WHITE,
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      textColor: COLOR_DARK_TEXT,
      fontSize: 8,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: COLOR_ROW_ALT,
    },
    margin: { left: 14, right: 14 },
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_MUTED_TEXT);
    doc.text(`Page ${i} sur ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    doc.text(`AFY - Rapport Statistique Officiel | Réf : STAT-${format(new Date(), 'yyyyMMdd')}`, 14, pageHeight - 8);
  }

  doc.save(`rapport_statistique_afy_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};

export const generateDossiersPDF = async (records: DeceasedRecord[], users?: AppUser[]) => {
  await ensureImagesLoaded();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ================= PAGE 1: EN-TÊTE OFFICIEL + GUIDE RECHERCHE + TABLE DES MATIÈRES =================
  drawOfficialHeader(doc, "RAPPORT : RAPPORT DE REGISTRE COMPLET DES DOSSIERS DE DÉCÈS");

  // Barre d'aide à la recherche et à la navigation
  doc.setFillColor(...COLOR_ACCENT_BG);
  doc.setDrawColor(...COLOR_PRIMARY);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, 46, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text("🔍 NAVIGATION ET RECHERCHE INTERACTIVE DANS LE DOCUMENT :", 18, 52);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLOR_DARK_TEXT);
  doc.text("• Cliquez sur un dossier ci-dessous pour ouvrir sa fiche | Raccourci [ Ctrl + F ] pour chercher un nom, réf, frigo ou date.", 18, 57);

  // Titre Table des Matières
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLOR_SECONDARY);
  doc.text(`TABLE DES MATIÈRES ET RÉPERTOIRE CLICQUABLE (${records.length} dossiers)`, 14, 68);

  const tocData = records.map((r, idx) => {
    const targetPage = idx + 2;
    return [
      `#${r.refNumber || 'N/A'}`,
      r.name || 'Identité Inconnue',
      r.status === 'released' ? 'SORTI / LIBÉRÉ' : 'PRÉSENT',
      r.admissionDate ? format(r.admissionDate.toDate(), 'dd/MM/yyyy') : '—',
      r.fridgePosition && r.fridgePosition !== -1 ? `FRIGO-${r.fridgePosition.toString().padStart(2, '0')}` : 'Frigo Inconnu',
      `➔ Ouvrir Fiche (Page ${targetPage})`
    ];
  });

  autoTable(doc, {
    startY: 72,
    head: [['Référence', 'Nom et Prénom', 'Statut', 'Date Adm.', 'Position', 'Accès Direct']],
    body: tocData,
    theme: 'grid',
    headStyles: {
      fillColor: COLOR_PRIMARY,
      textColor: COLOR_WHITE,
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    styles: {
      textColor: COLOR_DARK_TEXT,
      fontSize: 8,
      cellPadding: 2.8,
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 46 },
      2: { cellWidth: 32 },
      3: { cellWidth: 24 },
      4: { cellWidth: 22 },
      5: { cellWidth: 32, fontStyle: 'bold', textColor: COLOR_PRIMARY }
    },
    alternateRowStyles: {
      fillColor: COLOR_ROW_ALT,
    },
    margin: { left: 14, right: 14 },
    didDrawCell: (data) => {
      // Rend chaque ligne et cellule de la table des matières interactive et cliquable vers la page du dossier correspondant
      if (data.section === 'body') {
        const targetPage = data.row.index + 2; // Page 1 = Sommaire, Dossier 0 = Page 2, etc.
        doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { pageNumber: targetPage });
      }
    }
  });

  // ================= PAGES INDIVIDUELLES DES DOSSIERS =================
  records.forEach((record, index) => {
    doc.addPage();
    let currentY = 14;
    const isReleased = record.status === 'released';
    const headerBgColor: [number, number, number] = isReleased ? [16, 120, 100] : COLOR_PRIMARY;

    // Entête du dossier
    doc.setFillColor(...headerBgColor);
    doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'F');

    doc.setTextColor(...COLOR_WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`DOSSIER DE DÉCÈS #${record.refNumber || 'N/A'}`, 20, currentY + 9);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dossier ${index + 1} sur ${records.length} | AFY Système Hospitalier`, 20, currentY + 16);

    // Bouton Cliquable de retour au Sommaire / Recherche en haut à droite
    doc.setFillColor(...COLOR_WHITE);
    doc.roundedRect(pageWidth - 68, currentY + 4, 50, 14, 2, 2, 'F');
    doc.setTextColor(...headerBgColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text("⇦ Retour Sommaire", pageWidth - 43, currentY + 10, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text("(Page 1 - Recherche)", pageWidth - 43, currentY + 15, { align: 'center' });
    // Hyperlien direct vers la Page 1 (Sommaire & Recherche)
    doc.link(pageWidth - 68, currentY + 4, 50, 14, { pageNumber: 1 });

    currentY += 28;

    // ================= TABLE 1: INFORMATIONS PERSONNELLES & CIRCONSTANCES =================
    const genderDisplay = record.gender === 'Autre' && record.otherGender 
      ? `Autre (${record.otherGender})` 
      : (record.gender || 'Non renseigné');

    const dateOfDeathStr = record.dateOfDeath 
      ? format(record.dateOfDeath.toDate(), 'dd/MM/yyyy', { locale: fr }) 
      : 'Non renseignée';
    
    const timeOfDeathStr = record.timeOfDeath || 'Non renseignée';

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          { content: '1. INFORMATIONS PERSONNELLES', colSpan: 2, styles: { fillColor: COLOR_SECONDARY, textColor: COLOR_WHITE, fontStyle: 'bold' } },
          { content: '2. CIRCONSTANCES DU DÉCÈS', colSpan: 2, styles: { fillColor: COLOR_SECONDARY, textColor: COLOR_WHITE, fontStyle: 'bold' } }
        ]
      ],
      body: [
        [
          { content: 'Nom complet :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT, cellWidth: 32 } },
          { content: record.name || 'Identité Inconnue', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: 'Cause suspectée :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT, cellWidth: 32 } },
          { content: record.cause || 'Non spécifiée', styles: { textColor: COLOR_DARK_TEXT } }
        ],
        [
          { content: 'CIN :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: record.cin || 'Non renseigné', styles: { textColor: COLOR_DARK_TEXT } },
          { content: 'Date de naissance :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: record.dob ? format(record.dob.toDate(), 'dd/MM/yyyy') : 'Non renseignée', styles: { textColor: COLOR_DARK_TEXT } }
        ],
        [
          { content: "Sexe / Genre :", styles: { fontStyle: "bold", textColor: COLOR_DARK_TEXT } },
          { content: genderDisplay, styles: { textColor: COLOR_DARK_TEXT } },
          { content: 'Date de décès :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: dateOfDeathStr, styles: { textColor: COLOR_DARK_TEXT } }
        ],
        [
          { content: 'Référence :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: `#${record.refNumber}`, styles: { fontStyle: 'bold', textColor: COLOR_PRIMARY } },
          { content: 'Heure de décès :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: timeOfDeathStr, styles: { textColor: COLOR_DARK_TEXT } }
        ],
        [
          { content: 'Origine / Ville :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: `${record.origin || 'Non renseignée'}${record.nationality ? ` (${record.nationality})` : ''}`, styles: { textColor: COLOR_DARK_TEXT } },
          { content: 'Détail Origine :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: record.originDetail || 'Aucun', styles: { textColor: COLOR_DARK_TEXT } }
        ],
        [
          { content: 'Statut Identité :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: record.isUnknown ? 'Inconnue (X)' : 'Identifiée', styles: { textColor: COLOR_DARK_TEXT } },
          { content: 'Entrée effectuée par :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: formatOperatorName(record.createdBy, users, 'Opérateur'), styles: { fontStyle: 'bold', textColor: COLOR_PRIMARY } }
        ]
      ],
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: COLOR_BORDER,
        lineWidth: 0.2,
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // ================= TABLE 2: LOGISTIQUE MORGUE & PRISE EN CHARGE =================
    const admissionDateStr = record.admissionDate 
      ? `${format(record.admissionDate.toDate(), 'dd/MM/yyyy', { locale: fr })} à ${record.admissionTime || '00:00'}`
      : 'Non renseignée';

    const exitDateStr = record.status === 'released' && record.exitDate 
      ? `${format(record.exitDate.toDate(), 'dd/MM/yyyy', { locale: fr })} à ${record.exitTime || '00:00'}`
      : (record.status === 'released' ? 'Sorti' : 'Toujours présent en morgue');

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          { content: '3. LOGISTIQUE MORGUE', colSpan: 2, styles: { fillColor: COLOR_PRIMARY, textColor: COLOR_WHITE, fontStyle: 'bold' } },
          { content: '4. PRISE EN CHARGE & DESTINATION', colSpan: 2, styles: { fillColor: COLOR_PRIMARY, textColor: COLOR_WHITE, fontStyle: 'bold' } }
        ]
      ],
      body: [
        [
          { content: 'Position Frigo :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT, cellWidth: 32 } },
          { content: record.fridgePosition && record.fridgePosition !== -1 ? `FRIGO-${record.fridgePosition.toString().padStart(2, '0')}` : 'Frigo Inconnu', styles: { fontStyle: 'bold', textColor: COLOR_PRIMARY } },
          { content: 'Responsable :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT, cellWidth: 32 } },
          { content: record.takingChargeResponsibleName || 'Non renseigné', styles: { textColor: COLOR_DARK_TEXT } }
        ],
        [
          { content: 'Date Admission :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: admissionDateStr, styles: { textColor: COLOR_DARK_TEXT } },
          { content: 'Type & Lien :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: `${record.takingChargeType || 'Non renseigné'}${record.takingChargeRelation ? ` (${record.takingChargeRelation})` : ''}`, styles: { textColor: COLOR_DARK_TEXT } }
        ],
        [
          { content: 'Date de Sortie :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: exitDateStr, styles: { textColor: COLOR_DARK_TEXT } },
          { content: 'Téléphone :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: record.takingChargePhone || 'Non renseigné', styles: { textColor: COLOR_DARK_TEXT } }
        ],
        [
          { content: 'État Actuel :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: isReleased ? 'Libéré / Sorti' : 'En Établissement', styles: { fontStyle: 'bold', textColor: isReleased ? [16, 120, 100] : COLOR_PRIMARY } },
          { content: 'Transport / Ambulance :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: `${record.transportMethod || 'N/A'}${record.ambulanceNumber ? ` (N° ${record.ambulanceNumber})` : ''}`, styles: { textColor: COLOR_DARK_TEXT } }
        ],
        [
          { content: 'Localisation :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: 'Morgue Principale', styles: { textColor: COLOR_DARK_TEXT } },
          { content: 'Destination Précise :', styles: { fontStyle: 'bold', textColor: COLOR_DARK_TEXT } },
          { content: `${record.destinationType ? `[${record.destinationType}] ` : ''}${record.destinationPrecise || record.destinationCityOrCommune || 'Non renseignée'}`, styles: { textColor: COLOR_DARK_TEXT } }
        ],
        ...(isReleased ? [[
          { content: 'Sortie effectuée par :', styles: { fontStyle: 'bold' as const, textColor: COLOR_DARK_TEXT } },
          { content: formatOperatorName((record as any).releasedByOperator || (record.timeline?.find(e => e.type === 'exit')?.createdBy), users, 'Opérateur'), styles: { fontStyle: 'bold' as const, textColor: COLOR_PRIMARY } },
          { content: '', styles: {} },
          { content: '', styles: {} }
        ]] : [])
      ],
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: COLOR_BORDER,
        lineWidth: 0.2,
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // ================= TABLE 3: CHRONOLOGIE DÉTAILLÉE =================
    const timelineRows = (record.timeline && record.timeline.length > 0)
      ? record.timeline.map(event => [
          event.timestamp ? format(event.timestamp.toDate(), 'dd/MM/yyyy HH:mm', { locale: fr }) : '—',
          event.title || 'Événement',
          event.description || '—',
          formatOperatorName(event.createdBy, users, 'Opérateur')
        ])
      : [['—', 'Admission initiale', 'Dossier créé et enregistré en morgue', formatOperatorName(record.createdBy, users, 'Opérateur')]];

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          { content: '5. CHRONOLOGIE & HISTORIQUE DU DOSSIER', colSpan: 4, styles: { fillColor: COLOR_SECONDARY, textColor: COLOR_WHITE, fontStyle: 'bold' } }
        ],
        ['Date & Heure', 'Événement', 'Détails & Actions', 'Opérateur']
      ],
      body: timelineRows,
      theme: 'grid',
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: COLOR_WHITE,
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.8,
        textColor: COLOR_DARK_TEXT,
        lineColor: COLOR_BORDER,
        lineWidth: 0.2,
      },
      alternateRowStyles: {
        fillColor: COLOR_ROW_ALT,
      },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 40 },
        2: { cellWidth: 70 },
        3: { cellWidth: 40 }
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;

    // ================= TABLE 4: OBSERVATIONS & NOTES =================
    const notesText = record.notes && record.notes.trim().length > 0 
      ? record.notes 
      : 'Aucune observation médicale spécifique enregistrée.';
    
    const exitNotesText = record.exitNotes && record.exitNotes.trim().length > 0 
      ? `\n\nNotes de sortie : ${record.exitNotes}` 
      : '';

    autoTable(doc, {
      startY: currentY,
      head: [
        [{ content: '6. OBSERVATIONS, REMARQUES ET CONDITIONS DE SORTIE', styles: { fillColor: COLOR_PRIMARY, textColor: COLOR_WHITE, fontStyle: 'bold' } }]
      ],
      body: [
        [`${notesText}${exitNotesText}`]
      ],
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3.5,
        textColor: COLOR_DARK_TEXT,
        lineColor: COLOR_BORDER,
        lineWidth: 0.2,
      },
      margin: { left: 14, right: 14 },
    });
  });

  // ================= FOOTER GLOBAL =================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLOR_MUTED_TEXT);
    doc.text(`Page ${i} sur ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    doc.text(`AFY - Registre Officiel des Décès | Réf Export : REG-${format(new Date(), 'yyyyMMdd')}`, 14, pageHeight - 8);
  }

  const fileName = `registre_complet_dossiers_deces_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  doc.save(fileName);
  return fileName;
};

export const generateSingleDossierPDF = (record: DeceasedRecord, users?: AppUser[]) => {
  return generateDossiersPDF([record], users);
};

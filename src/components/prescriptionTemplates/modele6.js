/**
 * Modèle 6 Prescription Body Template Renderer
 * Design for IMPR_ORD = 2 (A5) & MODELE_ORD = 4.
 * Features top dark blue banner ("Cabinet Dr..."), sub-header with blue doctor titles, QR code in center, dark blue ORDONNANCE title, and italicized footer contact bar.
 */

// Helper to generate a clean SVG QR Code pattern
function generateQrSvg(text) {
  const str = String(text || '000000').trim();
  const size = 65;
  
  // Deterministic pseudo-QR pattern generator for visual display
  let cells = [];
  const matrixSize = 21; // standard Version 1 QR matrix size
  const cellSize = size / matrixSize;

  // Initialize matrix
  const matrix = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(false));

  // Finder pattern helper (7x7)
  const addFinderPattern = (startRow, startCol) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startRow + r][startCol + c] = true;
        }
      }
    }
  };

  // Add 3 Finder patterns
  addFinderPattern(0, 0);
  addFinderPattern(0, matrixSize - 7);
  addFinderPattern(matrixSize - 7, 0);

  // Fill data cells deterministically based on string characters
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Skip finder areas
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= matrixSize - 8) ||
        (r >= matrixSize - 8 && c < 8)
      ) {
        continue;
      }
      const val = (r * 31 + c * 17 + Math.abs(hash)) % 3;
      if (val === 0 || val === 1) {
        matrix[r][c] = true;
      }
    }
  }

  let rects = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="#000" />`;
      }
    }
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="background:#fff; padding:2px; border:1px solid #ddd; border-radius:4px;"><rect width="100%" height="100%" fill="#fff" />${rects}</svg>`;
}

export function renderModele6Html({
  doctorNameAr,
  doctorNameFr,
  specialtyFr,
  specialtyAr,
  addressFr,
  phoneFixe,
  ordre,
  dateToPrint,
  assureName,
  assureAge,
  assureTypeAge,
  isFemale,
  agePrefix,
  rxHtml,
  clinicHeader,
  clinicLogo,
  doctor,
  barcodeSvg,
  clinicInfo,
  prescriptionsCount,
  prescriptionsCountLabel,
  documentTitle,
  isBilan
}) {
  const doctorTitleFr = clinicInfo?.doctorNameFr || doctorNameFr || doctor || 'Nom DOcteur Fr';
  const cabinetTitle = clinicInfo?.clinicName || clinicInfo?.NOM_CABINET || `Cabinet Dr ${doctorTitleFr}`;
  const qrSvg = generateQrSvg(clinicInfo?.codeBarre || ordre || '387623');

  return `
    <!-- Modèle 6 Layout -->
    <!-- Top Dark Blue Banner -->
    <div style="background: #1b365d; color: #fff; text-align: center; padding: 8px 12px; font-size: 18px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; border-radius: 2px; margin-bottom: 6px; position: relative;">
      ${cabinetTitle}
      ${clinicLogo ? `<img src="${clinicLogo}" style="position: absolute; right: 10px; top: -10px; max-height: 60px; max-width: 85px; object-fit: contain;" />` : ''}
    </div>

    <!-- Sub-Header 3-Column Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
      <tr>
        <!-- Left French Info -->
        <td style="vertical-align: top; width: 40%; text-align: left;">
          <div style="font-size: 15px; font-weight: bold; color: #1b365d; font-family: 'Segoe UI', Arial, sans-serif;">
            ${doctorTitleFr}
          </div>
          <div style="font-size: 11.5px; font-weight: bold; font-style: italic; color: #111; margin-top: 2px; line-height: 1.35; font-family: 'Segoe UI', Arial, sans-serif;">
            ${specialtyFr || "Spécialiste en l'ensemble des specialité du docteur<br/>ainsi un deuxieme ligne de specialité"}
          </div>
          <div style="font-size: 11px; color: #222; margin-top: 4px; font-family: 'Segoe UI', Arial, sans-serif;">
            N° d'Ordre : ${ordre || '3876/23'}
          </div>
        </td>

        <!-- Center QR Code -->
        <td style="vertical-align: top; width: 20%; text-align: center; padding: 0 4px;">
          ${qrSvg}
        </td>

        <!-- Right Arabic Info -->
        <td style="vertical-align: top; width: 40%; text-align: right;">
          <div style="font-size: 17px; font-weight: bold; color: #1b365d; font-family: 'Amiri', 'Traditional Arabic', sans-serif; line-height: 1.2;">
            ${doctorNameAr || 'الحكيم إسم الحكيم بالعربية'}
          </div>
          <div style="font-size: 12.5px; font-weight: bold; color: #111; margin-top: 2px; line-height: 1.35; font-family: 'Amiri', 'Traditional Arabic', sans-serif;">
            ${specialtyAr || 'إختصاصي في مجموعهة اختصاصات الحكيم<br/>سطر آخر في اختصاصات الحكيم'}
          </div>
          <div style="font-size: 12.5px; font-weight: bold; color: #111; margin-top: 4px; font-family: 'Segoe UI', Arial, sans-serif;">
            Ville Cabinet, le ${dateToPrint}
          </div>
        </td>
      </tr>
    </table>

    <!-- Patient Header -->
    <div style="font-size: 14px; font-family: 'Segoe UI', Arial, sans-serif; color: #000; margin-bottom: 6px;">
      Nom et Prénom : <strong style="font-size: 15px; text-transform: uppercase;">${assureName}</strong> &nbsp;${agePrefix || (isFemale ? 'âgée de' : 'âgé de')} <strong>${assureAge} ${assureTypeAge}</strong>
    </div>

    <!-- Centered Title (Dark Blue Underlined) -->
    <div style="text-align: center; margin: 6px 0 10px 0;">
      <div style="font-size: 22px; font-weight: bold; color: #1b365d; font-family: 'Segoe UI', Arial, sans-serif;">
        ${documentTitle || 'ORDONNANCE'}
      </div>
      <div style="width: 140px; border-bottom: 3px solid #1b365d; margin: 3px auto 0 auto;"></div>
    </div>

    <!-- Main Prescriptions Area -->
    <style>
      .modele6-rx-container > div {
        margin-bottom: 7px !important;
      }
      .modele6-rx-container > div div {
        margin-top: 1px !important;
      }
    </style>
    <div class="modele6-rx-container" style="min-height: 200px; padding: 5px 0;">
      ${rxHtml}
      ${prescriptionsCount !== undefined && prescriptionsCount !== null ? `
        <div style="text-align: right; font-size: 13.5px; font-weight: normal; color: #000; margin-top: 8px; font-family: 'Segoe UI', Arial, sans-serif;">
          ${prescriptionsCount} ${prescriptionsCountLabel || ((isBilan || documentTitle === 'BILAN') ? 'Examen(s)' : 'Médicament(s)')}
        </div>
      ` : ''}
    </div>
  `;
}

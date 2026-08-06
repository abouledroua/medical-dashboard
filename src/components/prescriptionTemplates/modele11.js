/**
 * Modèle 11 Prescription Body Template Renderer
 * Design for IMPR_ORD = 2 (A5) & MODELE_ORD = 9.
 * Features top bold underlined "CABINET MEDICO - CHIRURGICAL" header, 3-column sub-header (FR / Logo / AR), date & patient flex bar with right barcode SVG, ORDONNANCE title, rx list with quantity/BTE on right, and centered slogan + icon contact footer.
 */

export function renderModele11Html({
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
  documentTitle,
  prescriptionsCount,
  prescriptionsCountLabel,
  isBilan
}) {
  const doctorTitleFr = clinicInfo?.doctorNameFr || doctorNameFr || doctor || 'Nom DOcteur Fr';
  const cabinetBanner = clinicInfo?.clinicName || clinicInfo?.NOM_CABINET || clinicInfo?.nomCabinet || clinicInfo?.bannerTitle || clinicInfo?.typeCabinet || 'CABINET MEDICO – CHIRURGICAL';
  const city = clinicInfo?.city || clinicInfo?.VILLE || 'Ville Cabinet';

  return `
    <!-- Modèle 11 Layout -->
    <!-- Top Cabinet Banner Title -->
    <div style="text-align: center; margin-bottom: 6px;">
      <div style="font-size: 21px; font-weight: bold; color: #000; text-decoration: underline; letter-spacing: 0.5px; font-family: 'Segoe UI', Arial, sans-serif;">
        ${cabinetBanner}
      </div>
    </div>

    <!-- 3-Column Sub-Header Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
      <tr>
        <!-- Left Doctor Info (French) -->
        <td style="vertical-align: top; width: 38%; text-align: center;">
          <div style="font-size: 15px; font-weight: bold; color: #000; font-family: 'Segoe UI', Arial, sans-serif;">
            ${doctorTitleFr}
          </div>
          <div style="font-size: 12px; font-weight: bold; color: #111; margin-top: 2px; line-height: 1.35; font-family: 'Segoe UI', Arial, sans-serif;">
            ${specialtyFr || "Spécialiste en l'ensemble des<br/>specialité du docteur<br/>ainsi un deuxieme ligne de specialité"}
          </div>
          <div style="font-size: 11.5px; color: #222; margin-top: 3px; font-family: 'Segoe UI', Arial, sans-serif;">
            N° d'ordre : ${ordre || '3876/23'}
          </div>
        </td>

        <!-- Center Logo Column -->
        <td style="vertical-align: middle; width: 24%; text-align: center; padding: 0 4px;">
          ${clinicLogo ? `<img src="${clinicLogo}" style="max-height: 75px; max-width: 110px; object-fit: contain;" />` : `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <svg width="45" height="40" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="45" r="40" stroke="#0d9488" stroke-width="4" fill="none"/>
                <path d="M45 25 C30 25 20 40 20 55 C20 70 35 75 50 65 C60 58 55 45 45 45" stroke="#0d9488" stroke-width="5" fill="none" stroke-linecap="round"/>
                <text x="32" y="58" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#0f766e">ORL</text>
              </svg>
              <div style="font-size: 10px; font-weight: bold; color: #0f766e; margin-top: 2px;">Dr. A. BENKERMI</div>
              <div style="font-size: 8px; color: #0d9488;">Spécialiste en ORL</div>
            </div>
          `}
        </td>

        <!-- Right Doctor Info (Arabic) -->
        <td style="vertical-align: top; width: 38%; text-align: center;">
          <div style="font-size: 17.5px; font-weight: bold; font-family: 'Amiri', 'Traditional Arabic', sans-serif; color: #000; line-height: 1.2;">
            ${doctorNameAr || 'الحكيم إسم الحكيم بالعربية'}
          </div>
          <div style="font-size: 13px; font-weight: bold; font-family: 'Amiri', 'Traditional Arabic', sans-serif; color: #000; margin-top: 2px; line-height: 1.35;">
            ${specialtyAr || 'إختصاصي في مجموعهة اختصاصات<br/>الحكيم<br/>سطر آخر في اختصاصات الحكيم'}
          </div>
        </td>
      </tr>
    </table>

    <!-- Date Line (Right Aligned) -->
    <div style="text-align: right; font-size: 14px; color: #000; font-family: 'Segoe UI', Arial, sans-serif; margin-bottom: 8px;">
      ${city}, le : <strong>${dateToPrint}</strong>
    </div>

    <!-- Patient Header Row 1 -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-family: 'Segoe UI', Arial, sans-serif; color: #000;">
      <div style="font-size: 14px;">
        Nom et Prénom : <strong style="font-size: 15px; text-transform: uppercase;">${assureName}</strong>
      </div>
      <div style="font-size: 14px;">
        ${agePrefix || (isFemale ? 'âgée de' : 'âgé de')} <strong>${assureAge} ${assureTypeAge}</strong>
      </div>
    </div>

    <!-- Title ORDONNANCE & Barcode SVG Row 2 (Same Line) -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-family: 'Segoe UI', Arial, sans-serif;">
      <div style="flex: 1; text-align: center; padding-right: 15px;">
        <span style="font-size: 22px; font-weight: bold; text-decoration: underline; letter-spacing: 0.5px; color: #000;">
          ${documentTitle || 'ORDONNANCE'}
        </span>
      </div>
      <div style="text-align: right; flex-shrink: 0;">
        ${barcodeSvg}
      </div>
    </div>

    <!-- Main Prescriptions Area -->
    <style>
      .modele11-rx-container {
        font-size: 13px !important;
      }
      .modele11-rx-container > div {
        margin-bottom: 6px !important;
        font-size: 13px !important;
      }
      .modele11-rx-container > div div {
        margin-top: 1px !important;
        font-size: 12.5px !important;
      }
      .modele11-rx-container > div div > div:first-child {
        font-size: 13.5px !important;
      }
    </style>
    <div class="modele11-rx-container" style="min-height: 200px; padding: 5px 0;">
      ${rxHtml}
      ${prescriptionsCount !== undefined && prescriptionsCount !== null ? `
        <div style="text-align: right; font-size: 13.5px; font-weight: normal; color: #000; margin-top: 8px; font-family: 'Segoe UI', Arial, sans-serif;">
          ${prescriptionsCount} ${prescriptionsCountLabel || ((isBilan || documentTitle === 'BILAN') ? 'Examen(s)' : 'Médicament(s)')}
        </div>
      ` : ''}
    </div>
  `;
}

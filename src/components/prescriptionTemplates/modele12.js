/**
 * Modèle 12 Prescription Body Template Renderer
 * Design for IMPR_ORD = 2 (A5) & MODELE_ORD = 10.
 * Features 3-column sub-header with ornamental "-o-" dividers, spaced out "O R D O N N A N C E" title, watermark background logo, rx list with quantity/BTE on right, and bottom slogan + right barcode footer.
 */

export function renderModele12Html({
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
  documentTitle
}) {
  const doctorTitleFr = clinicInfo?.doctorNameFr || doctorNameFr || doctor || 'Nom DOcteur Fr';
  const cabinetTitle = clinicInfo?.clinicName || clinicInfo?.NOM_CABINET || `Cabinet Dr ${doctorTitleFr}`;
  const displayTitle = documentTitle ? documentTitle : 'O R D O N N A N C E';

  return `
    <!-- Modèle 12 Layout -->
    <!-- Top Cabinet Title -->
    <div style="text-align: center; font-size: 16px; font-weight: 900; color: #000; font-family: 'Segoe UI', Arial, sans-serif; margin-bottom: 6px; letter-spacing: 1px;">
      ${(cabinetTitle).toUpperCase()}
    </div>

    <!-- 3-Column Sub-header Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
      <tr>
        <!-- Right Arabic Doctor Info -->
        <td style="vertical-align: top; width: 38%; text-align: right;">
          <div style="font-size: 18px; font-weight: bold; font-family: 'Amiri', 'Traditional Arabic', sans-serif; color: #000; line-height: 1.2;">
            ${doctorNameAr || 'الحكيم إسم الحكيم بالعربية'}
          </div>
          ${ornamentalDivider}
          <div style="font-size: 13px; font-weight: bold; font-family: 'Amiri', 'Traditional Arabic', sans-serif; color: #000; line-height: 1.35;">
            ${specialtyAr || 'إختصاصي في مجموعهة اختصاصات ال<br/>سطر آخر في اختصاصات الحكيم'}
          </div>
          ${ornamentalDivider}
          <div style="font-size: 12.5px; color: #111; font-family: 'Segoe UI', Arial, sans-serif;">
            📞 ${phoneFixe || '0558 413 240'}
          </div>
        </td>
      </tr>
    </table>

    <!-- Title & Date Row -->
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 6px; margin-bottom: 6px;">
      <div style="font-size: 21px; font-weight: 900; letter-spacing: 3px; font-family: 'Segoe UI', Arial, sans-serif; color: #000;">
        O R D O N N A N C E
      </div>
      <div style="font-size: 14px; color: #000; font-family: 'Segoe UI', Arial, sans-serif;">
        Ville Cabinet, le : <strong>${dateToPrint}</strong>
      </div>
    </div>

    <!-- Patient Header Bar -->
    <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; font-family: 'Segoe UI', Arial, sans-serif; color: #000; margin-bottom: 6px;">
      <div>
        Nom et Prénom : <strong style="font-size: 15px; text-transform: uppercase;">${assureName}</strong>
      </div>
      <div>
        ${agePrefix || (isFemale ? 'âgée de' : 'âgé de')} <strong>${assureAge} ${assureTypeAge}</strong>
      </div>
    </div>

    <!-- Main Prescriptions Area with Background Watermark -->
    <style>
      .modele12-rx-container {
        font-size: 13px !important;
      }
      .modele12-rx-container > div {
        margin-bottom: 6px !important;
        font-size: 13px !important;
      }
      .modele12-rx-container > div div {
        margin-top: 1px !important;
        font-size: 12.5px !important;
      }
      .modele12-rx-container > div div > div:first-child {
        font-size: 13.5px !important;
      }
    </style>
    <div style="position: relative; min-height: 200px; padding: 5px 0;">
      <!-- Watermark Background Logo -->
      <div style="position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); opacity: 0.08; pointer-events: none; z-index: 0; text-align: center; width: 70%;">
        ${clinicLogo ? `<img src="${clinicLogo}" style="max-height: 200px; width: auto; object-fit: contain;" />` : `
          <svg width="200" height="160" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="45" r="40" stroke="#000" stroke-width="4" fill="none"/>
            <path d="M45 25 C30 25 20 40 20 55 C20 70 35 75 50 65 C60 58 55 45 45 45" stroke="#000" stroke-width="5" fill="none" stroke-linecap="round"/>
            <text x="32" y="58" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#000">ORL</text>
          </svg>
        `}
      </div>

      <!-- Prescriptions Content (Foreground) -->
      <div class="modele12-rx-container" style="position: relative; z-index: 1;">
        ${rxHtml}
        ${prescriptionsCount !== undefined && prescriptionsCount !== null ? `
          <div style="text-align: right; font-size: 13.5px; font-weight: normal; color: #000; margin-top: 8px; font-family: 'Segoe UI', Arial, sans-serif;">
            ${prescriptionsCount} Médicament(s)
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

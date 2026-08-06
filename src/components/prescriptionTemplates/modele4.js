/**
 * Modèle 4 Prescription Body Template Renderer
 * Design for IMPR_ORD = 2 (A5) & MODELE_ORD = 2.
 * Features top cabinet title line, 3-column header (FR / Logo / AR), date & patient flex bar, centered title, rx list with quantity/BTE on right, and bottom slogan + right barcode layout.
 */

export function renderModele4Html({
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
  documentSubtitle
}) {
  const doctorTitleFr = clinicInfo?.doctorNameFr || doctorNameFr || doctor || 'Nom DOcteur Fr';
  const cabinetTitle = clinicInfo?.clinicName || clinicInfo?.NOM_CABINET || `Cabinet Dr ${doctorTitleFr}`;

  return `
    <!-- Modèle 4 Layout -->
    <!-- Top Cabinet Title -->
    <div style="text-align: center; margin-bottom: 4px;">
      <div style="font-size: 19px; font-weight: bold; color: #000; font-family: 'Segoe UI', Arial, sans-serif; display: inline-block; border-bottom: 2px solid #000; padding-bottom: 2px;">
        ${cabinetTitle}
      </div>
    </div>

    <!-- 3-Column Header Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
      <tr>
        <!-- Left Doctor Info (French) -->
        <td style="vertical-align: top; width: 38%; text-align: center;">
          <div style="font-size: 13.5px; font-weight: bold; color: #000; font-family: 'Segoe UI', Arial, sans-serif;">
            ${doctorTitleFr}
          </div>
          <div style="font-size: 11.5px; font-weight: bold; color: #000; margin-top: 2px; line-height: 1.3; font-family: 'Segoe UI', Arial, sans-serif;">
            ${specialtyFr || "Spécialiste en l'ensemble des<br/>specialité du docteur<br/>ainsi un deuxieme ligne de specialité"}
          </div>
          <div style="font-size: 11px; color: #111; margin-top: 3px; font-family: 'Segoe UI', Arial, sans-serif;">
            N° d'ordre : ${ordre || '3876/23'}
          </div>
          <div style="font-size: 10.5px; color: #111; margin-top: 2px; font-family: 'Segoe UI', Arial, sans-serif;">
            ${addressFr || 'Adreese du cabinet du docteur'}
          </div>
          <div style="font-size: 10.5px; color: #111; margin-top: 1px; font-family: 'Segoe UI', Arial, sans-serif;">
            Tel : ${phoneFixe || '0558 413 240'}
          </div>
        </td>

        <!-- Center Logo Column -->
        <td style="vertical-align: top; width: 24%; text-align: center; padding: 0 4px;">
          ${clinicLogo ? `<img src="${clinicLogo}" style="max-height: 70px; max-width: 105px; object-fit: contain;" />` : `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <svg width="42" height="38" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <td style="vertical-align: top; width: 38%; text-align: right;">
          <div style="font-size: 16px; font-weight: bold; font-family: 'Amiri', 'Traditional Arabic', 'Segoe UI', Arial, sans-serif; color: #000; line-height: 1.2;">
            ${doctorNameAr || 'الحكيم إسم الحكيم بالعربية'}
          </div>
          <div style="font-size: 12.5px; font-weight: bold; font-family: 'Amiri', 'Traditional Arabic', 'Segoe UI', Arial, sans-serif; color: #000; margin-top: 2px; line-height: 1.35;">
            ${specialtyAr || 'إختصاصي في مجموعهة اختصاصات الحكيم<br/>سطر آخر في اختصاصات الحكيم'}
          </div>
          <div style="font-size: 11.5px; color: #111; margin-top: 3px; font-family: 'Amiri', 'Traditional Arabic', sans-serif;">
            التنظيم الوطني للأطباء : ${ordre || '3876/23'}
          </div>
          <div style="font-size: 11.5px; color: #111; margin-top: 1px; font-family: 'Amiri', 'Traditional Arabic', sans-serif;">
            ${phoneFixe || '0558 413 240'} : الهاتف
          </div>
        </td>
      </tr>
    </table>

    <!-- Date Line (Right Aligned) -->
    <div style="text-align: right; font-size: 14px; color: #000; font-family: 'Segoe UI', Arial, sans-serif; margin-bottom: 4px;">
      Ville Cabinet, le : <strong>${dateToPrint}</strong>
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

    <!-- Centered Title -->
    <div style="text-align: center; margin: 6px 0 10px 0;">
      <span style="font-size: 21px; font-weight: bold; text-decoration: underline; letter-spacing: 1px; font-family: 'Segoe UI', Arial, sans-serif; color: #000;">${documentTitle || 'ORDONNANCE'}</span>
      ${documentSubtitle ? `
        <div style="font-size: 13.5px; font-weight: bold; color: #000; margin-top: 6px; font-style: italic; font-family: 'Segoe UI', Arial, sans-serif;">
          ${documentSubtitle}
        </div>
      ` : ''}
    </div>

    <!-- Main Prescriptions Area -->
    <style>
      .modele4-rx-container > div {
        margin-bottom: 7px !important;
      }
      .modele4-rx-container > div div {
        margin-top: 1px !important;
      }
    </style>
    <div class="modele4-rx-container" style="min-height: 200px; padding: 5px 0;">
      ${rxHtml}
      ${prescriptionsCount !== undefined && prescriptionsCount !== null ? `
        <div style="text-align: right; font-size: 13.5px; font-weight: normal; color: #000; margin-top: 8px; font-family: 'Segoe UI', Arial, sans-serif;">
          ${prescriptionsCount} Médicament(s)
        </div>
      ` : ''}
    </div>
  `;
}

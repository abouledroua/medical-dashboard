/**
 * Modèle 7 Prescription Body Template Renderer
 * Design for IMPR_ORD = 2 (A5) & MODELE_ORD = 5.
 * Features top left logo + French info side-by-side, right date line, centered ORDONNANCE, rx list with quantity/BTE on right, and dark blue slogan banner with red accent line & Page 1/1 footer.
 */

export function renderModele7Html({
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
  prescriptionsCount
}) {
  const doctorTitleFr = clinicInfo?.doctorNameFr || doctorNameFr || doctor || 'Nom DOcteur Fr';
  const detailsSpecialite = (clinicInfo?.detailsSpecialite || clinicInfo?.raw?.DETAILS_SPECIALITE || clinicInfo?.raw?.DISCRIPTION_SPECIALITE || '').trim();

  return `
    <!-- Modèle 7 Layout -->
    <!-- Top Header Table (Logo + French Info) -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
      <tr>
        <!-- Left Logo Column -->
        <td style="vertical-align: top; width: 32%;">
          ${clinicLogo ? `<img src="${clinicLogo}" style="max-height: 70px; max-width: 140px; object-fit: contain;" />` : `
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <svg width="50" height="40" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="45" r="40" stroke="#0d9488" stroke-width="4" fill="none"/>
                <path d="M45 25 C30 25 20 40 20 55 C20 70 35 75 50 65 C60 58 55 45 45 45" stroke="#0d9488" stroke-width="5" fill="none" stroke-linecap="round"/>
                <text x="32" y="58" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#0f766e">ORL</text>
              </svg>
              <div style="font-size: 11px; font-weight: bold; color: #0f766e;">Dr. A. BENKERMI</div>
              <div style="font-size: 8px; color: #0d9488;">Spécialiste en ORL</div>
            </div>
          `}
        </td>

        <!-- Right Doctor Info Column -->
        <td style="vertical-align: top; width: 68%; padding-left: 10px;">
          <div style="font-size: 16px; font-weight: bold; color: #000; font-family: 'Segoe UI', Arial, sans-serif;">
            ${doctorTitleFr}
          </div>
          <div style="font-size: 13px; font-weight: 500; color: #111; margin-top: 2px; line-height: 1.35; font-family: 'Segoe UI', Arial, sans-serif;">
            ${specialtyFr || "Spécialiste en l'ensemble des specialité du docteur<br/>ainsi un deuxieme ligne de specialité"}
          </div>
          ${detailsSpecialite ? `
            <div style="font-size: 12.5px; font-weight: 500; color: #222; margin-top: 2px; line-height: 1.3; font-family: 'Segoe UI', Arial, sans-serif;">
              ${detailsSpecialite}
            </div>
          ` : ''}
          <div style="font-size: 12px; color: #111; margin-top: 4px; font-family: 'Segoe UI', Arial, sans-serif;">
            N° d'ordre : ${ordre || '3876/23'} &nbsp;&nbsp;&nbsp; Tel : ${phoneFixe || '0558 413 240'}
          </div>
        </td>
      </tr>
    </table>

    <!-- Date Line (Right Aligned) -->
    <div style="text-align: right; font-size: 14px; color: #000; font-family: 'Segoe UI', Arial, sans-serif; margin-bottom: 4px;">
      Ville Cabinet, le : <strong>${dateToPrint}</strong>
    </div>

    <!-- Patient Header Bar -->
    <div style="font-size: 14px; font-family: 'Segoe UI', Arial, sans-serif; color: #000; margin-bottom: 6px;">
      Nom et Prénom : <strong style="font-size: 15px; text-transform: uppercase;">${assureName}</strong> &nbsp;${agePrefix || (isFemale ? 'âgée de' : 'âgé de')} <strong>${assureAge} ${assureTypeAge}</strong>
    </div>

    <!-- Centered Title -->
    <div style="text-align: center; margin: 6px 0 10px 0;">
      <span style="font-size: 22px; font-weight: bold; text-decoration: underline; letter-spacing: 1px; font-family: 'Segoe UI', Arial, sans-serif; color: #000;">${documentTitle || 'ORDONNANCE'}</span>
    </div>

    <!-- Main Prescriptions Area -->
    <style>
      .modele7-rx-container > div {
        margin-bottom: 6px !important;
        font-size: 12.5px !important;
      }
      .modele7-rx-container > div div {
        font-size: 12.5px !important;
        margin-top: 1px !important;
      }
    </style>
    <div class="modele7-rx-container" style="min-height: 200px; padding: 5px 0;">
      ${rxHtml}
      ${prescriptionsCount !== undefined && prescriptionsCount !== null ? `
        <div style="text-align: right; font-size: 13.5px; font-weight: normal; color: #000; margin-top: 8px; font-family: 'Segoe UI', Arial, sans-serif;">
          ${prescriptionsCount} Médicament(s)
        </div>
      ` : ''}
    </div>
  `;
}

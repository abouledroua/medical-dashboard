/**
 * Modèle 8 Prescription Body Template Renderer
 * Design for IMPR_ORD = 2 (A5) & MODELE_ORD = 6.
 * Features top left logo + right cabinet title with boxed specialty details, centered Arabic name, left French doctor info with line + order number, right date line, centered ORDONNANCE, rx list with quantity/BTE on right, and boxed footer contact bar.
 */
export function renderModele8Html({
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
  const cabinetTitle = clinicInfo?.clinicName || clinicInfo?.NOM_CABINET || `Cabinet Dr ${doctorTitleFr}`;
  const specialtyDetails = clinicInfo?.detailsSpecialite || 'SUITE DE LA SPECIALITE DU DOCTEUR';
  const city = clinicInfo?.city || clinicInfo?.VILLE || 'Ville Cabinet';

  return `
    <!-- Modèle 8 Layout -->
    <!-- Top Header Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 3px;">
      <tr>
        <!-- Left Logo Column -->
        <td style="vertical-align: top; width: 30%;">
          ${clinicLogo ? `<img src="${clinicLogo}" style="max-height: 60px; max-width: 130px; object-fit: contain;" />` : `
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
              <svg width="45" height="35" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="45" r="40" stroke="#0d9488" stroke-width="4" fill="none"/>
                <path d="M45 25 C30 25 20 40 20 55 C20 70 35 75 50 65 C60 58 55 45 45 45" stroke="#0d9488" stroke-width="5" fill="none" stroke-linecap="round"/>
                <text x="32" y="58" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#0f766e">ORL</text>
              </svg>
              <div style="font-size: 10.5px; font-weight: bold; color: #0f766e; margin-top: -2px;">Dr. A. BENKERMI</div>
              <div style="font-size: 8px; color: #0d9488;">Spécialiste en ORL</div>
            </div>
          `}
        </td>

        <!-- Right Cabinet Title & Specialty Column -->
        <td style="vertical-align: top; width: 70%; text-align: center; padding-left: 10px;">
          <div style="font-size: 18px; font-weight: bold; color: #000; text-decoration: underline; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.15;">
            ${cabinetTitle}
          </div>
          <div style="font-size: 12px; font-weight: bold; color: #111; margin-top: 2px; line-height: 1.25; font-family: 'Segoe UI', Arial, sans-serif;">
            ${specialtyFr || "Spécialiste en l'ensemble des specialité du docteur<br/>ainsi un deuxieme ligne de specialité"}
          </div>
          <div style="border: 1px solid #777; padding: 2px 6px; margin-top: 3px; font-size: 10.5px; font-weight: bold; text-transform: uppercase; color: #222; display: inline-block; width: 100%; box-sizing: border-box; line-height: 1.2;">
            ${specialtyDetails}
          </div>
        </td>
      </tr>
    </table>

    <!-- Doctor FR Name (Left) & Arabic Name (Right) Row 1 -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 2px; margin-bottom: 2px; font-family: 'Segoe UI', Arial, sans-serif;">
      <div>
        <div style="font-size: 15px; font-weight: bold; color: #000; line-height: 1.1;">
          ${doctorTitleFr}
        </div>
        <div style="width: 130px; border-bottom: 1.5px solid #000; margin-top: 2px;"></div>
      </div>
      <div style="font-size: 18px; font-weight: bold; color: #000; font-family: 'Amiri', 'Traditional Arabic', sans-serif; line-height: 1.1;">
        ${doctorNameAr || 'الحكيم إسم الحكيم بالعربية'}
      </div>
    </div>

    <!-- Order N° (Left) & Date (Right) Row 2 -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2px; margin-bottom: 6px; font-family: 'Segoe UI', Arial, sans-serif;">
      <div style="font-size: 13px; color: #111;">
        N° d'ordre : ${ordre || '3876/23'}
      </div>
      <div style="font-size: 13.5px; color: #000;">
        ${city}, le : <strong>${dateToPrint}</strong>
      </div>
    </div>

    <!-- Patient Header Bar -->
    <div style="font-size: 13.5px; font-family: 'Segoe UI', Arial, sans-serif; color: #000; margin-bottom: 8px;">
      Nom et Prénom : <strong style="font-size: 14.5px; text-transform: uppercase;">${assureName}</strong> &nbsp;${agePrefix || (isFemale ? 'agée de' : 'âgé de')} <strong>${assureAge} ${assureTypeAge}</strong>
    </div>

    <!-- Centered Title -->
    <div style="text-align: center; margin: 6px 0 10px 0;">
      <span style="font-size: 21px; font-weight: bold; text-decoration: underline; letter-spacing: 1px; font-family: 'Segoe UI', Arial, sans-serif; color: #000;">${documentTitle || 'ORDONNANCE'}</span>
    </div>

    <!-- Main Prescriptions Area -->
    <style>
      .modele8-rx-container {
        font-size: 13px !important;
      }
      .modele8-rx-container > div {
        margin-bottom: 6px !important;
        font-size: 13px !important;
      }
      .modele8-rx-container > div div {
        margin-top: 1px !important;
        font-size: 12.5px !important;
      }
      .modele8-rx-container > div div > div:first-child {
        font-size: 13.5px !important;
      }
    </style>
    <div class="modele8-rx-container" style="min-height: 200px; padding: 5px 0;">
      ${rxHtml}
      ${prescriptionsCount !== undefined && prescriptionsCount !== null ? `
        <div style="text-align: right; font-size: 13.5px; font-weight: normal; color: #000; margin-top: 10px; font-family: 'Segoe UI', Arial, sans-serif;">
          ${prescriptionsCount} Médicament(s)
        </div>
      ` : ''}
    </div>
  `;
}

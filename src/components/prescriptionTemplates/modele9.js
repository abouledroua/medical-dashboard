/**
 * Modèle 9 Prescription Body Template Renderer
 * Design for IMPR_ORD = 2 (A5) & MODELE_ORD = 7.
 * Features top left dark blue French info + top right logo, right-aligned Le : [Date] line, Nom & Age patient bar, centered ORDONNANCE title, and rx list with quantity/BTE on right.
 */

export function renderModele9Html({
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

  return `
    <!-- Modèle 9 Layout -->
    <!-- Top Header Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
      <tr>
        <!-- Left French Doctor Info Column -->
        <td style="vertical-align: top; width: 68%;">
          <div style="font-size: 16.5px; font-weight: bold; color: #1b2a4a; font-family: 'Segoe UI', Arial, sans-serif;">
            ${doctorTitleFr}
          </div>
          <div style="font-size: 13px; font-weight: bold; color: #1b2a4a; margin-top: 2px; line-height: 1.35; font-family: 'Segoe UI', Arial, sans-serif;">
            ${specialtyFr || "Spécialiste en l'ensemble des specialité du docteur<br/>ainsi un deuxieme ligne de specialité"}
          </div>
          <div style="font-size: 11.5px; color: #333; margin-top: 4px; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.35;">
            ${addressFr || 'Adreese du cabinet du docteur'}<br/>
            Mob : ${phoneFixe || '0558 413 240'}<br/>
            Email : ${clinicInfo?.email || 'adel.slougui@yahoo.fr'}<br/>
            N° d'Ordre : ${ordre || '3876/23'}
          </div>
        </td>

        <!-- Right Logo Column -->
        <td style="vertical-align: top; width: 32%; text-align: right;">
          ${clinicLogo ? `<img src="${clinicLogo}" style="max-height: 75px; max-width: 140px; object-fit: contain;" />` : `
            <div style="display: flex; flex-direction: column; align-items: flex-end;">
              <svg width="55" height="45" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="45" r="40" stroke="#0d9488" stroke-width="4" fill="none"/>
                <path d="M45 25 C30 25 20 40 20 55 C20 70 35 75 50 65 C60 58 55 45 45 45" stroke="#0d9488" stroke-width="5" fill="none" stroke-linecap="round"/>
                <text x="32" y="58" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#0f766e">ORL</text>
              </svg>
              <div style="font-size: 11px; font-weight: bold; color: #0f766e; margin-top: 2px;">Dr. A. BENKERMI</div>
              <div style="font-size: 8px; color: #0d9488;">Spécialiste en ORL</div>
            </div>
          `}
        </td>
      </tr>
    </table>

    <!-- Date Line (Right Aligned) -->
    <div style="text-align: right; font-size: 15px; color: #000; font-family: 'Segoe UI', Arial, sans-serif; margin-bottom: 4px; margin-top: 2px;">
      Le : <strong>${dateToPrint}</strong>
    </div>

    <!-- Patient Header Bar -->
    <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 15px; font-family: 'Segoe UI', Arial, sans-serif; color: #000; margin-bottom: 6px;">
      <div>
        Nom : <strong style="font-size: 15.5px; text-transform: uppercase;">${assureName}</strong>
      </div>
      <div>
        Age : <strong>${assureAge} ${assureTypeAge}</strong>
      </div>
    </div>

    <!-- Centered Title -->
    <div style="text-align: center; margin: 6px 0 10px 0;">
      <span style="font-size: 22px; font-weight: bold; text-decoration: underline; letter-spacing: 1px; font-family: 'Segoe UI', Arial, sans-serif; color: #000;">${documentTitle || 'ORDONNANCE'}</span>
    </div>

    <!-- Main Prescriptions Area -->
    <style>
      .modele9-rx-container {
        font-size: 13px !important;
      }
      .modele9-rx-container > div {
        margin-bottom: 6px !important;
        font-size: 13px !important;
      }
      .modele9-rx-container > div div {
        margin-top: 1px !important;
        font-size: 12.5px !important;
      }
      .modele9-rx-container > div div > div:first-child {
        font-size: 13.5px !important;
      }
    </style>
    <div class="modele9-rx-container" style="min-height: 200px; padding: 5px 0;">
      ${rxHtml}
      ${prescriptionsCount !== undefined && prescriptionsCount !== null ? `
        <div style="text-align: right; font-size: 13.5px; font-weight: normal; color: #000; margin-top: 8px; font-family: 'Segoe UI', Arial, sans-serif;">
          ${prescriptionsCount} ${prescriptionsCountLabel || ((isBilan || documentTitle === 'BILAN') ? 'Examen(s)' : 'Médicament(s)')}
        </div>
      ` : ''}
    </div>
  `;
}

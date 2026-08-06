/**
 * Modèle 3 Prescription Body Template Renderer
 * Design matches the centered French Dr header, right Arabic info, centered title, and count summary.
 */

export function renderModele3Html({
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
  documentSubtitle,
  isBilan
}) {
  const doctorTitleFr = (clinicInfo?.doctorNameFr || doctorNameFr || doctor || '').toUpperCase();
  const isBilanDoc = isBilan || documentTitle === 'BILAN' || documentTitle === 'DEMANDE DE BILAN';

  return `
    <!-- Modèle 3 Layout -->
    <!-- Header Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
      <tr>
        <!-- Left Doctor Info (French) -->
        <td style="vertical-align: top; width: 48%; text-align: center;">
          <div style="font-size: 16px; font-weight: bold; color: #000; font-family: 'Segoe UI', Arial, sans-serif;">
            ${doctorTitleFr || 'Nom DOcteur Fr'}
          </div>
          <div style="font-size: 13px; font-weight: bold; color: #000; margin-top: 2px; line-height: 1.35; font-family: 'Segoe UI', Arial, sans-serif;">
            ${specialtyFr || "Spécialiste en l'ensemble des<br/>specialité du docteur<br/>ainsi un deuxieme ligne de specialité"}
          </div>
          <div style="font-size: 12px; color: #111; margin-top: 6px; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.3;">
            ${addressFr || 'Adreese du cabinet du docteur'}<br/>
            ${phoneFixe ? `Tel : ${phoneFixe}` : 'Tel : 0558 413 240'}
          </div>
          <div style="width: 140px; border-bottom: 1px solid #000; margin: 4px auto 4px auto;"></div>
          <div style="font-size: 12px; color: #111; font-family: 'Segoe UI', Arial, sans-serif;">
            N° d'Ordre : ${ordre || '3876/23'}
          </div>
          ${isBilanDoc ? `
            <div style="display: flex; justify-content: center; margin-top: 10px;">
              ${barcodeSvg}
            </div>
          ` : ''}
        </td>

        <!-- Right Doctor Info (Arabic) + Date + Title -->
        <td style="vertical-align: top; width: 52%; text-align: right;">
          <div style="font-size: 20px; font-weight: bold; font-family: 'Amiri', 'Traditional Arabic', 'Segoe UI', Arial, sans-serif; color: #000; line-height: 1.2;">
            ${doctorNameAr || 'إسم الحكيم بالعربية'}
          </div>
          <div style="font-size: 14px; font-weight: bold; font-family: 'Amiri', 'Traditional Arabic', 'Segoe UI', Arial, sans-serif; color: #000; margin-top: 2px; line-height: 1.3;">
            ${specialtyAr || 'إختصاصي في مجموعهة اختصاصات الحكيم<br/>سطر آخر في اختصاصات الحكيم'}
          </div>
          <div style="font-size: 14px; font-weight: normal; color: #000; margin-top: 8px; margin-bottom: 4px; font-family: 'Segoe UI', Arial, sans-serif;">
            Ville Cabinet, le : <strong>${dateToPrint}</strong>
          </div>
          ${isBilanDoc ? `
            <div style="text-align: center; margin-top: 15px;">
              <span style="font-size: 24px; font-weight: bold; text-decoration: underline; letter-spacing: 1px; font-family: 'Segoe UI', Arial, sans-serif; color: #000;">
                ${documentTitle || 'BILAN'}
              </span>
            </div>
          ` : `
            <div style="display: flex; justify-content: flex-end;">
              ${barcodeSvg}
            </div>
          `}
        </td>
      </tr>
    </table>

    <!-- Patient Header -->
    <div style="font-size: 14px; font-family: 'Segoe UI', Arial, sans-serif; color: #000; margin-top: 8px; margin-bottom: 6px;">
      Nom et Prénom : <strong style="font-size: 15px; text-transform: uppercase;">${assureName}</strong> &nbsp;&nbsp;agée de <strong>${assureAge} ${assureTypeAge}</strong>
    </div>

    ${isBilanDoc ? `
      <!-- Sub-header Message -->
      ${documentSubtitle ? `
        <div style="font-size: 14.5px; font-weight: bold; color: #000; margin-top: 14px; margin-bottom: 12px; font-family: 'Segoe UI', Arial, sans-serif;">
          ${documentSubtitle}
        </div>
      ` : ''}
    ` : `
      <!-- Centered Title for standard prescription -->
      <div style="text-align: center; margin: 6px 0 10px 0;">
        <span style="font-size: 22px; font-weight: bold; text-decoration: underline; letter-spacing: 1px; font-family: 'Segoe UI', Arial, sans-serif; color: #000;">${documentTitle || 'ORDONNANCE'}</span>
        ${documentSubtitle ? `
          <div style="font-size: 13.5px; font-weight: bold; color: #000; margin-top: 6px; font-style: italic; font-family: 'Segoe UI', Arial, sans-serif;">
            ${documentSubtitle}
          </div>
        ` : ''}
      </div>
    `}

    <!-- Main Prescriptions Body Area -->
    <style>
      .modele3-rx-container > div {
        margin-bottom: 7px !important;
      }
      .modele3-rx-container > div div {
        margin-top: 1px !important;
      }
    </style>
    <div class="modele3-rx-container" style="min-height: 200px; padding: 5px 0;">
      ${rxHtml}
      ${prescriptionsCount !== undefined && prescriptionsCount !== null ? `
        <div style="text-align: right; font-size: 14px; font-weight: normal; color: #000; margin-top: 8px; font-family: 'Segoe UI', Arial, sans-serif;">
          ${prescriptionsCount} ${prescriptionsCountLabel || 'Médicament(s)'}
        </div>
      ` : ''}
    </div>
  `;
}

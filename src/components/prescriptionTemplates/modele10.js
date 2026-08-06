/**
 * Modèle 10 Prescription Body Template Renderer
 * Design for IMPR_ORD = 2 (A5) & MODELE_ORD = 8.
 * Features top centered Cabinet title, sub-header table with French info & line on left and Arabic info & date on right, patient bar, centered ORDONNANCE title, numbered rx list ("1 - ..."), and bottom line + slogan.
 */

export function renderModele10Html({
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

  return `
    <!-- Modèle 10 Layout -->
    <!-- Top Cabinet Title -->
    <div style="text-align: center; margin-bottom: 6px;">
      <div style="font-size: 16px; font-weight: 900; color: #000; text-transform: uppercase; font-family: 'Segoe UI', Arial, sans-serif; letter-spacing: 1px;">
        ${cabinetTitle}
      </div>
    </div>

    <!-- Sub-header Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
      <tr>
        <!-- Left Doctor Info (French) -->
        <td style="vertical-align: top; width: 48%; text-align: left;">
          <div style="font-size: 15px; font-weight: bold; color: #000; font-family: 'Segoe UI', Arial, sans-serif;">
            ${(doctorTitleFr).toUpperCase()}
          </div>
          <div style="font-size: 12.5px; font-weight: bold; color: #000; margin-top: 1px; line-height: 1.35; font-family: 'Segoe UI', Arial, sans-serif;">
            ${specialtyFr || "Spécialiste en l'ensemble des<br/>specialité du docteur<br/>ainsi un deuxieme ligne de specialité"}
          </div>
          <div style="width: 120px; border-bottom: 1px solid #000; margin: 3px 0;"></div>
          <div style="font-size: 11.5px; color: #111; font-family: 'Segoe UI', Arial, sans-serif;">
            N° d'Ordre : ${ordre || '3876/23'}
          </div>
        </td>

        <!-- Right Doctor Info (Arabic) + Date -->
        <td style="vertical-align: top; width: 52%; text-align: right;">
          <div style="font-size: 19px; font-weight: bold; font-family: 'Amiri', 'Traditional Arabic', sans-serif; color: #000; line-height: 1.2;">
            ${doctorNameAr || 'إسم الحكيم بالعربية'}
          </div>
          <div style="font-size: 13.5px; font-weight: bold; font-family: 'Amiri', 'Traditional Arabic', sans-serif; color: #000; margin-top: 1px; line-height: 1.3;">
            ${specialtyAr || 'إختصاصي في مجموعة اختصاصات الحكيم<br/>سطر آخر في اختصاصات الحكيم'}
          </div>
          <div style="font-size: 13.5px; color: #000; margin-top: 6px; font-family: 'Segoe UI', Arial, sans-serif;">
            Ville Cabinet, le : <strong>${dateToPrint}</strong>
          </div>
        </td>
      </tr>
    </table>

    <!-- Horizontal Separator -->
    <div style="border-bottom: 1.5px solid #000; width: 100%; margin-bottom: 6px;"></div>

    <!-- Patient Info Line -->
    <div style="font-size: 14px; font-family: 'Segoe UI', Arial, sans-serif; color: #000; margin-bottom: 6px;">
      Nom et Prénom : <strong style="font-size: 15px; text-transform: uppercase;">${assureName}</strong> &nbsp;${agePrefix || (isFemale ? 'âgée de' : 'âgé de')} <strong>${assureAge} ${assureTypeAge}</strong>
    </div>

    <!-- Centered Title -->
    <div style="text-align: center; margin: 6px 0 10px 0;">
      <span style="font-size: 22px; font-weight: bold; text-decoration: underline; letter-spacing: 1px; font-family: 'Segoe UI', Arial, sans-serif; color: #000;">${documentTitle || 'ORDONNANCE'}</span>
    </div>

    <!-- Main Prescriptions Area -->
    <style>
      .modele10-rx-container > div {
        margin-bottom: 7px !important;
      }
      .modele10-rx-container > div div {
        margin-top: 1px !important;
      }
    </style>
    <div class="modele10-rx-container" style="min-height: 200px; padding: 5px 0;">
      ${rxHtml}
      ${prescriptionsCount !== undefined && prescriptionsCount !== null ? `
        <div style="text-align: right; font-size: 13.5px; font-weight: normal; color: #000; margin-top: 8px; font-family: 'Segoe UI', Arial, sans-serif;">
          ${prescriptionsCount} Médicament(s)
        </div>
      ` : ''}
    </div>
  `;
}

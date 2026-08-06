/**
 * Modèle 5 Prescription Body Template Renderer
 * Design for IMPR_ORD = 2 (A5) & MODELE_ORD = 3.
 * Features top centered logo header, 2-column divided doctor box (AR left / FR right), patient bar, bilingual title (وصفة / ORDONNANCE) with date, rx list with quantity/BTE on right, and bottom horizontal line + centered slogan.
 */

export function renderModele5Html({
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

  return `
    <!-- Modèle 5 Layout -->
    <!-- Top Centered Logo -->
    <div style="text-align: center; margin-bottom: 4px;">
      ${clinicLogo ? `<img src="${clinicLogo}" style="max-height: 70px; max-width: 240px; object-fit: contain;" />` : `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <svg width="50" height="40" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="45" r="40" stroke="#0d9488" stroke-width="4" fill="none"/>
            <path d="M45 25 C30 25 20 40 20 55 C20 70 35 75 50 65 C60 58 55 45 45 45" stroke="#0d9488" stroke-width="5" fill="none" stroke-linecap="round"/>
            <text x="32" y="58" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="#0f766e">ORL</text>
          </svg>
          <div style="font-size: 12px; font-weight: bold; color: #0f766e; margin-top: 2px;">Dr. A. BENKERMI</div>
          <div style="font-size: 8px; color: #0d9488; text-transform: uppercase;">Spécialiste en ORL</div>
        </div>
      `}
    </div>

    <!-- Top Separator Line -->
    <div style="border-bottom: 2px solid #000; width: 100%; margin-bottom: 6px;"></div>

    <!-- 2-Column Doctor Info Box -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
      <tr>
        <!-- Left Arabic Doctor Info -->
        <td style="vertical-align: top; width: 50%; text-align: right; border-right: 1.5px solid #000; padding-right: 12px;">
          <div style="font-size: 17px; font-weight: bold; font-family: 'Amiri', 'Traditional Arabic', 'Segoe UI', Arial, sans-serif; color: #000; line-height: 1.2;">
            ${doctorNameAr || 'الحكيم إسم الحكيم بالعربية'}
          </div>
          <div style="font-size: 12.5px; font-family: 'Amiri', 'Traditional Arabic', sans-serif; color: #111; margin-top: 2px;">
            رقم الإنخراط : ${ordre || '3876/23'}
          </div>
          <div style="font-size: 12.5px; font-family: 'Amiri', 'Traditional Arabic', sans-serif; color: #111; margin-top: 1px;">
            ${phoneFixe || '0558 413 240'} : النقال
          </div>
          <div style="font-size: 11.5px; font-family: 'Amiri', 'Traditional Arabic', sans-serif; color: #111; margin-top: 1px;">
            العنوان : ${addressFr || ''}
          </div>
          <div style="font-size: 11.5px; font-family: sans-serif; color: #111; margin-top: 1px;">
            البريد الإلكتروني : ${clinicInfo?.email || 'adel.slougui@yahoo.fr'}
          </div>
        </td>

        <!-- Right French Doctor Info -->
        <td style="vertical-align: top; width: 50%; text-align: left; padding-left: 12px;">
          <div style="font-size: 14px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; color: #000;">
            ${doctorTitleFr}
          </div>
          <div style="font-size: 12.5px; font-family: 'Segoe UI', Arial, sans-serif; color: #111; margin-top: 2px;">
            N° d'ordre : ${ordre || '3876/23'}
          </div>
          <div style="font-size: 12.5px; font-family: 'Segoe UI', Arial, sans-serif; color: #111; margin-top: 1px;">
            Mob : ${phoneFixe || '0558 413 240'}
          </div>
          <div style="font-size: 11.5px; font-family: 'Segoe UI', Arial, sans-serif; color: #111; margin-top: 1px;">
            Adresse : ${addressFr || 'Adreese du cabinet du docteur'}
          </div>
          <div style="font-size: 11.5px; font-family: 'Segoe UI', Arial, sans-serif; color: #111; margin-top: 1px;">
            Émail : ${clinicInfo?.email || 'adel.slougui@yahoo.fr'}
          </div>
        </td>
      </tr>
    </table>

    <!-- Middle Separator Line -->
    <div style="border-bottom: 2px solid #000; width: 100%; margin-bottom: 6px;"></div>

    <!-- Patient Header Bar -->
    <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; font-family: 'Segoe UI', Arial, sans-serif; color: #000; margin-bottom: 6px;">
      <div>
        Nom et Prénom : <strong style="font-size: 15px; text-transform: uppercase;">${assureName}</strong>
      </div>
      <div>
        ${agePrefix || (isFemale ? 'âgée de' : 'âgé de')} <strong>${assureAge} ${assureTypeAge}</strong>
      </div>
    </div>

    <!-- Bilingual Title Section -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px;">
      <div style="flex: 1;"></div>
      <div style="text-align: center;">
        <div style="font-size: 18px; font-weight: bold; font-family: 'Amiri', 'Traditional Arabic', sans-serif; color: #000; line-height: 1.2;">
          وصفة
        </div>
        <div style="font-size: 21px; font-weight: bold; text-decoration: underline; letter-spacing: 1px; font-family: 'Segoe UI', Arial, sans-serif; color: #000; margin-top: 1px;">
          ${documentTitle || 'ORDONNANCE'}
        </div>
      </div>
      <div style="flex: 1; text-align: right; font-size: 15px; color: #000; font-family: 'Segoe UI', Arial, sans-serif;">
        du : <strong>${dateToPrint}</strong>
      </div>
    </div>

    <!-- Main Prescriptions Area -->
    <style>
      .modele5-rx-container > div {
        margin-bottom: 6px !important;
        font-size: 12.5px !important;
      }
      .modele5-rx-container > div div {
        font-size: 12.5px !important;
        margin-top: 1px !important;
      }
    </style>
    <div class="modele5-rx-container" style="min-height: 200px; padding: 5px 0;">
      ${rxHtml}
      ${prescriptionsCount !== undefined && prescriptionsCount !== null ? `
        <div style="text-align: right; font-size: 13.5px; font-weight: normal; color: #000; margin-top: 8px; font-family: 'Segoe UI', Arial, sans-serif;">
          ${prescriptionsCount} Médicament(s)
        </div>
      ` : ''}
    </div>
  `;
}

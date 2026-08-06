/**
 * Modèle 2 Prescription Body Template Renderer
 * 2-Column Layout with red specialty and procedure sidebar.
 */

export function renderModele2Html({
  doctorNameAr,
  specialtyFr,
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
  prescriptionsCountLabel,
  documentTitle,
  isBilan
}) {
  return `
    <!-- Modèle 2 Layout -->
    <!-- Header Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
      <tr>
        <td style="vertical-align: top; width: 65%;">
          <div style="font-size: 24px; font-weight: bold; font-family: 'Amiri', 'Traditional Arabic', 'Segoe UI', Arial, sans-serif; color: #000; line-height: 1.2;">
            ${doctorNameAr}
          </div>
          <div style="font-size: 13.5px; font-weight: bold; color: #ff0000 !important; margin-top: 4px; line-height: 1.35; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
            ${specialtyFr || 'Spécialiste en l\'ensemble des specialité du docteur<br/>ainsi un deuxieme ligne de specialité'}
          </div>
          <div style="font-size: 11px; color: #222; margin-top: 8px; line-height: 1.4;">
            ${addressFr}<br/>
            ${phoneFixe ? `Tel: ${phoneFixe}<br/>` : ''}
            ${clinicInfo?.email || 'adel.slougui@yahoo.fr'}<br/>
            Imprimée le: ${dateToPrint}<br/>
            N° d'ordre : ${ordre}
          </div>
        </td>
        <td style="vertical-align: top; text-align: right; width: 35%;">
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
            ${clinicHeader ? `<img src="${clinicHeader}" style="max-height: 65px; max-width: 220px; object-fit: contain;" />` : `
              <div style="display: flex; align-items: center; gap: 4px;">
                <svg width="45" height="38" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40 10 C20 10 10 30 10 50 C10 70 30 75 45 65 C55 58 52 45 42 45 C35 45 32 52 38 58" stroke="#cbd5e1" stroke-width="6" fill="none" stroke-linecap="round" />
                  <text x="35" y="45" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="#e2e8f0">ORL</text>
                </svg>
              </div>
              <div style="font-size: 10px; font-weight: bold; color: #cbd5e1; letter-spacing: 0.5px;">${(clinicInfo?.doctorNameFr || doctor || '').toUpperCase()}</div>
            `}
            <div>
              ${barcodeSvg}
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Title & Patient Header -->
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 15px; margin-bottom: 20px; font-size: 14px;">
      <div>
        <span style="font-size: 18px; font-weight: bold; text-decoration: underline; letter-spacing: 0.5px;">${documentTitle || 'ORDONNANCE'}</span>
        <span style="margin-left: 8px;">Du malade : <strong style="font-size: 15.5px; text-transform: uppercase;">${assureName}</strong> &nbsp;âgé(e) de <strong>${assureAge} ${assureTypeAge}</strong></span>
      </div>
    </div>

    <!-- 2-Column Body Layout -->
    <div style="display: flex; min-height: 460px; margin-top: 10px;">
      <!-- Left Sidebar Column -->
      <div style="width: 24%; border-right: 2px solid #000; padding-right: 12px; margin-right: 18px; text-align: right; display: flex; flex-direction: column; gap: 32px; font-weight: bold; font-size: 13px; font-family: 'Segoe UI', Arial, sans-serif; color: #000; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
        <div>Echographie</div>
        <div>Débimétrie</div>
        <div style="line-height: 1.3;">Biopsie<br/>prostatique</div>
        <div>Fibroscopie</div>
        <div style="line-height: 1.3;">Traitement de la<br/>lithiase : LAZER</div>
      </div>

      <!-- Right Main Prescriptions Area -->
      <div style="flex: 1; padding-top: 4px;">
        ${rxHtml}
      </div>
    </div>

    <!-- Bottom Horizontal Closing Line -->
    <div style="border-bottom: 2px solid #000; width: 100%; margin: 15px 0 15px 0;"></div>
  `;
}

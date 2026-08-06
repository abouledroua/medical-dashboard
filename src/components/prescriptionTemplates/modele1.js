/**
 * Modèle 1 Prescription Body Template Renderer
 */

export function renderModele1Html({
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
  documentTitle
}) {
  return `
    <!-- Modèle 1 Layout -->
    <!-- Header Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
      <tr>
        <td style="vertical-align: top; width: 62%;">
          <div style="font-size: 24px; font-weight: bold; font-family: 'Amiri', 'Traditional Arabic', 'Segoe UI', Arial, sans-serif; color: #000; line-height: 1.2;">
            ${doctorNameAr}
          </div>
          <div style="font-size: 13px; font-weight: 600; color: #111; margin-top: 4px; line-height: 1.4;">
            ${specialtyFr}
          </div>
          <div style="font-size: 11px; color: #222; margin-top: 10px;">
            ${addressFr} ${phoneFixe ? `Fixe: ${phoneFixe}` : ''}
          </div>
          <div style="font-size: 11px; color: #222; margin-top: 2px;">
            N° d'ordre : ${ordre}
          </div>
        </td>
        <td style="vertical-align: top; text-align: right; width: 38%;">
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
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 15px; margin-bottom: 15px; font-size: 14px;">
      <div>
        <span style="font-size: 17px; font-weight: bold; text-decoration: underline; letter-spacing: 0.5px;">${documentTitle || 'ORDONNANCE'}</span>
        <span style="margin-left: 6px;">Du malade : <strong style="font-size: 15px; text-transform: uppercase;">${assureName}</strong> âgé(e) de <strong>${assureAge} ${assureTypeAge}</strong></span>
      </div>
      <div style="font-size: 14px; white-space: nowrap;">
        Date : <strong>${dateToPrint}</strong>
      </div>
    </div>

    <!-- Prescriptions Container -->
    <div style="padding: 5px 0 0 0;">
      ${rxHtml}

      <!-- Separator Line with Vertical Cap on Right (Directly under last medicine) -->
      <div style="border-bottom: 2px solid #000; position: relative; margin: 10px 0 0 0; width: 100%;">
        <div style="position: absolute; right: 0; bottom: 0; height: 18px; width: 2px; background: #000;"></div>
      </div>
    </div>
  `;
}

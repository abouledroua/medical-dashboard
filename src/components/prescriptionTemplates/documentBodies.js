/**
 * Document Body Renderers for All Medical Print Types
 * Renders dedicated body HTML for:
 * 1. Ordonnance (Prescription)
 * 2. Bilan (Biological & Radiology Order)
 * 3. Certificat (Medical Certificate)
 * 4. Orientation (Referral Letter)
 * 5. Arrêt de Travail (Sick Leave)
 * 6. Document Médical (Medical Report/Letter)
 */

export function renderOrdonnanceBody({ validMedsToPrint = [], freeTextToPrint = '', prescriptionsCount, prescriptionsCountLabel }) {
  let rxHtml = '';

  if (validMedsToPrint.length > 0) {
    rxHtml = validMedsToPrint.map((rx, idx) => {
      if (rx.type === 2) {
        return `
          <div style="margin-bottom: 12px; font-size: 13.5px; font-family: 'Segoe UI', Arial, sans-serif; color: #000; line-height: 1.5;">
            <strong style="color: #000;">${idx + 1}.</strong> ${rx.name}
          </div>
        `;
      }

      const subText = [rx.dosage, rx.frequency].filter(Boolean).join(' - ');

      return `
        <div style="margin-bottom: 14px; font-size: 13px; font-family: 'Segoe UI', Arial, sans-serif; color: #000;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <div style="font-weight: bold; font-size: 13.5px; text-transform: uppercase; color: #000;">
              ${idx + 1}. ${rx.name}
            </div>
            ${rx.duration ? `<div style="font-size: 13px; font-weight: normal; color: #000; font-family: 'Segoe UI', Arial, sans-serif; white-space: nowrap; margin-left: 15px;">${rx.duration}</div>` : ''}
          </div>
          ${subText ? `<div style="margin-left: 20px; margin-top: 2px; font-size: 12.5px; color: #111;">${subText}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  if (freeTextToPrint && freeTextToPrint.trim()) {
    rxHtml += `
      <div style="white-space: pre-wrap; font-size: 14.5px; line-height: 1.7; font-family: 'Segoe UI', Arial, sans-serif; color: #000; margin-top: 10px;">
        ${freeTextToPrint.trim()}
      </div>
    `;
  }

  if (!rxHtml.trim()) {
    rxHtml = '<div style="font-size: 14px; color: #666; font-style: italic; padding: 20px 0;">Aucun médicament prescrit.</div>';
  }

  return `
    <div class="rx-body-container" style="min-height: 180px; padding: 5px 0;">
      ${rxHtml}
      ${prescriptionsCount !== undefined && prescriptionsCount !== null ? `
        <div style="text-align: right; font-size: 13.5px; font-weight: normal; color: #000; margin-top: 12px; font-family: 'Segoe UI', Arial, sans-serif;">
          ${prescriptionsCount} ${prescriptionsCountLabel || 'Médicament(s)'}
        </div>
      ` : ''}
    </div>
  `;
}

export function renderBilanBody({ rawList = [], documentSubtitle, prescriptionsCount }) {
  let listHtml = '';
  if (rawList.length > 0) {
    const half = Math.ceil(rawList.length / 2);
    const col1 = rawList.slice(0, half);
    const col2 = rawList.slice(half);

    const maxRows = Math.max(col1.length, col2.length);
    let rowsHtml = '';
    for (let i = 0; i < maxRows; i++) {
      const item1 = col1[i] ? `- ${col1[i]}` : '';
      const item2 = col2[i] ? `- ${col2[i]}` : '';
      rowsHtml += `
        <tr>
          <td style="width: 50%; vertical-align: top; padding-bottom: 14px; font-size: 14.5px; font-weight: 500; font-family: 'Segoe UI', Arial, sans-serif; color: #000;">${item1}</td>
          <td style="width: 50%; vertical-align: top; padding-bottom: 14px; font-size: 14.5px; font-weight: 500; font-family: 'Segoe UI', Arial, sans-serif; color: #000;">${item2}</td>
        </tr>
      `;
    }

    listHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-left: 5px;">
        ${rowsHtml}
      </table>
    `;
  } else {
    listHtml = '<div style="font-size: 14px; color: #666; font-style: italic; padding: 20px 0;">Aucun examen sélectionné.</div>';
  }

  const subMsg = documentSubtitle || 'Faire SVP les bilans suivants :';

  return `
    <div class="bilan-body-container" style="min-height: 180px; padding: 5px 0;">
      <div style="font-size: 14.5px; font-weight: bold; color: #000; margin-top: 12px; margin-bottom: 12px; font-family: 'Segoe UI', Arial, sans-serif;">
        ${subMsg}
      </div>
      ${listHtml}
      ${prescriptionsCount !== undefined && prescriptionsCount !== null ? `
        <div style="text-align: right; font-size: 13.5px; font-weight: normal; color: #000; margin-top: 12px; font-family: 'Segoe UI', Arial, sans-serif;">
          ${prescriptionsCount} Examen(s)
        </div>
      ` : ''}
    </div>
  `;
}

export function renderCertificatBody({ certificat = {} }) {
  const title = certificat.type || 'Certificat Médical';
  const content = certificat.content || 'Je soussigné, Docteur en médecine, certifie avoir examiné ce jour le patient susnommé...';

  return `
    <div class="certificat-body-container" style="min-height: 200px; padding: 15px 5px;">
      <div style="font-size: 15px; line-height: 1.8; font-family: 'Segoe UI', Arial, sans-serif; color: #000; white-space: pre-wrap;">
        ${content}
      </div>
    </div>
  `;
}

export function renderOrientationBody({ orientation = {} }) {
  const specialist = orientation.specialist || 'Confrère / Spécialiste';
  const reason = orientation.reason || orientation.notes || '';

  return `
    <div class="orientation-body-container" style="min-height: 200px; padding: 15px 5px;">
      <div style="font-size: 15px; font-weight: bold; color: #000; margin-bottom: 15px; font-family: 'Segoe UI', Arial, sans-serif;">
        À l'attention de notre cher confrère : <span style="text-decoration: underline;">${specialist}</span>
      </div>
      <div style="font-size: 14.5px; line-height: 1.8; font-family: 'Segoe UI', Arial, sans-serif; color: #000; white-space: pre-wrap;">
        Chert(e) Confrère,<br/><br/>
        Je vous adresse le patient susnommé pour avis et prise en charge spécialisée.<br/>
        ${reason ? `<br/><strong>Motif & Remarques :</strong><br/>${reason}` : ''}
      </div>
    </div>
  `;
}

export function renderArretTravailBody({ arretTravail = {} }) {
  const days = arretTravail.days || 1;
  const startDate = arretTravail.startDate || '';
  const endDate = arretTravail.endDate || '';
  const returnDate = arretTravail.returnDate || '';
  const reason = arretTravail.reason || '';

  return `
    <div class="arret-body-container" style="min-height: 200px; padding: 15px 5px;">
      <div style="font-size: 15px; line-height: 1.8; font-family: 'Segoe UI', Arial, sans-serif; color: #000;">
        Je soussigné, Docteur en médecine, certifie que l'état de santé du patient susnommé nécessite un arrêt de travail numérique de :<br/><br/>
        <div style="font-size: 16px; font-weight: bold; text-align: center; margin: 15px 0;">
          ${days} Jour(s)
        </div>
        ${startDate ? `Du <strong>${startDate}</strong> ` : ''} ${endDate ? `au <strong>${endDate}</strong> ` : ''} ${returnDate ? `avec reprise du travail le <strong>${returnDate}</strong>.` : ''}
        ${reason ? `<br/><br/><strong>Remarques / Justification :</strong> ${reason}` : ''}
      </div>
    </div>
  `;
}

export function renderDocMedicalBody({ docMedical = {} }) {
  const title = docMedical.title || 'Document Médical';
  const bodyText = docMedical.body || docMedical.conclusion || '';

  return `
    <div class="doc-body-container" style="min-height: 200px; padding: 15px 5px;">
      <div style="font-size: 15px; line-height: 1.8; font-family: 'Segoe UI', Arial, sans-serif; color: #000; white-space: pre-wrap;">
        ${bodyText}
      </div>
    </div>
  `;
}

export function renderDocumentBody(params) {
  const docType = params.docType || (params.isBilan ? 'bilan' : 'ordonnance');
  switch (docType) {
    case 'bilan':
      return renderBilanBody(params);
    case 'certificat':
      return renderCertificatBody(params);
    case 'orientation':
      return renderOrientationBody(params);
    case 'arret_travail':
      return renderArretTravailBody(params);
    case 'doc_medical':
      return renderDocMedicalBody(params);
    case 'ordonnance':
    default:
      return renderOrdonnanceBody(params);
  }
}

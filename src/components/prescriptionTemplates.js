/**
 * Prescription Print Template Dispatcher
 * Imports dedicated template renderers for each model layout.
 */

import { renderModele1Html } from './prescriptionTemplates/modele1';
import { renderModele2Html } from './prescriptionTemplates/modele2';
import { renderModele3Html } from './prescriptionTemplates/modele3';
import { renderModele4Html } from './prescriptionTemplates/modele4';
import { renderModele5Html } from './prescriptionTemplates/modele5';
import { renderModele6Html } from './prescriptionTemplates/modele6';
import { renderModele7Html } from './prescriptionTemplates/modele7';
import { renderModele8Html } from './prescriptionTemplates/modele8';
import { renderModele9Html } from './prescriptionTemplates/modele9';
import { renderModele10Html } from './prescriptionTemplates/modele10';
import { renderModele11Html } from './prescriptionTemplates/modele11';
import { renderModele12Html } from './prescriptionTemplates/modele12';
import { renderDocumentBody } from './prescriptionTemplates/documentBodies';

export function generatePrescriptionHtml(params) {
  const {
    clinicInfo,
    assureName,
    clinicLogo,
    doctor,
    addressFr,
    phoneFixe,
    msgJaune,
    msgOrd
  } = params;

  const rawBarcodeSetting = clinicInfo?.Affiche_CodeBarre ?? clinicInfo?.raw?.Affiche_CodeBarre ?? clinicInfo?.raw?.AFFICHE_CODEBARRE ?? clinicInfo?.AFFICHE_CODEBARRE;
  const showBarcode = rawBarcodeSetting === undefined || rawBarcodeSetting === null ? true : Number(rawBarcodeSetting) === 1;
  const barcodeSvg = showBarcode ? (params.barcodeSvg || '') : '';
  const isBilanPrint = !!(params.isBilan || params.docType === 'bilan');
  const paramsWithBarcode = {
    ...params,
    barcodeSvg,
    documentTitle: params.documentTitle || (isBilanPrint ? 'BILAN' : 'ORDONNANCE')
  };
  if (!paramsWithBarcode.rxHtml) {
    paramsWithBarcode.rxHtml = renderDocumentBody(paramsWithBarcode);
  }

  const rawImpr = isBilanPrint
    ? (clinicInfo?.IMPR_BILAN ?? clinicInfo?.imprBilan ?? clinicInfo?.raw?.IMPR_BILAN ?? 1)
    : (clinicInfo?.IMPR_ORD ?? clinicInfo?.imprOrd ?? clinicInfo?.raw?.IMPR_ORD ?? 1);

  const rawModele = isBilanPrint
    ? (clinicInfo?.MODELE_BILAN ?? clinicInfo?.modeleBilan ?? clinicInfo?.raw?.MODELE_BILAN ?? clinicInfo?.MODELE_ORD ?? clinicInfo?.raw?.MODELE_ORD ?? 1)
    : (clinicInfo?.MODELE_ORD ?? clinicInfo?.modeleOrd ?? clinicInfo?.raw?.MODELE_ORD ?? 1);

  const imprOrd = Number(rawImpr);
  const modeleOrd = Number(rawModele);

  // Exact Rules:
  // 1. IMPR_ORD = 2 and MODELE_ORD = 10 -> DESIGN 12 (A5 3-Column Header with "-o-" Dividers + Watermark + Bottom Barcode Footer)
  // 2. IMPR_ORD = 2 and MODELE_ORD = 9 -> DESIGN 11 (A5 Top Banner + 3-Column Sub-header + Right Barcode + Icon Contact Footer)
  // 3. IMPR_ORD = 2 and MODELE_ORD = 8 -> DESIGN 10 (A5 Centered Cabinet Title + Sub-header Table with FR Line + Slogan Footer)
  // 4. IMPR_ORD = 2 and MODELE_ORD = 7 -> DESIGN 9 (A5 Top Left Dark Blue Info + Top Right Logo + Clean Footer)
  // 5. IMPR_ORD = 2 and MODELE_ORD = 6 -> DESIGN 8 (A5 Top Right Boxed Specialty + Centered AR Name + Boxed Footer)
  // 6. IMPR_ORD = 2 and MODELE_ORD = 5 -> DESIGN 7 (A5 Top Left Logo + Blue Footer Banner & Red Accent Line)
  // 7. IMPR_ORD = 2 and MODELE_ORD = 4 -> DESIGN 6 (A5 Dark Blue Top Banner + Sub-header QR Code + Italicized Contact Footer)
  // 8. IMPR_ORD = 2 and MODELE_ORD = 3 -> DESIGN 5 (A5 Centered Top Logo + Divided AR/FR Box + Bilingual Title)
  // 9. IMPR_ORD = 2 and MODELE_ORD = 2 -> DESIGN 4 (A5 3-Column Top Cabinet Title + Bottom Barcode Design)
  // 10. IMPR_ORD = 2 and MODELE_ORD = 1 -> DESIGN 3 (A5 Centered French Dr Header Design)
  const forceDesign3 = !!(params.forceDesign3 || params.forceModele === 3);
  const useDesign12 = !forceDesign3 && (imprOrd === 2 && modeleOrd === 10);
  const useDesign11 = !forceDesign3 && (imprOrd === 2 && modeleOrd === 9);
  const useDesign10 = !forceDesign3 && (imprOrd === 2 && modeleOrd === 8);
  const useDesign9 = !forceDesign3 && (imprOrd === 2 && modeleOrd === 7);
  const useDesign8 = !forceDesign3 && (imprOrd === 2 && modeleOrd === 6);
  const useDesign7 = !forceDesign3 && (imprOrd === 2 && modeleOrd === 5);
  const useDesign6 = !forceDesign3 && (imprOrd === 2 && modeleOrd === 4);
  const useDesign5 = !forceDesign3 && (imprOrd === 2 && modeleOrd === 3);
  const useDesign4 = !forceDesign3 && (imprOrd === 2 && modeleOrd === 2);
  const useDesign3 = forceDesign3 || (imprOrd === 2 && modeleOrd === 1);
  const useDesign2 = !forceDesign3 && (imprOrd === 1 && modeleOrd === 2);
  const useDesign1 = (!useDesign12 && !useDesign11 && !useDesign10 && !useDesign9 && !useDesign8 && !useDesign7 && !useDesign6 && !useDesign5 && !useDesign4 && !useDesign3 && !useDesign2);

  const pageSizeCss = (forceDesign3 || imprOrd === 2) ? 'A5 portrait' : 'A4 portrait';

  let bodyContentHtml = '';
  if (useDesign12) {
    bodyContentHtml = renderModele12Html(paramsWithBarcode);
  } else if (useDesign11) {
    bodyContentHtml = renderModele11Html(paramsWithBarcode);
  } else if (useDesign10) {
    bodyContentHtml = renderModele10Html(paramsWithBarcode);
  } else if (useDesign9) {
    bodyContentHtml = renderModele9Html(paramsWithBarcode);
  } else if (useDesign8) {
    bodyContentHtml = renderModele8Html(paramsWithBarcode);
  } else if (useDesign7) {
    bodyContentHtml = renderModele7Html(paramsWithBarcode);
  } else if (useDesign6) {
    bodyContentHtml = renderModele6Html(paramsWithBarcode);
  } else if (useDesign5) {
    bodyContentHtml = renderModele5Html(paramsWithBarcode);
  } else if (useDesign4) {
    bodyContentHtml = renderModele4Html(paramsWithBarcode);
  } else if (useDesign3) {
    bodyContentHtml = renderModele3Html(paramsWithBarcode);
  } else if (useDesign2) {
    bodyContentHtml = renderModele2Html(paramsWithBarcode);
  } else {
    bodyContentHtml = renderModele1Html(paramsWithBarcode);
  }

  const pageTitle = params.documentTitle || (isBilanPrint ? 'Demande de Bilan' : 'Ordonnance Médicale');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${pageTitle} - ${assureName}</title>
        <style>
          @page { size: ${pageSizeCss}; margin: 10mm 5mm 5mm 5mm; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            color: #000;
            background: #fff;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .prescription-body {
            flex: 1 0 auto;
          }
          .footer-wrapper {
            flex-shrink: 0;
            margin-top: ${imprOrd === 2 ? '10px' : '30px'};
          }
          .yellow-banner {
            background-color: #ffff00 !important;
            color: #000 !important;
            font-weight: bold;
            font-size: 11.5px;
            line-height: 1.35;
            padding: 8px 12px;
            max-width: 78%;
            display: inline-block;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .slogan-blue {
            color: #0000ff !important;
            text-align: center;
            font-size: 14.5px;
            font-weight: 500;
            margin-top: 18px;
            margin-bottom: 10px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .software-credit {
            font-size: 8px;
            color: #777;
            font-family: sans-serif;
            margin-top: 6px;
          }
          @media print {
            @page { size: ${pageSizeCss}; margin: 10mm 5mm 5mm 5mm; }
            body { margin: 0; padding: 0; }
            .yellow-banner { background-color: #ffff00 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .slogan-blue { color: #0000ff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        </style>
      </head>
      <body>
        <div class="prescription-body">
          ${bodyContentHtml}
        </div>

        <!-- Footer Area -->
        <div class="footer-wrapper">
          ${useDesign12 ? `
            <div style="border-bottom: 2px solid #000; width: 100%; margin-bottom: 10px;"></div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1; text-align: center; font-size: 15px; font-weight: bold; color: #000; font-family: 'Segoe UI', Arial, sans-serif; padding-right: 15px;">
                ${msgOrd || "Message pour cloturer l'ordonnance"}
              </div>
              <div style="text-align: right; flex-shrink: 0;">
                ${barcodeSvg}
              </div>
            </div>
          ` : useDesign11 ? `
            <div style="text-align: center; font-size: 14.5px; font-weight: bold; color: #000; font-family: 'Segoe UI', Arial, sans-serif; margin-bottom: 5px;">
              ${msgOrd || "Message pour cloturer l'ordonnance"}
            </div>
            <div style="text-align: center; font-size: 12.5px; color: #222; font-family: 'Segoe UI', Arial, sans-serif; display: flex; justify-content: center; align-items: center; gap: 15px;">
              <span>${addressFr || 'Adresse du cabinet du docteur'}</span>
              <span>📞 ${phoneFixe || '0558 413 240'}</span>
              <span>✉️ ${clinicInfo?.email || 'adel.slougui@yahoo.fr'}</span>
            </div>
          ` : useDesign9 ? `
            ${msgOrd ? `<div style="text-align: center; font-size: 14px; font-weight: bold; color: #000; font-family: 'Segoe UI', Arial, sans-serif;">${msgOrd}</div>` : ''}
          ` : useDesign8 ? `
            <div style="border: 1px solid #777; padding: 6px 15px; font-size: 13.5px; color: #111; font-family: 'Segoe UI', Arial, sans-serif; display: flex; justify-content: space-between; align-items: center;">
              <div>${addressFr || 'Adresse du cabinet du docteur'}</div>
              <div>${phoneFixe || '0558 413 240'}</div>
            </div>
          ` : useDesign7 ? `
            <div style="background: #00008b; color: #fff; text-align: center; padding: 7px 10px; font-size: 15px; font-weight: bold; font-family: 'Segoe UI', Arial, sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
              ${msgOrd || "Message pour cloturer l'ordonnance"}
            </div>
            <div style="border-bottom: 2px solid #ff0000; width: 100%; margin-top: 2px; margin-bottom: 6px;"></div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; color: #111; font-family: 'Segoe UI', Arial, sans-serif;">
              <div style="flex: 1;"></div>
              <div style="text-align: center; line-height: 1.35;">
                ${addressFr || 'Adreese du cabinet du docteur'}<br/>
                ${clinicInfo?.email || 'adel.slougui@yahoo.fr'}
              </div>
              <div style="flex: 1; text-align: right;">
                Page 1/1
              </div>
            </div>
          ` : useDesign6 ? `
            <div style="border-bottom: 1.5px solid #000; width: 100%; margin-bottom: 6px;"></div>
            <div style="text-align: center; font-style: italic; font-size: 13px; color: #111; font-family: 'Segoe UI', Arial, sans-serif;">
              ${addressFr || 'Adreese du cabinet du docteur'}
            </div>
            <div style="display: flex; justify-content: space-between; font-style: italic; font-size: 12.5px; color: #111; font-family: 'Segoe UI', Arial, sans-serif; margin-top: 3px;">
              <div>Mobile : ${phoneFixe || '0558 413 240'}</div>
              <div>Émail : ${clinicInfo?.email || 'adel.slougui@yahoo.fr'}</div>
            </div>
          ` : useDesign4 ? `
            <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 10px;">
              <div style="font-size: 15px; font-weight: bold; color: #000; font-family: 'Segoe UI', Arial, sans-serif;">
                ${msgOrd || "Message pour cloturer l'ordonnance"}
              </div>
              <div style="text-align: right;">
                ${barcodeSvg}
              </div>
            </div>
          ` : (useDesign3 || useDesign5 || useDesign10) ? `
            <div style="border-bottom: 2px solid #000; width: 100%; margin-bottom: 4px;"></div>
            <div style="text-align: center; font-size: 15px; font-weight: bold; color: #000; font-family: 'Segoe UI', Arial, sans-serif;">
              ${msgOrd || "Message pour cloturer l'ordonnance"}
            </div>
          ` : `
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
              <div class="yellow-banner">
                ${msgJaune}
              </div>
              <div style="text-align: right;">
                ${clinicLogo ? `<img src="${clinicLogo}" style="max-height: 65px; max-width: 180px; object-fit: contain;" />` : `
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <svg width="45" height="45" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="45" stroke="#0d9488" stroke-width="4" fill="none"/>
                      <path d="M45 25 C30 25 20 40 20 55 C20 70 35 75 50 65 C60 58 55 45 45 45" stroke="#0d9488" stroke-width="5" fill="none" stroke-linecap="round"/>
                      <text x="35" y="65" font-family="Arial, sans-serif" font-size="26" font-weight="900" fill="#0f766e">ORL</text>
                    </svg>
                    <div style="text-align: left;">
                      <div style="font-size: 13px; font-weight: 900; color: #0f766e; letter-spacing: -0.5px;">${(clinicInfo?.doctorNameFr || doctor || '').toUpperCase()}</div>
                      <div style="font-size: 9px; font-weight: bold; color: #0d9488; text-transform: uppercase; letter-spacing: 0.3px;">Spécialiste en ORL</div>
                    </div>
                  </div>
                `}
              </div>
            </div>

            <div class="slogan-blue">
              ${msgOrd}
            </div>

            <div class="software-credit">
              Logiciel réalisé par Bouledroua Amor TEL : 0778.750.333
            </div>
          `}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
      </body>
    </html>
  `;
}

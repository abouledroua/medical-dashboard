const fs = require('fs');

const file = 'c:/Users/amorb/.gemini/antigravity-ide/scratch/medical-dashboard/src/components/PatientOverviewPanel.jsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const startIdx = lines.findIndex(l => l.includes('<form onSubmit={handleSaveVitals} className="space-y-4 text-xs">'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('</form>'));

const importsToAdd = `
import ObservationTab from './PatientOverview/ObservationTab';
import AntecedentsTab from './PatientOverview/AntecedentsTab';
import VitalsTab from './PatientOverview/VitalsTab';
import MeasurementsTab from './PatientOverview/MeasurementsTab';
import DietTab from './PatientOverview/DietTab';
import ObstetricsTab from './PatientOverview/ObstetricsTab';
import ConsultDiagnosisTab from './PatientOverview/ConsultDiagnosisTab';
import GeneralDiagnosisTab from './PatientOverview/GeneralDiagnosisTab';
`;

const replacement = `            <form onSubmit={handleSaveVitals} className="space-y-4 text-xs">
              {activeTab === 'observation' && (
                <ObservationTab
                  lang={lang}
                  editComplaint={editComplaint} setEditComplaint={setEditComplaint}
                  isSaving={isSaving} onSave={handleSaveVitals}
                  loadingObservations={loadingObservations}
                  patientObservations={patientObservations}
                  onDeleteObservation={handleDeleteObservation}
                />
              )}
              {activeTab === 'antecedent' && (
                <AntecedentsTab
                  lang={lang}
                  newPersonalInput={newPersonalInput} setNewPersonalInput={setNewPersonalInput}
                  showPersonalDropdown={showPersonalDropdown} setShowPersonalDropdown={setShowPersonalDropdown}
                  handleAddPersonalAntecedent={handleAddPersonalAntecedent}
                  personalDbSuggestions={personalDbSuggestions}
                  personalListState={personalListState}
                  handleDeletePersonalAntecedent={handleDeletePersonalAntecedent}
                  
                  newFamilyInput={newFamilyInput} setNewFamilyInput={setNewFamilyInput}
                  showFamilyDropdown={showFamilyDropdown} setShowFamilyDropdown={setShowFamilyDropdown}
                  handleAddFamilyAntecedent={handleAddFamilyAntecedent}
                  familyDbSuggestions={familyDbSuggestions}
                  familyListState={familyListState}
                  handleDeleteFamilyAntecedent={handleDeleteFamilyAntecedent}
                  
                  newAllergyInput={newAllergyInput} setNewAllergyInput={setNewAllergyInput}
                  showAllergyDropdown={showAllergyDropdown} setShowAllergyDropdown={setShowAllergyDropdown}
                  handleAddAllergy={handleAddAllergy}
                  allergyDbSuggestions={allergyDbSuggestions}
                  allergyListState={allergyListState}
                  handleDeleteAllergy={handleDeleteAllergy}
                />
              )}
              {activeTab === 'taBattement' && (
                <VitalsTab
                  lang={lang}
                  editBP={editBP} setEditBP={setEditBP}
                  editHR={editHR} setEditHR={setEditHR}
                  editO2={editO2} setEditO2={setEditO2}
                  editGlucose={editGlucose} setEditGlucose={setEditGlucose}
                  isSaving={isSaving} onSave={handleSaveVitals}
                  loadingVitalsHistory={loadingVitalsHistory}
                  vitalsHistory={vitalsHistory}
                  onDeleteVitals={handleDeleteVitals}
                />
              )}
              {activeTab === 'mensurations' && (
                <MeasurementsTab
                  lang={lang}
                  editTaille={editTaille} setEditTaille={setEditTaille}
                  editPoids={editPoids} setEditPoids={setEditPoids}
                  editPerimCran={editPerimCran} setEditPerimCran={setEditPerimCran}
                  isSaving={isSaving} onSave={handleSaveVitals}
                  loadingHeights={loadingHeights}
                  loadingWeights={loadingWeights}
                  loadingHeadCircs={loadingHeadCircs}
                  combinedMensurationsHistory={combinedMensurationsHistory}
                  onDeleteHeight={handleDeleteHeight}
                  onDeleteWeight={handleDeleteWeight}
                  onDeleteHeadCirc={handleDeleteHeadCirc}
                />
              )}
              {activeTab === 'alimentation' && (
                <DietTab
                  lang={lang} t={t}
                  editAlimentation={editAlimentation} setEditAlimentation={setEditAlimentation}
                  isSaving={isSaving} onSave={handleSaveVitals}
                />
              )}
              {activeTab === 'ddrDpa' && (
                <ObstetricsTab
                  lang={lang}
                  editDDR={editDDR} setEditDDR={setEditDDR}
                  editDPA={editDPA} setEditDPA={setEditDPA}
                  isSaving={isSaving} onSave={handleSaveVitals}
                />
              )}
              {activeTab === 'diagConsult' && (
                <ConsultDiagnosisTab
                  lang={lang}
                  editDiagConsult={editDiagConsult} setEditDiagConsult={setEditDiagConsult}
                  isSaving={isSaving} onSave={handleSaveVitals}
                  loadingDiagConsults={loadingDiagConsults}
                  patientDiagConsults={patientDiagConsults}
                  onDeleteDiagConsult={handleDeleteDiagConsult}
                />
              )}
              {activeTab === 'explorConsult' && (
                <GeneralDiagnosisTab
                  lang={lang} t={t}
                  editExplorConsult={editExplorConsult} setEditExplorConsult={setEditExplorConsult}
                  isSaving={isSaving} onSave={handleSaveVitals}
                  loadingNutritions={loadingNutritions}
                  patientNutritions={patientNutritions}
                  onDeleteNutrition={handleDeleteNutrition}
                />
              )}
            </form>`;

if (startIdx !== -1 && endIdx !== -1) {
    lines.splice(startIdx, endIdx - startIdx + 1, replacement);
    const finalCode = lines.join('\n');
    const importIndex = finalCode.indexOf("import { translations");
    const finalCodeWithImports = finalCode.slice(0, importIndex) + importsToAdd + finalCode.slice(importIndex);
    fs.writeFileSync(file, finalCodeWithImports);
    console.log("Success");
} else {
    console.log("Failed to find start or end index.");
}

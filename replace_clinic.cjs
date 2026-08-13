const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'ClinicSettings.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Imports to add
const imports = `
import GeneralInfoTab from './ClinicSettings/GeneralInfoTab';
import ThemeTab from './ClinicSettings/ThemeTab';
import PrintSettingsTab from './ClinicSettings/PrintSettingsTab';
import ImagesLogoTab from './ClinicSettings/ImagesLogoTab';
import OptionsTab from './ClinicSettings/OptionsTab';
`;

// Insert imports after the lucide-react import
content = content.replace(/import \{.*?\} from 'lucide-react';/, match => match + '\n' + imports);

// Extract parts
// We need to replace from `{activeSection === 'informations' && (` 
// to the end of the `options` section, just before `activeSection === 'users'`

const replacementMap = [
  {
    start: `{activeSection === 'informations' && (`,
    end: `        {activeSection === 'theme' && (() => {`,
    replacement: `{activeSection === 'informations' && (
          <GeneralInfoTab
            lang={lang}
            t={t}
            formData={formData}
            handleChange={handleChange}
            handleArabicFocus={handleArabicFocus}
            handleArabicBlur={handleArabicBlur}
          />
        )}

        {activeSection === 'theme' && (() => {`
  },
  {
    start: `{activeSection === 'theme' && (() => {`,
    end: `        {activeSection === 'print' && (`,
    replacement: `{activeSection === 'theme' && (
          <ThemeTab
            lang={lang}
            currentTheme={currentTheme}
            onThemeChange={onThemeChange}
          />
        )}

        {activeSection === 'print' && (`
  },
  {
    start: `{activeSection === 'print' && (`,
    end: `        {activeSection === 'images_logo' && (`,
    replacement: `{activeSection === 'print' && (
          <PrintSettingsTab
            t={t}
            formData={formData}
            handleChange={handleChange}
            typePapierRdv={typePapierRdv}
            setTypePapierRdv={setTypePapierRdv}
          />
        )}

        {activeSection === 'images_logo' && (`
  },
  {
    start: `{activeSection === 'images_logo' && (`,
    end: `        {activeSection === 'options' && (`,
    replacement: `{activeSection === 'images_logo' && (
          <ImagesLogoTab
            t={t}
            logo={logo}
            header={header}
            badge={badge}
            setLogo={setLogo}
            setHeader={setHeader}
            setBadge={setBadge}
            handleImageChange={handleImageChange}
          />
        )}

        {activeSection === 'options' && (`
  },
  {
    start: `{activeSection === 'options' && (`,
    end: `        {activeSection === 'users' && (`,
    replacement: `{activeSection === 'options' && (
          <OptionsTab
            t={t}
            lang={lang}
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            handleSave={handleSave}
            debounceTimeout={debounceTimeout}
          />
        )}

        {activeSection === 'users' && (`
  }
];

let replacedCount = 0;
replacementMap.forEach(r => {
  const startIndex = content.indexOf(r.start);
  const endIndex = content.indexOf(r.end, startIndex);
  if (startIndex !== -1 && endIndex !== -1) {
    content = content.slice(0, startIndex) + r.replacement + content.slice(endIndex + r.end.length);
    replacedCount++;
  }
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done replacing. Replacements made:', replacedCount);

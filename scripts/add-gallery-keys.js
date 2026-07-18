const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '../messages');
const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json'));

const translations = {
  en: { limitReached: "Limit Reached", ok: "OK", submitSelections: "Submit Selections", cancel: "Cancel", confirm: "Confirm" },
  tr: { limitReached: "Limita Ulaşıldı", ok: "Tamam", submitSelections: "Seçimleri Gönder", cancel: "İptal", confirm: "Onayla" },
  ar: { limitReached: "تم الوصول للحد", ok: "موافق", submitSelections: "إرسال الاختيارات", cancel: "إلغاء", confirm: "تأكيد" },
  ru: { limitReached: "Достигнут лимит", ok: "ОК", submitSelections: "Отправить выбор", cancel: "Отмена", confirm: "Подтвердить" },
  es: { limitReached: "Límite Alcanzado", ok: "OK", submitSelections: "Enviar Selecciones", cancel: "Cancelar", confirm: "Confirmar" },
  fr: { limitReached: "Limite Atteinte", ok: "OK", submitSelections: "Soumettre les Sélections", cancel: "Annuler", confirm: "Confirmer" },
  de: { limitReached: "Limit Erreicht", ok: "OK", submitSelections: "Auswahl senden", cancel: "Abbrechen", confirm: "Bestätigen" },
  ro: { limitReached: "Limită Atingă", ok: "OK", submitSelections: "Trimite Selecțiile", cancel: "Anulează", confirm: "Confirmă" },
  zh: { limitReached: "达到限制", ok: "确定", submitSelections: "提交选择", cancel: "取消", confirm: "确认" }
};

for (const file of files) {
  const lang = path.basename(file, '.json');
  const filePath = path.join(messagesDir, file);
  
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (content.account && content.account.gallery) {
    const t = translations[lang] || translations['en'];
    content.account.gallery.limitReached = content.account.gallery.limitReached || t.limitReached;
    content.account.gallery.ok = content.account.gallery.ok || t.ok;
    content.account.gallery.submitSelections = content.account.gallery.submitSelections || t.submitSelections;
    content.account.gallery.cancel = content.account.gallery.cancel || t.cancel;
    content.account.gallery.confirm = content.account.gallery.confirm || t.confirm;
    
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Updated ${file}`);
  }
}
